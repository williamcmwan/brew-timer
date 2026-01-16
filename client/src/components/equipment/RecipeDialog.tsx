import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Copy } from "lucide-react";
import type { Recipe, RecipeStep, RecipeTemplate } from "@/contexts/AppContext";

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
    } else {
      reset();
      setShareToCommunity(false);
      setBrewingMethod("");
      setCustomBrewingMethod("");
      setProcessSteps([{ description: "", waterAmount: 0, duration: 30 }]);
      setElapsedTimeInputs({ 0: "30" });
    }
  }, [recipe, isCloning, reset]);

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
              <Input id="ratio" {...register("ratio")} placeholder="1:16" />
              {errors.ratio && <p className="text-sm text-destructive">{errors.ratio.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dose">Dose (g) *</Label>
              <Input
                id="dose"
                type="number"
                step="any"
                {...register("dose", { valueAsNumber: true })}
              />
              {errors.dose && <p className="text-sm text-destructive">{errors.dose.message}</p>}
            </div>
          </div>

          {/* 5. Water */}
          <div className="space-y-2">
            <Label htmlFor="water">Water (g) *</Label>
            <Input
              id="water"
              type="number"
              step="any"
              {...register("water", { valueAsNumber: true })}
            />
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
            <div className="space-y-3">
              {processSteps.map((step, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Step {index + 1}</span>
                    {processSteps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Description (e.g., Bloom, Main pour)"
                    value={step.description}
                    onChange={(e) => updateStep(index, "description", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Cumulative Water (g)</Label>
                      <Input
                        type="number"
                        placeholder="0"
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
                      {(() => {
                        const cumulativeWater = processSteps.slice(0, index + 1).reduce((sum, s) => sum + (s.waterAmount || 0), 0);
                        const previousWater = processSteps.slice(0, index).reduce((sum, s) => sum + (s.waterAmount || 0), 0);
                        if (index > 0 && cumulativeWater < previousWater) {
                          return <p className="text-xs text-destructive mt-1">Water should be ≥ {previousWater}g</p>;
                        }
                        return null;
                      })()}
                    </div>
                    <div>
                      <Label className="text-xs">Elapsed Time (s)</Label>
                      <Input
                        type="text"
                        placeholder="30 or 1:30"
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
                    </div>
                  </div>
                  {/* Flow Rate field - optional override */}
                  <div className="mt-2">
                    <Label className="text-xs">Flow Rate (g/s) - Optional</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={(() => {
                        // step.waterAmount is per-step water
                        // step.duration is cumulative elapsed time (not per-step!)
                        const currentElapsed = step.duration || 0;
                        const previousElapsed = index > 0 ? (processSteps[index - 1]?.duration || 0) : 0;
                        const stepDuration = currentElapsed - previousElapsed;
                        const stepWater = step.waterAmount || 0;
                        return stepWater && stepDuration ? (stepWater / stepDuration).toFixed(1) : "Auto";
                      })()}
                      value={step.flowRate ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateStep(index, "flowRate", val ? parseFloat(val) : undefined);
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for auto-calculated ({(() => {
                        const currentElapsed = step.duration || 0;
                        const previousElapsed = index > 0 ? (processSteps[index - 1]?.duration || 0) : 0;
                        const stepDuration = currentElapsed - previousElapsed;
                        const stepWater = step.waterAmount || 0;
                        return stepWater && stepDuration ? (stepWater / stepDuration).toFixed(1) : '0';
                      })()} g/s)
                    </p>
                  </div>
                </div>
              ))}
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
            </div>
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
  );
}
