import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Shield, Loader2, Timer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BuyMeCoffee } from "@/components/BuyMeCoffee";
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
import { TemplateDialog } from "@/components/admin/TemplateDialog";
import type { RecipeTemplate } from "@/contexts/AppContext";

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [adminKey, setAdminKey] = useState(searchParams.get('key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [templates, setTemplates] = useState<RecipeTemplate[]>([]);
  const [sharedRecipes, setSharedRecipes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecipeTemplate | null>(null);

  const authenticate = async (keyToUse?: string) => {
    const key = keyToUse || adminKey;
    if (!key.trim()) {
      toast({
        title: "Admin key required",
        description: "Please enter the admin key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting authentication with key:', key);
      
      // Use the API client instead of hardcoded URL
      const result = await api.admin.getStats(key);
      console.log('Authentication successful:', result);
      setIsAuthenticated(true);
      setStats(result);
      
      // Load templates
      const templatesData = await api.admin.getTemplates(key);
      console.log('Templates loaded:', templatesData.map(t => ({ name: t.name, photo: t.photo })));
      
      // Transform photo URLs for development
      const transformedTemplates = templatesData.map(template => ({
        ...template,
        photo: template.photo && template.photo.startsWith('/') && import.meta.env.DEV
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${template.photo}`
          : template.photo
      }));
      setTemplates(transformedTemplates);
      
      // Load shared recipes
      const sharedRecipesData = await api.admin.getSharedRecipes(key);
      // Transform photo URLs for shared recipes too
      const transformedSharedRecipes = sharedRecipesData.map(recipe => ({
        ...recipe,
        photo: recipe.photo && recipe.photo.startsWith('/') && import.meta.env.DEV
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${recipe.photo}`
          : recipe.photo
      }));
      setSharedRecipes(transformedSharedRecipes);
      
    } catch (error) {
      console.error('Authentication failed:', error);
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Invalid admin key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-authenticate if key is in URL
  useEffect(() => {
    const keyFromUrl = searchParams.get('key');
    if (keyFromUrl && !isAuthenticated) {
      setAdminKey(keyFromUrl);
      authenticate(keyFromUrl);
    }
  }, [searchParams, isAuthenticated]);

  const handleDelete = async (id: string) => {
    try {
      await api.admin.deleteTemplate(adminKey, id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
      toast({
        title: "Template deleted",
        description: "Recipe template has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Cannot delete",
        description: "Failed to delete recipe template",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: RecipeTemplate) => {
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setTemplateDialogOpen(true);
  };

  const handleSave = async () => {
    // Reload templates after save
    try {
      const templatesData = await api.admin.getTemplates(adminKey);
      console.log('Templates reloaded:', templatesData.map(t => ({ name: t.name, photo: t.photo })));
      
      // Transform photo URLs for development
      const transformedTemplates = templatesData.map(template => ({
        ...template,
        photo: template.photo && template.photo.startsWith('/') && import.meta.env.DEV
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${template.photo}`
          : template.photo
      }));
      setTemplates(transformedTemplates);
    } catch (error) {
      console.error('Failed to reload templates:', error);
    }
  };

  const handleApproveSharedRecipe = async (id: string) => {
    try {
      await api.admin.approveSharedRecipe(adminKey, id);
      setSharedRecipes(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Recipe approved",
        description: "Recipe has been added to community templates",
      });
      // Reload templates to show the new one
      const templatesData = await api.admin.getTemplates(adminKey);
      const transformedTemplates = templatesData.map(template => ({
        ...template,
        photo: template.photo && template.photo.startsWith('/') && import.meta.env.DEV
          ? `${import.meta.env.VITE_API_URL || 'http://localhost:3005'}${template.photo}`
          : template.photo
      }));
      setTemplates(transformedTemplates);
    } catch (error) {
      toast({
        title: "Cannot approve",
        description: "Failed to approve shared recipe",
        variant: "destructive",
      });
    }
  };

  const handleRejectSharedRecipe = async (id: string) => {
    try {
      await api.admin.rejectSharedRecipe(adminKey, id);
      setSharedRecipes(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Recipe rejected",
        description: "Recipe has been removed from shared list",
      });
    } catch (error) {
      toast({
        title: "Cannot reject",
        description: "Failed to reject shared recipe",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="container max-w-md mx-auto p-4 space-y-4">
          <div className="flex items-center gap-4 pt-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Admin Access</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminKey">Admin Key</Label>
                <Input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  onKeyDown={(e) => e.key === 'Enter' && authenticate()}
                />
              </div>
              <Button 
                onClick={() => authenticate()} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Access Admin Panel'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <BuyMeCoffee />
            <Button onClick={() => setIsAuthenticated(false)} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.templates}</div>
                <p className="text-sm text-muted-foreground">Recipe Templates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.guestUsers}</div>
                <p className="text-sm text-muted-foreground">Guest Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.recipes}</div>
                <p className="text-sm text-muted-foreground">User Recipes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shared Recipes Pending Approval */}
        {sharedRecipes.length > 0 && (
          <Card className="border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Shared Recipes Pending Approval ({sharedRecipes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sharedRecipes.map((recipe) => (
                  <Card key={recipe.id} className="hover:shadow-md transition-shadow bg-yellow-50 dark:bg-yellow-950/20">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {recipe.photo ? (
                          <img
                            src={recipe.photo}
                            alt={recipe.name}
                            className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{recipe.name}</h3>
                              <p className="text-xs text-muted-foreground">Shared by: {recipe.guestId}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8"
                                onClick={() => navigate('/brew-timer', { state: { recipe } })}
                                title="Preview timer"
                              >
                                <Timer className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                className="h-8"
                                onClick={() => handleApproveSharedRecipe(recipe.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => handleRejectSharedRecipe(recipe.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1 mt-1">
                            <p className="text-sm">{recipe.dose}g : {recipe.water}g ({recipe.ratio})</p>
                            <p className="text-sm">{recipe.temperature}°C • {recipe.brewTime}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipe Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recipe Templates</CardTitle>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No recipe templates yet</p>
                <Button onClick={handleAdd}>Add Your First Template</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {template.photo ? (
                          <img
                            src={template.photo}
                            alt={template.name}
                            className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                            onError={(e) => {
                              console.error('Image failed to load:', template.photo);
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23ddd" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <div className="flex -mr-2 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleEdit(template)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteId(template.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1 mt-1">
                            <p className="text-sm">{template.dose}g : {template.water}g ({template.ratio})</p>
                            <p className="text-sm">{template.temperature}°C • {template.brewTime}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <TemplateDialog
          open={templateDialogOpen}
          onOpenChange={setTemplateDialogOpen}
          template={editingTemplate}
          adminKey={adminKey}
          onSave={handleSave}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Template</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this recipe template? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}