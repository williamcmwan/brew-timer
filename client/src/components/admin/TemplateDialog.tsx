import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";
import type { RecipeTemplate, RecipeStep } from "@/contexts/AppContext";

const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  photo: z.string().optional().or(z.literal("")),
  process: z.string().trim().optional().or(z.literal("")),
  ratio: z.string().trim().min(1, "Ratio is required").max(20),
  dose: z.number({ required_error: "Dose is required", invalid_type_error: "Dose must be a number" })
    .min(1, "Dose must be at least 1g").max(1000),
  temperature: z.number({ required_error: "Temperature is required", invalid_type_error: "Temperature must be a number" })
    .min(1, "Temperature must be at least 1°C").max(100),
  brewTime: z.string().trim().min(1, "Brew time is required").max(20),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: RecipeTemplate | null;
  adminKey: string;
  onSave: () => void;
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

export function TemplateDialog({ open, onOpenChange, template, adminKey, onSave }: TemplateDialogProps) {
  const { toast } = useToast();
  const [processSteps, setProcessSteps] = useState<RecipeStep[]>([
    { description: "", waterAmount: 0, duration: 30 }
  ]);
  const [elapsedTimeInputs, setElapsedTimeInputs] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      photo: "",
      process: "",
      ratio: "1:16",
      dose: 15,
      temperature: 93,
      brewTime: "3:00",
    },
  });

  // Watch ratio and dose to calculate water
  const ratio = watch("ratio");
  const dose = watch("dose");
  const photo = watch("photo");

  // Calculate water based on ratio and dose
  const calculateWater = (ratioStr: string, doseAmount: number): number => {
    try {
      const parts = ratioStr.split(':');
      if (parts.length === 2) {
        const coffeeRatio = parseFloat(parts[0]);
        const waterRatio = parseFloat(parts[1]);
        if (!isNaN(coffeeRatio) && !isNaN(waterRatio) && coffeeRatio > 0) {
          return Math.round((doseAmount * waterRatio) / coffeeRatio);
        }
      }
    } catch (e) {
      // Invalid ratio format
    }
    return 0;
  };

  const calculatedWater = calculateWater(ratio || "1:16", dose || 15);

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
      const response = await fetch(`${apiUrl}/api/admin/upload-photo`, {
        method: 'POST',
        headers: {
          'X-Admin-Key': adminKey,
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
    if (template) {
      reset({
        name: template.name,
        photo: template.photo || "",
        process: template.process || "",
        ratio: template.ratio,
        dose: template.dose,
        temperature: template.temperature,
        brewTime: template.brewTime,
      });
      if (template.processSteps && template.processSteps.length > 0) {
        setProcessSteps([...template.processSteps]);
        const inputs: Record<number, string> = {};
        template.processSteps.forEach((step, index) => {
          inputs[index] = formatDuration(step.duration);
        });
        setElapsedTimeInputs(inputs);
      }
    } else {
      reset();
      setProcessSteps([{ description: "", waterAmount: 0, duration: 30 }]);
      setElapsedTimeInputs({ 0: "30" });
    }
  }, [template, reset]);

  const onSubmit = async (data: TemplateFormData) => {
    setIsLoading(true);
    try {
      const templateData = {
        ...data,
        water: calculatedWater,
        processSteps: processSteps.filter(step => step.description.trim() !== "")
      };

      if (template) {
        await api.admin.updateTemplate(adminKey, template.id, templateData);
        toast({ title: "Template updated", description: "Template has been updated successfully" });
      } else {
        await api.admin.createTemplate(adminKey, templateData);
        toast({ title: "Template created", description: "Template has been created successfully" });
      }
      
      onSave();
      onOpenChange(false);
      reset();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Add Template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onFormError)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} placeholder="e.g., James Hoffmann V60" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="process">Process Description</Label>
            <Input id="process" {...register("process")} placeholder="Brief brewing method description" />
          </div>

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

          <div className="space-y-2">
            <Label>Water (g)</Label>
            <Input
              type="number"
              value={calculatedWater}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Auto-calculated from ratio and dose</p>
          </div>

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

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Saving..." : template ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}