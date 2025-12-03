import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import type { Brewer } from "@/contexts/AppContext";
import ImageUpload from "@/components/ImageUpload";
import { api } from "@/lib/api";

const brewerSchema = z.object({
  model: z.string().trim().min(1, "Model is required").max(100),
  photo: z.string().optional().or(z.literal("")),
  type: z.enum(["espresso", "pour-over"]),
});

type BrewerFormData = z.infer<typeof brewerSchema>;

interface BrewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brewer: Brewer | null;
}

export function BrewerDialog({ open, onOpenChange, brewer }: BrewerDialogProps) {
  const { addBrewer, updateBrewer } = useApp();
  const { toast } = useToast();
  const [adminBrewers, setAdminBrewers] = useState<Brewer[]>([]);
  const [showAdminPicker, setShowAdminPicker] = useState(false);

  useEffect(() => {
    if (open && !brewer) {
      api.admin.getBrewers().then(setAdminBrewers).catch(() => setAdminBrewers([]));
    }
  }, [open, brewer]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BrewerFormData>({
    resolver: zodResolver(brewerSchema),
    defaultValues: {
      model: "",
      photo: "",
      type: "pour-over",
    },
  });

  const type = watch("type");
  const photo = watch("photo");

  useEffect(() => {
    if (brewer) {
      setValue("model", brewer.model);
      setValue("photo", brewer.photo || "");
      setValue("type", brewer.type);
    } else {
      reset();
    }
  }, [brewer, setValue, reset]);

  const onSubmit = async (data: BrewerFormData) => {
    try {
      if (brewer) {
        await updateBrewer(brewer.id, data);
        toast({ title: "Brewer updated", description: "Brewer has been updated successfully" });
      } else {
        await addBrewer(data as Omit<Brewer, "id">);
        toast({ title: "Brewer added", description: "Brewer has been added successfully" });
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save brewer",
        variant: "destructive"
      });
    }
  };

  const handleCopyFromAdmin = (adminBrewer: Brewer) => {
    setValue("model", adminBrewer.model);
    setValue("photo", adminBrewer.photo || "");
    setValue("type", adminBrewer.type);
    setShowAdminPicker(false);
    toast({ title: "Copied", description: `Copied "${adminBrewer.model}" settings` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{brewer ? "Edit Brewer" : "Add Brewer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!brewer && adminBrewers.length > 0 && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAdminPicker(!showAdminPicker)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy from templates
              </Button>
              {showAdminPicker && (
                <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto bg-muted/50">
                  {adminBrewers.map((ab) => (
                    <Button
                      key={ab.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => handleCopyFromAdmin(ab)}
                    >
                      <div className="flex items-center gap-2">
                        {ab.photo ? (
                          <img src={ab.photo} alt={ab.model} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                        )}
                        <span className="truncate">{ab.model} ({ab.type})</span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" {...register("model")} placeholder="e.g., V60, La Marzocco" />
            {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
          </div>

          <div className="space-y-2">
            <ImageUpload
              value={photo || ""}
              onChange={(dataUrl) => setValue("photo", dataUrl)}
              label="Photo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(value) => setValue("type", value as any)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pour-over">Pour-over</SelectItem>
                <SelectItem value="espresso">Espresso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {brewer ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
