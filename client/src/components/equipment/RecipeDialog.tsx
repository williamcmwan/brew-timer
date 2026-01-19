import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Copy } from "lucide-react";
import type { Recipe, RecipeStep, RecipeTemplate } from "@/contexts/AppContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const recipeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  ratio: z.string().trim().min(1, "Ratio is required").max(20),
  dose: z.number({ required_error: "Dose is required", invalid_type_error: "Dose must be a number" })
    .min(1, "Dose must be at least 1g").max(1000),
  photo: z.string().optional().or(z.literal("")),
  process: z.string().trim().optional().or(z.literal("")),
  water: z.number({ required_error: "Water is required", invalid_type_error: "Water must be a number" })
    .min(1, "Water must be at least 1g").max(10000),
  temperature: z.number({ required_error: "Temperature is required", invalid_type_error: "Temperature must be a number" })
    .min(1, "Temperature must be at least 1°C").max(100),
  brewTime: z.string().trim().min(1, "Brew time is required").max(20),
  brewingMethod: z.string().optional().or(z.literal("")),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface RecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  isCloning?: boolean;
}

// Helper to format duration in seconds to display string
const formatDuration = (seconds: number): string => {
  if (seconds >= 60) {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  return seconds.toString();
};

// Helper to parse time string to seconds
const parseDuration = (val: string): number => {
  if (val === '' || val === ':') return 0;
  if (val.includes(':')) {
    const parts = val.split(':');
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return parseInt(val, 10) || 0;
};

export function RecipeDialog({ open, onOpenChange, recipe, isCloning = false }: RecipeDialogProps) {
  const { addRecipe, updateRecipe, templates } = useApp();
  const { toast } = useToast();
  const [processSteps, setProcessSteps] = useState<RecipeStep[]>([
    { description: "", waterAmount: 0, duration: 30 }
  ]);
  // Track raw elapsed time input values to allow free editing
  const [elapsedTimeInputs, setElapsedTimeInputs] = useState<Record<number, string>>({});
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [brewingMethod, setBrewingMethod] = useState("");
  const [customBrewingMethod, setCustomBrewingMethod] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // State for water update confirmation dialog
  const [showWaterUpdateDialog, setShowWaterUpdateDialog] = useState(false);
  const [pendingWaterChange, setPendingWaterChange] = useState<{ oldWater: number; newWater: number } | null>(null);
  const previousWaterRef = useRef<number | null>(null);

  // Brewing method options (sorted alphabetically)
  const brewingMethodOptions = [
    "Aeropress",
    "Chemex",
    "Clever Dripper",
    "French Press",
    "Hario Switch",
    "Kalita Wave",
    "Orea",
    "Origami",
    "V60",
    "Others"
  ];

  // No need to fetch templates - they're already in context

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: "",
      ratio: "1:16",
      dose: 15,
      photo: "",
      process: "",
      water: 240,
      temperature: 93,
      brewTime: "3:00",
    },
  });

  const photo = watch("photo");
  const ratio = watch("ratio");
  const dose = watch("dose");
  const water = watch("water");

  // Track which field was last manually edited to determine auto-calculation direction
  const [lastEditedField, setLastEditedField] = useState<"ratio" | "water" | null>(null);

  // Helper function to parse ratio string (e.g., "1:16") and return the multiplier
  const parseRatio = (ratioStr: string): number | null => {
    try {
      const parts = ratioStr.split(':');
      if (parts.length === 2) {
        const coffeeRatio = parseFloat(parts[0]);
        const waterRatio = parseFloat(parts[1]);
        if (!isNaN(coffeeRatio) && !isNaN(waterRatio) && coffeeRatio > 0) {
          return waterRatio / coffeeRatio;
        }
      }
    } catch (e) {
      // Invalid ratio format
    }
    return null;
  };

  // Calculate water from dose and ratio
  const calculateWaterFromRatio = (doseAmount: number, ratioStr: string): number | null => {
    const multiplier = parseRatio(ratioStr);
    if (multiplier !== null && doseAmount > 0) {
      return Math.round(doseAmount * multiplier);
    }
    return null;
  };

  // Calculate ratio from dose and water
  const calculateRatioFromWater = (doseAmount: number, waterAmount: number): string | null => {
    if (doseAmount > 0 && waterAmount > 0) {
      const ratioValue = waterAmount / doseAmount;
      // Format as "1:X" where X is rounded to 1 decimal
      return `1:${ratioValue.toFixed(1)}`;
    }
    return null;
  };

  // Effect to auto-calculate water from dose and ratio
  useEffect(() => {
    if (!dose || dose <= 0) return;

    // Calculate water from dose and ratio (when either changes)
    const calculatedWater = calculateWaterFromRatio(dose, ratio);
    if (calculatedWater !== null && calculatedWater !== water) {
      setValue("water", calculatedWater);
    }
  }, [dose, ratio, setValue]);

  // Handler to update step water amounts proportionally
  const handleUpdateStepWater = (oldWater: number, newWater: number) => {
    if (oldWater === 0 || newWater === 0) return;

    const ratioValue = newWater / oldWater;

    // Create a deep copy of steps to modify
    let newSteps = processSteps.map(step => ({ ...step }));

    // First pass: Calculate proportional water for each step
    newSteps = newSteps.map(step => ({
      ...step,
      waterAmount: Math.round((step.waterAmount || 0) * ratioValue)
    }));

    // Fix rounding errors to ensure total matches newWater
    const currentSum = newSteps.reduce((sum, step) => sum + (step.waterAmount || 0), 0);
    const difference = newWater - currentSum;

    if (difference !== 0 && newSteps.length > 0) {
      // Find the last step that has water to add the difference to
      let targetIndex = -1;
      for (let i = newSteps.length - 1; i >= 0; i--) {
        if ((newSteps[i].waterAmount || 0) > 0) {
          targetIndex = i;
          break;
        }
      }

      // If no step has water (unlikely but possible), fall back to the last step
      if (targetIndex === -1) {
        targetIndex = newSteps.length - 1;
      }

      const targetStep = newSteps[targetIndex];
      newSteps[targetIndex] = {
        ...targetStep,
        waterAmount: (targetStep.waterAmount || 0) + difference
      };
    }

    // Update descriptions based on changes - handle both step amount and cumulative amount
    // We need to calculate cumulative amounts for both old and new steps
    let oldCumulative = 0;
    let newCumulative = 0;

    newSteps = newSteps.map((newStep, index) => {
      const oldStep = processSteps[index];
      const oldStepAmount = oldStep.waterAmount || 0;
      const newStepAmount = newStep.waterAmount || 0;

      oldCumulative += oldStepAmount;
      newCumulative += newStepAmount;

      let description = newStep.description;

      const replacements: { start: number, end: number, oldVal: number, newVal: number }[] = [];

      // Helper to find matches
      const addMatches = (val: number, newVal: number) => {
        if (val <= 0 || val === newVal) return;

        // Regex to match value with optional unit
        const regex = new RegExp(`\\b${val}\\s*(g|ml|grams|milliliters)?\\b`, 'gi');
        let match;
        while ((match = regex.exec(description)) !== null) {
          replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            oldVal: val,
            newVal: newVal
          });
        }
      };

      addMatches(oldStepAmount, newStepAmount);
      // Only check cumulative if it's different from step amount (avoid double counting)
      if (oldCumulative !== oldStepAmount) {
        addMatches(oldCumulative, newCumulative);
      }

      // Sort replacements by start index descending to allow in-place replacement
      replacements.sort((a, b) => b.start - a.start);

      // Apply replacements
      let lastStart = description.length + 1;

      replacements.forEach(rep => {
        if (rep.end <= lastStart) { // Ensure no overlap with previously replaced (later) segment
          const before = description.substring(0, rep.start);
          const after = description.substring(rep.end);
          const originalMatch = description.substring(rep.start, rep.end);
          // Extract unit from original match
          const unitMatch = originalMatch.match(/[a-z]+/i);
          const unit = unitMatch ? unitMatch[0] : '';

          // Extract spacing (unlikely to vary much but good for precision)
          const numberPart = originalMatch.replace(/[a-z]+/i, '');
          const spacing = numberPart.replace(/[0-9.]/g, '');

          const replacementText = `${rep.newVal}${spacing}${unit}`;

          description = before + replacementText + after;
          lastStart = rep.start;
        }
      });

      return {
        ...newStep,
        description
      };
    });

    setProcessSteps(newSteps);

    toast({
      title: "Steps updated",
      description: `Water amounts in all steps have been adjusted proportionally.`
    });
  };

  // Check if water changed and prompt user to update steps
  const checkWaterChangeAndPrompt = () => {
    const currentWater = water;
    const prevWater = previousWaterRef.current;

    // Only show dialog if:
    // 1. There was a previous water value
    // 2. The water value has changed
    // 3. There are steps with water amounts defined
    // 4. The total step water is > 0
    if (
      prevWater !== null &&
      currentWater !== prevWater &&
      processSteps.length > 0
    ) {
      const totalStepWater = processSteps.reduce((sum, step) => sum + (step.waterAmount || 0), 0);
      if (totalStepWater > 0) {
        setPendingWaterChange({ oldWater: prevWater, newWater: currentWater });
        setShowWaterUpdateDialog(true);
      }
    }

    // Update the ref after processing
    previousWaterRef.current = currentWater;
  };

  // Handler for dose/ratio blur - check water change after auto-calculation completes
  const handleDoseRatioBlur = () => {
    // Use setTimeout to ensure the water value has been updated by the effect first
    setTimeout(() => {
      checkWaterChangeAndPrompt();
    }, 0);
  };

  // Handler for water field blur
  const handleWaterBlur = () => {
    checkWaterChangeAndPrompt();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const apiUrl = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3005');
      const guestId = localStorage.getItem('coffee-timer-guest-id');

      const response = await fetch(`${apiUrl}/api/recipes/upload-photo`, {
        method: 'POST',
        headers: {
          'X-Guest-ID': guestId || '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setValue('photo', data.path);
      toast({
        title: "Photo uploaded",
        description: "Photo has been uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Scroll to first validation error
  const onFormError = (formErrors: typeof errors) => {
    const firstErrorKey = Object.keys(formErrors)[0];
    if (firstErrorKey) {
      const element = document.getElementById(firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
    }
  };

  useEffect(() => {
    if (open) {
      if (recipe) {
        reset({
          name: isCloning ? `${recipe.name} (Copy)` : recipe.name,
          ratio: recipe.ratio,
          dose: recipe.dose,
          photo: recipe.photo || "",
          process: recipe.process || "",
          water: recipe.water,
          temperature: recipe.temperature,
          brewTime: recipe.brewTime,
          brewingMethod: recipe.brewingMethod || "",
        });
        setShareToCommunity(recipe.shareToCommunity || false);

        // Handle brewing method
        if (recipe.brewingMethod) {
          if (brewingMethodOptions.includes(recipe.brewingMethod)) {
            setBrewingMethod(recipe.brewingMethod);
            setCustomBrewingMethod("");
          } else {
            setBrewingMethod("Others");
            setCustomBrewingMethod(recipe.brewingMethod);
          }
        } else {
          setBrewingMethod("");
          setCustomBrewingMethod("");
        }

        if (recipe.processSteps && recipe.processSteps.length > 0) {
          setProcessSteps([...recipe.processSteps]);
          const inputs: Record<number, string> = {};
          recipe.processSteps.forEach((step, index) => {
            inputs[index] = formatDuration(step.duration);
          });
          setElapsedTimeInputs(inputs);
        }
        // Initialize the previous water reference
        previousWaterRef.current = recipe.water;
      } else {
        reset();
        setShareToCommunity(false);
        setBrewingMethod("");
        setCustomBrewingMethod("");
        setProcessSteps([{ description: "", waterAmount: 0, duration: 30 }]);
        setElapsedTimeInputs({ 0: "30" });
        // Initialize the previous water reference for new recipes
        previousWaterRef.current = 240;
      }
    }
  }, [recipe, isCloning, reset, open]);

  const onSubmit = async (data: RecipeFormData) => {
    const finalBrewingMethod = brewingMethod === "Others" ? customBrewingMethod : brewingMethod;

    const recipeData = {
      ...data,
      processSteps: processSteps.filter(step => step.description.trim() !== ""),
      shareToCommunity,
      brewingMethod: finalBrewingMethod || undefined
    };

    try {
      if (recipe && !isCloning) {
        await updateRecipe(recipe.id, recipeData);
        toast({ title: "Recipe updated", description: "Recipe has been updated successfully" });
      } else {
        await addRecipe(recipeData as Omit<Recipe, "id">);
        toast({ title: isCloning ? "Recipe cloned" : "Recipe added", description: isCloning ? "Recipe has been cloned successfully" : "Recipe has been added successfully" });
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recipe",
        variant: "destructive"
      });
    }
  };

  const addStep = () => {
    const newIndex = processSteps.length;
    setProcessSteps([...processSteps, { description: "", waterAmount: 0, duration: 30 }]);
    setElapsedTimeInputs(prev => ({ ...prev, [newIndex]: "30" }));
  };

  const insertStepBefore = (index: number) => {
    const newSteps = [...processSteps];
    newSteps.splice(index, 0, { description: "", waterAmount: 0, duration: 30 });
    setProcessSteps(newSteps);

    // Shift elapsed time inputs for steps at and after the insertion point
    const newInputs: Record<number, string> = {};
    Object.keys(elapsedTimeInputs).forEach(key => {
      const keyNum = parseInt(key, 10);
      if (keyNum < index) {
        newInputs[keyNum] = elapsedTimeInputs[keyNum];
      } else {
        newInputs[keyNum + 1] = elapsedTimeInputs[keyNum];
      }
    });
    newInputs[index] = "30";
    setElapsedTimeInputs(newInputs);
  };

  const insertStepAfter = (index: number) => {
    const newSteps = [...processSteps];
    newSteps.splice(index + 1, 0, { description: "", waterAmount: 0, duration: 30 });
    setProcessSteps(newSteps);

    // Shift elapsed time inputs for steps after the insertion point
    const newInputs: Record<number, string> = {};
    Object.keys(elapsedTimeInputs).forEach(key => {
      const keyNum = parseInt(key, 10);
      if (keyNum <= index) {
        newInputs[keyNum] = elapsedTimeInputs[keyNum];
      } else {
        newInputs[keyNum + 1] = elapsedTimeInputs[keyNum];
      }
    });
    newInputs[index + 1] = "30";
    setElapsedTimeInputs(newInputs);
  };

  const removeStep = (index: number) => {
    if (processSteps.length > 1) {
      setProcessSteps(processSteps.filter((_, i) => i !== index));
      const newInputs: Record<number, string> = {};
      Object.keys(elapsedTimeInputs).forEach(key => {
        const keyNum = parseInt(key, 10);
        if (keyNum < index) {
          newInputs[keyNum] = elapsedTimeInputs[keyNum];
        } else if (keyNum > index) {
          newInputs[keyNum - 1] = elapsedTimeInputs[keyNum];
        }
      });
      setElapsedTimeInputs(newInputs);
    }
  };

  const updateStep = (index: number, field: keyof RecipeStep, value: string | number | undefined) => {
    const newSteps = [...processSteps];
    if (value === undefined) {
      // Remove the field if value is undefined
      const { [field]: _, ...rest } = newSteps[index];
      newSteps[index] = rest as RecipeStep;
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value };
    }
    setProcessSteps(newSteps);
  };

  const handleCopyFromTemplate = async (template: RecipeTemplate) => {
    // Directly create recipe from template without opening the form
    try {
      const recipeData = {
        name: template.name,
        ratio: template.ratio,
        dose: template.dose,
        photo: template.photo || "",
        process: template.process || "",
        water: template.water,
        temperature: template.temperature,
        brewTime: template.brewTime,
        // Spread all step properties to ensure nothing is lost
        processSteps: template.processSteps ? template.processSteps.map(step => ({ ...step })) : []
      };

      await addRecipe(recipeData as Omit<Recipe, "id">);
      toast({
        title: "Recipe added",
        description: `"${template.name}" has been added to your recipes`
      });
      onOpenChange(false);
      reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add recipe",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCloning ? "Clone Recipe" : recipe ? "Edit Recipe" : "Add Recipe"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-4">
            {!recipe && !isCloning && templates.length > 0 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Add from Community Recipes
                </Button>
                {showTemplatePicker && (
                  <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto bg-muted/50">
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => handleCopyFromTemplate(template)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {template.photo ? (
                            <img
                              src={template.photo}
                              alt={template.name}
                              className="w-8 h-8 rounded object-cover shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">—</div>
                          )}
                          <div className="truncate">
                            {template.name}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1. Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register("name")} placeholder="e.g., Morning V60" />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            {/* 2. Brewing Method */}
            <div className="space-y-2">
              <Label htmlFor="brewingMethod">Brewing Method</Label>
              <Select value={brewingMethod} onValueChange={setBrewingMethod}>
                <SelectTrigger id="brewingMethod">
                  <SelectValue placeholder="Select brewing method" />
                </SelectTrigger>
                <SelectContent>
                  {brewingMethodOptions.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {brewingMethod === "Others" && (
                <Input
                  placeholder="Enter custom brewing method"
                  value={customBrewingMethod}
                  onChange={(e) => setCustomBrewingMethod(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* 3. Temperature & Brew Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temp (°C) *</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="any"
                  {...register("temperature", { valueAsNumber: true })}
                />
                {errors.temperature && <p className="text-sm text-destructive">{errors.temperature.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brewTime">Brew Time *</Label>
                <Input id="brewTime" {...register("brewTime")} placeholder="3:00" />
                {errors.brewTime && <p className="text-sm text-destructive">{errors.brewTime.message}</p>}
              </div>
            </div>

            {/* 4. Ratio & Dose */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ratio">Ratio *</Label>
                <Input
                  id="ratio"
                  {...register("ratio")}
                  placeholder="1:16"
                  onFocus={() => setLastEditedField("ratio")}
                  onBlur={handleDoseRatioBlur}
                />
                {errors.ratio && <p className="text-sm text-destructive">{errors.ratio.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dose">Dose (g) *</Label>
                <Input
                  id="dose"
                  type="number"
                  step="any"
                  {...register("dose", { valueAsNumber: true })}
                  onBlur={handleDoseRatioBlur}
                />
                {errors.dose && <p className="text-sm text-destructive">{errors.dose.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="water">Water (g) *</Label>
              <Input
                id="water"
                type="number"
                step="any"
                {...register("water", { valueAsNumber: true })}
                onFocus={() => setLastEditedField("water")}
                onBlur={handleWaterBlur}
              />
              <p className="text-xs text-muted-foreground">Auto-calculated from dose & ratio, or edit to update ratio</p>
              {errors.water && <p className="text-sm text-destructive">{errors.water.message}</p>}
            </div>

            {/* 6. Photo */}
            <div className="space-y-2">
              <Label htmlFor="photoUpload">Photo</Label>
              <div className="flex gap-2">
                <Input
                  id="photoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="flex-1"
                />
                {uploadingPhoto && <span className="text-sm text-muted-foreground">Uploading...</span>}
              </div>
              {photo && (
                <div className="mt-2">
                  <img
                    src={photo}
                    alt="Recipe preview"
                    className="w-full h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}
            </div>

            {/* 7. Process Steps */}
            <div className="space-y-2">
              <Label>Process Steps *</Label>
              <TooltipProvider delayDuration={300}>
                <div className="space-y-3">
                  {processSteps.map((step, index) => (
                    <div key={index} className="relative group/step">
                      {/* Floating action buttons on the left */}
                      <div className="absolute left-0 top-0 -translate-x-1/2 opacity-0 group-hover/step:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                        {/* Add step before button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => insertStepBefore(index)}
                              className="w-5 h-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg transition-colors pointer-events-auto"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="border-0 bg-black/80 text-white shadow-none px-2 py-1 text-xs">
                            <p>Add step before</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover/step:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                        {/* Remove step button - only show if more than 1 step */}
                        {processSteps.length > 1 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => removeStep(index)}
                                className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-lg transition-colors pointer-events-auto"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="border-0 bg-black/80 text-white shadow-none px-2 py-1 text-xs">
                              <p>Remove step</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      <div className="absolute left-0 bottom-0 -translate-x-1/2 opacity-0 group-hover/step:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                        {/* Add step after button */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => insertStepAfter(index)}
                              className="w-5 h-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg transition-colors pointer-events-auto"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="border-0 bg-black/80 text-white shadow-none px-2 py-1 text-xs">
                            <p>Add step after</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="p-3 border rounded-lg space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Step {index + 1}</span>
                        </div>
                        <Input
                          placeholder="Description (e.g., Bloom, Main pour)"
                          value={step.description}
                          onChange={(e) => updateStep(index, "description", e.target.value)}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Cumulative Water</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="0"
                                className="pr-6"
                                value={(() => {
                                  const cumulativeWater = processSteps.slice(0, index + 1).reduce((sum, s) => sum + (s.waterAmount || 0), 0);
                                  return cumulativeWater || "";
                                })()}
                                onChange={(e) => {
                                  const cumulativeValue = parseFloat(e.target.value) || 0;
                                  const previousWater = processSteps.slice(0, index).reduce((sum, s) => sum + (s.waterAmount || 0), 0);
                                  const stepWater = cumulativeValue - previousWater;
                                  updateStep(index, "waterAmount", stepWater);
                                }}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">g</span>
                            </div>
                            {(() => {
                              const cumulativeWater = processSteps.slice(0, index + 1).reduce((sum, s) => sum + (s.waterAmount || 0), 0);
                              const previousWater = processSteps.slice(0, index).reduce((sum, s) => sum + (s.waterAmount || 0), 0);
                              if (index > 0 && cumulativeWater < previousWater) {
                                return <p className="text-xs text-destructive mt-1">≥ {previousWater}g</p>;
                              }
                              return null;
                            })()}
                          </div>
                          <div>
                            <Label className="text-xs">Elapsed Time</Label>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="30"
                                className="pr-6"
                                value={elapsedTimeInputs[index] ?? formatDuration(step.duration)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setElapsedTimeInputs(prev => ({ ...prev, [index]: val }));
                                  const seconds = parseDuration(val);
                                  updateStep(index, "duration", seconds);
                                }}
                                onBlur={() => {
                                  const currentInput = elapsedTimeInputs[index] ?? '';
                                  if (currentInput === '') {
                                    updateStep(index, "duration", 0);
                                    setElapsedTimeInputs(prev => ({ ...prev, [index]: '0' }));
                                  }
                                }}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">s</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Flow Rate</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder={(() => {
                                  const currentElapsed = step.duration || 0;
                                  const previousElapsed = index > 0 ? (processSteps[index - 1]?.duration || 0) : 0;
                                  const stepDuration = currentElapsed - previousElapsed;
                                  const stepWater = step.waterAmount || 0;
                                  return stepWater && stepDuration ? (stepWater / stepDuration).toFixed(1) : "Auto";
                                })()}
                                className="pr-8"
                                value={step.flowRate ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateStep(index, "flowRate", val ? parseFloat(val) : undefined);
                                }}
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">g/s</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add first step button - only show when no steps */}
                  {processSteps.length === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStep}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Step
                    </Button>
                  )}
                </div>
              </TooltipProvider>
            </div>

            {/* Share to Community */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="shareToCommunity"
                checked={shareToCommunity}
                onCheckedChange={(checked) => setShareToCommunity(checked as boolean)}
              />
              <Label
                htmlFor="shareToCommunity"
                className="text-sm font-normal cursor-pointer"
              >
                Share in community recipes (subject to approval)
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {isCloning ? "Clone" : recipe ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for updating step water amounts */}
      <AlertDialog open={showWaterUpdateDialog} onOpenChange={setShowWaterUpdateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Step Water Amounts?</AlertDialogTitle>
            <AlertDialogDescription>
              You changed the total water from {pendingWaterChange?.oldWater}g to {pendingWaterChange?.newWater}g.
              Would you like to proportionally adjust the water amounts in each step?
              <br /><br />
              Please review each step afterwards and update the descriptions as needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingWaterChange(null);
            }}>
              No, keep current
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingWaterChange) {
                handleUpdateStepWater(pendingWaterChange.oldWater, pendingWaterChange.newWater);
              }
              setPendingWaterChange(null);
            }}>
              Yes, update steps
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
