import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coffee, Star, Loader2, Timer, Pencil, Plus, Trash2, Mail, Shield } from "lucide-react";
import { RecipeDialog } from "@/components/equipment/RecipeDialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { BuyMeCoffee } from "@/components/BuyMeCoffee";
import { CookieNotice } from "@/components/CookieNotice";
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
import { useToast } from "@/hooks/use-toast";
import type { Recipe } from "@/contexts/AppContext";

export default function Dashboard() {
  const { recipes, templates, isLoading, toggleRecipeFavorite, deleteRecipe, createFromTemplate } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copyingTemplateId, setCopyingTemplateId] = useState<string | null>(null);
  const [brewingMethodFilter, setBrewingMethodFilter] = useState<string>("all");

  const favoriteRecipes = recipes.filter(r => r.favorite);
  const myRecipes = recipes; // Show all recipes including favorites
  
  // Filter community recipes by brewing method
  const filteredCommunityRecipes = brewingMethodFilter === "all" 
    ? templates 
    : templates.filter(t => t.brewingMethod === brewingMethodFilter);
  
  // Get unique brewing methods from templates for filter
  const brewingMethods = Array.from(new Set(templates.map(t => t.brewingMethod).filter(Boolean))).sort();

  const handleRecipeSelect = (recipe: any) => {
    navigate("/brew-timer", { state: { recipe } });
  };

  const handleEdit = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRecipe(recipe);
    setDialogOpen(true);
  };

  const handleToggleFavorite = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleRecipeFavorite(recipeId);
  };

  const handleAdd = () => {
    setEditingRecipe(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container max-w-lg mx-auto p-4 space-y-4">
        {/* Header with Buy Me a Coffee */}
        <div className="flex items-center justify-between pt-2 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <Coffee className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">Coffee Timer</h1>
              <p className="text-sm text-muted-foreground truncate">Select a recipe to start brewing</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BuyMeCoffee />
            <ThemeToggle />
          </div>
        </div>

        {favoriteRecipes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Favorite Recipes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {favoriteRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleRecipeSelect(recipe)}
                >
                  {recipe.photo && (
                    <img 
                      src={recipe.photo} 
                      alt={recipe.name} 
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{recipe.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {recipe.brewingMethod && <>{recipe.brewingMethod} • </>}
                      {recipe.dose}g • {recipe.ratio} • {recipe.temperature}°C • {recipe.brewTime}
                    </p>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => handleToggleFavorite(recipe.id, e)}
                        title="Remove from favorites"
                      >
                        <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 sm:mr-1" />
                        <span className="text-xs hidden sm:inline">Favorite</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => handleEdit(recipe, e)}
                        title="Edit recipe"
                      >
                        <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="text-xs hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(recipe.id);
                        }}
                        title="Delete recipe"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="text-xs hidden sm:inline">Delete</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecipeSelect(recipe);
                        }}
                        title="Start timer"
                      >
                        <Timer className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="text-xs hidden sm:inline">Start</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">My Recipes</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleAdd}
                title="Add Recipe"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-sm text-muted-foreground">Loading recipes...</p>
              </div>
            ) : myRecipes.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Add your own or copy from community recipes below!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => handleRecipeSelect(recipe)}
                  >
                    {recipe.photo && (
                      <img 
                        src={recipe.photo} 
                        alt={recipe.name} 
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {recipe.brewingMethod && <>{recipe.brewingMethod} • </>}
                        {recipe.dose}g • {recipe.ratio} • {recipe.temperature}°C • {recipe.brewTime}
                      </p>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => handleToggleFavorite(recipe.id, e)}
                          title={recipe.favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star className={`h-3.5 w-3.5 sm:mr-1 ${recipe.favorite ? "fill-yellow-500 text-yellow-500" : ""}`} />
                          <span className="text-xs hidden sm:inline">Favorite</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => handleEdit(recipe, e)}
                          title="Edit recipe"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="text-xs hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(recipe.id);
                          }}
                          title="Delete recipe"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="text-xs hidden sm:inline">Delete</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecipeSelect(recipe);
                          }}
                          title="Start timer"
                        >
                          <Timer className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="text-xs hidden sm:inline">Start</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Community Recipes Section */}
        {templates.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Coffee className="h-5 w-5 text-primary" />
                  Community Recipes
                </CardTitle>
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
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {filteredCommunityRecipes.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No recipes found for this brewing method
                  </p>
                </div>
              ) : (
                filteredCommunityRecipes.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleRecipeSelect(template)}
                >
                  {template.photo && (
                    <img 
                      src={template.photo} 
                      alt={template.name} 
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {template.brewingMethod && <>{template.brewingMethod} • </>}
                      {template.dose}g • {template.ratio} • {template.temperature}°C • {template.brewTime}
                    </p>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyFromTemplate(template.id);
                        }}
                        disabled={copyingTemplateId === template.id}
                        title="Add to my recipes"
                      >
                        {copyingTemplateId === template.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin sm:mr-1" />
                            <span className="text-xs hidden sm:inline">Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 sm:mr-1" />
                            <span className="text-xs hidden sm:inline">Add to My Recipes</span>
                            <span className="text-xs sm:hidden">Add</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRecipeSelect(template);
                        }}
                        title="Start timer"
                      >
                        <Timer className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="text-xs hidden sm:inline">Start</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Us Link */}
        <div className="text-center pb-4 space-x-4">
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate("/contact")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Us
          </Button>
          <span className="text-muted-foreground">·</span>
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate("/privacy")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Shield className="h-4 w-4 mr-2" />
            Privacy Policy
          </Button>
        </div>
      </div>

      <RecipeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipe={editingRecipe}
        isCloning={false}
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

      {/* Cookie Notice */}
      <CookieNotice />
    </div>
  );
}