import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApp } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import type { CoffeeServer } from "@/contexts/AppContext";
import ImageUpload from "@/components/ImageUpload";
import { api } from "@/lib/api";

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
  const [adminServers, setAdminServers] = useState<CoffeeServer[]>([]);
  const [showAdminPicker, setShowAdminPicker] = useState(false);

  useEffect(() => {
    if (open && !server) {
      api.admin.getCoffeeServers()
        .then((data) => setAdminServers([...data].sort((a, b) => a.model.localeCompare(b.model))))
        .catch(() => setAdminServers([]));
    }
  }, [open, server]);

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

  const handleCopyFromAdmin = (adminServer: CoffeeServer) => {
    setValue("model", adminServer.model);
    setValue("photo", adminServer.photo || "");
    setValue("maxVolume", adminServer.maxVolume || "");
    setValue("emptyWeight", adminServer.emptyWeight || "");
    setShowAdminPicker(false);
    toast({ title: "Copied", description: `Copied "${adminServer.model}" settings` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{server ? "Edit Coffee Server" : "Add Coffee Server"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!server && adminServers.length > 0 && (
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
                  {adminServers.map((as) => (
                    <Button
                      key={as.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => handleCopyFromAdmin(as)}
                    >
                      <div className="flex items-center gap-2">
                        {as.photo ? (
                          <img src={as.photo} alt={as.model} className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">—</div>
                        )}
                        <span className="truncate">{as.model} {as.maxVolume ? `(${as.maxVolume}ml)` : ""}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
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
