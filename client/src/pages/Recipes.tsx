import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Timer, Star, Filter, Copy, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipeDialog } from "@/components/equipment/RecipeDialog";
import { BuyMeCoffee } from "@/components/BuyMeCoffee";
import { useToast } from "@/hooks/use-toast";
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
import type { Recipe } from "@/contexts/AppContext";

// Recipe Card Component for user's recipes
interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onClone: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onStartTimer: (recipe: Recipe) => void;
}

function RecipeCard({ recipe, onEdit, onClone, onDelete, onToggleFavorite, onStartTimer }: RecipeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
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
              <h3 className="font-semibold text-lg">{recipe.name}</h3>
              <div className="flex -mr-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleFavorite(recipe.id)}
                >
                  <Star className={`h-4 w-4 ${recipe.favorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onClone(recipe)} title="Clone recipe">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(recipe)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(recipe.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="space-y-1 mt-1">
              <p className="text-sm">
                {recipe.brewingMethod && <>{recipe.brewingMethod} • </>}
                {recipe.dose}g : {recipe.water}g ({recipe.ratio})
              </p>
              <p className="text-sm">{recipe.temperature}°C • {recipe.brewTime}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={() => onStartTimer(recipe)}
                size="sm"
                variant="outline"
              >
                <Timer className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Community Recipe Card Component for templates
interface CommunityRecipeCardProps {
  template: Recipe;
  onCopy: (templateId: string) => void;
  onStartTimer: (template: Recipe) => void;
  isCopying: boolean;
}

function CommunityRecipeCard({ template, onCopy, onStartTimer, isCopying }: CommunityRecipeCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {template.photo ? (
            <img
              src={template.photo}
              alt={template.name}
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
              <h3 className="font-semibold text-lg">{template.name}</h3>
            </div>
            <div className="space-y-1 mt-1">
              <p className="text-sm">
                {template.brewingMethod && <>{template.brewingMethod} • </>}
                {template.dose}g : {template.water}g ({template.ratio})
              </p>
              <p className="text-sm">{template.temperature}°C • {template.brewTime}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={() => onCopy(template.id)}
                size="sm"
                variant="outline"
                disabled={isCopying}
              >
                {isCopying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add to My Recipes
                  </>
                )}
              </Button>
              <Button 
                onClick={() => onStartTimer(template)}
                size="sm"
                variant="outline"
              >
                <Timer className="h-4 w-4 mr-2" />
                Start Timer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Recipes() {
  const { recipes, templates, deleteRecipe, toggleRecipeFavorite, createFromTemplate, isLoading } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [copyingTemplateId, setCopyingTemplateId] = useState<string | null>(null);
  const [brewingMethodFilter, setBrewingMethodFilter] = useState<string>("all");

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsCloning(false);
    setDialogOpen(true);
  };

  const handleClone = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsCloning(true);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRecipe(null);
    setIsCloning(false);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      deleteRecipe(id);
      setDeleteId(null);
      toast({
        title: "Recipe deleted",
        description: "Recipe has been removed successfully",
      });
    } catch (error) {
      setDeleteId(null);
      toast({
        title: "Cannot delete",
        description: error instanceof Error ? error.message : "Failed to delete recipe",
        variant: "destructive",
      });
    }
  };

  const handleCopyFromTemplate = async (templateId: string) => {
    setCopyingTemplateId(templateId);
    try {
      await createFromTemplate(templateId);
      toast({
        title: "Recipe added",
        description: "Community recipe has been added to your recipes",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add recipe",
        variant: "destructive",
      });
    } finally {
      setCopyingTemplateId(null);
    }
  };

  // Separate recipes into categories
  const favoriteRecipes = recipes.filter(r => r.favorite);
  const myRecipes = recipes; // Show all recipes including favorites
  
  // Filter community recipes by brewing method
  const filteredCommunityRecipes = brewingMethodFilter === "all" 
    ? templates 
    : templates.filter(t => t.brewingMethod === brewingMethodFilter);
  
  // Get unique brewing methods from templates for filter
  const brewingMethods = Array.from(new Set(templates.map(t => t.brewingMethod).filter(Boolean))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Recipes</h1>
          </div>
          <div className="flex items-center gap-2">
            <BuyMeCoffee />
            <Button onClick={handleAdd} size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {recipes.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                <SelectItem value="favorites">Favorites Only</SelectItem>
                <SelectItem value="my-recipes">My Recipes Only</SelectItem>
                <SelectItem value="community">Community Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading recipes...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Favorite Recipes Section */}
            {(filter === "all" || filter === "favorites") && favoriteRecipes.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  Favorite Recipes
                </h2>
                {favoriteRecipes.map((recipe) => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    onEdit={handleEdit}
                    onClone={handleClone}
                    onDelete={setDeleteId}
                    onToggleFavorite={toggleRecipeFavorite}
                    onStartTimer={(recipe) => navigate('/brew-timer', { state: { recipe } })}
                  />
                ))}
              </div>
            )}

            {/* My Recipes Section */}
            {(filter === "all" || filter === "my-recipes") && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Recipes
                </h2>
                {myRecipes.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Add your own or copy from community recipes below!</p>
                    </CardContent>
                  </Card>
                ) : (
                  myRecipes.map((recipe) => (
                    <RecipeCard 
                      key={recipe.id} 
                      recipe={recipe} 
                      onEdit={handleEdit}
                      onClone={handleClone}
                      onDelete={setDeleteId}
                      onToggleFavorite={toggleRecipeFavorite}
                      onStartTimer={(recipe) => navigate('/brew-timer', { state: { recipe } })}
                    />
                  ))
                )}
              </div>
            )}

            {/* Community Recipes Section */}
            {(filter === "all" || filter === "community") && templates.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Community Recipes
                  </h2>
                  <Select value={brewingMethodFilter} onValueChange={setBrewingMethodFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {brewingMethods.map((method) => (
                        <SelectItem key={method} value={method!}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {filteredCommunityRecipes.map((template) => (
                  <CommunityRecipeCard 
                    key={template.id} 
                    template={template}
                    onCopy={handleCopyFromTemplate}
                    onStartTimer={(template) => navigate('/brew-timer', { state: { recipe: template } })}
                    isCopying={copyingTemplateId === template.id}
                  />
                ))}
                {filteredCommunityRecipes.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No recipes found for this brewing method</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Empty state when no recipes at all */}
            {recipes.length === 0 && templates.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No recipes available</p>
                  <Button onClick={handleAdd}>Add Your First Recipe</Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <RecipeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          recipe={editingRecipe}
          isCloning={isCloning}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this recipe? This action cannot be undone.
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