import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { CoffeeServer } from "@/contexts/AppContext";
import ImageUpload from "@/components/ImageUpload";

const serverSchema = z.object({
  model: z.string().trim().min(1, "Model is required").max(100),
  photo: z.string().optional().or(z.literal("")),
  maxVolume: z.coerce.number().positive("Must be positive").optional().or(z.literal("")),
  emptyWeight: z.coerce.number().positive("Must be positive").optional().or(z.literal("")),
});

type ServerFormData = z.infer<typeof serverSchema>;

interface CoffeeServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  server: CoffeeServer | null;
}

export function CoffeeServerDialog({ open, onOpenChange, server }: CoffeeServerDialogProps) {
  const { addCoffeeServer, updateCoffeeServer } = useApp();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      model: "",
      photo: "",
      maxVolume: "",
      emptyWeight: "",
    },
  });

  const photo = watch("photo");

  useEffect(() => {
    if (server) {
      setValue("model", server.model);
      setValue("photo", server.photo || "");
      setValue("maxVolume", server.maxVolume || "");
      setValue("emptyWeight", server.emptyWeight || "");
    } else {
      reset();
    }
  }, [server, setValue, reset]);

  const onSubmit = async (data: ServerFormData) => {
    try {
      const payload = {
        model: data.model,
        photo: data.photo || undefined,
        maxVolume: data.maxVolume ? Number(data.maxVolume) : undefined,
        emptyWeight: data.emptyWeight ? Number(data.emptyWeight) : undefined,
      };
      
      if (server) {
        await updateCoffeeServer(server.id, payload);
        toast({ title: "Coffee server updated", description: "Coffee server has been updated successfully" });
      } else {
        await addCoffeeServer(payload as Omit<CoffeeServer, "id">);
        toast({ title: "Coffee server added", description: "Coffee server has been added successfully" });
      }
      onOpenChange(false);
      reset();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save coffee server",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{server ? "Edit Coffee Server" : "Add Coffee Server"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" {...register("model")} placeholder="e.g., Hario V60 Range Server" />
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
            <Label htmlFor="maxVolume">Max Volume (ml)</Label>
            <Input id="maxVolume" type="number" step="1" {...register("maxVolume")} placeholder="e.g., 600" />
            {errors.maxVolume && <p className="text-sm text-destructive">{errors.maxVolume.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emptyWeight">Weight when empty (g)</Label>
            <Input id="emptyWeight" type="number" step="0.1" {...register("emptyWeight")} placeholder="e.g., 250" />
            {errors.emptyWeight && <p className="text-sm text-destructive">{errors.emptyWeight.message}</p>}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {server ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
