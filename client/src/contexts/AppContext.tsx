import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface RecipeStep {
  description: string;
  waterAmount: number;
  duration: number;
}

export interface Recipe {
  id: string;
  name: string;
  ratio: string;
  dose: number;
  photo?: string;
  process: string;
  processSteps?: RecipeStep[];
  water: number;
  temperature: number;
  brewTime: string;
  favorite?: boolean;
  templateId?: string;
}

export interface RecipeTemplate {
  id: string;
  name: string;
  ratio: string;
  dose: number;
  photo?: string;
  process: string;
  processSteps?: RecipeStep[];
  water: number;
  temperature: number;
  brewTime: string;
}

interface AppContextType {
  recipes: Recipe[];
  templates: RecipeTemplate[];
  addRecipe: (recipe: Omit<Recipe, "id">) => Promise<void>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleRecipeFavorite: (id: string) => Promise<void>;
  createFromTemplate: (templateId: string, name?: string) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default recipes for the timer app
const DEFAULT_RECIPES: Recipe[] = [
  {
    id: "1",
    name: "V60 Pour Over",
    ratio: "1:16",
    dose: 22,
    process: "Pour over method with V60",
    processSteps: [
      { description: "Bloom", waterAmount: 44, duration: 30 },
      { description: "First pour", waterAmount: 132, duration: 60 },
      { description: "Second pour", waterAmount: 176, duration: 90 },
      { description: "Final pour", waterAmount: 176, duration: 120 }
    ],
    water: 352,
    temperature: 93,
    brewTime: "4:00",
    favorite: true
  },
  {
    id: "2", 
    name: "Chemex Classic",
    ratio: "1:15",
    dose: 30,
    process: "Chemex pour over method",
    processSteps: [
      { description: "Bloom", waterAmount: 60, duration: 45 },
      { description: "First pour", waterAmount: 150, duration: 90 },
      { description: "Second pour", waterAmount: 150, duration: 150 },
      { description: "Final pour", waterAmount: 90, duration: 210 }
    ],
    water: 450,
    temperature: 94,
    brewTime: "5:30",
    favorite: false
  },
  {
    id: "3",
    name: "French Press",
    ratio: "1:12",
    dose: 30,
    process: "Immersion brewing method",
    processSteps: [
      { description: "Add all water", waterAmount: 360, duration: 0 },
      { description: "Steep", waterAmount: 0, duration: 240 }
    ],
    water: 360,
    temperature: 95,
    brewTime: "4:00",
    favorite: false
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [templates, setTemplates] = useState<RecipeTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load recipes and templates from API with localStorage fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load templates and recipes in parallel
        const [apiTemplates, apiRecipes] = await Promise.all([
          api.recipes.getTemplates(),
          api.recipes.list()
        ]);
        
        setTemplates(apiTemplates);
        setRecipes(apiRecipes);
        
        // Save to localStorage as backup
        if (apiRecipes.length > 0) {
          localStorage.setItem("coffee-timer-recipes", JSON.stringify(apiRecipes));
        }
        if (apiTemplates.length > 0) {
          localStorage.setItem("coffee-timer-templates", JSON.stringify(apiTemplates));
        }
      } catch (error) {
        console.warn("Failed to load data from API, falling back to localStorage:", error);
        
        // Fallback to localStorage
        const storedRecipes = localStorage.getItem("coffee-timer-recipes");
        const storedTemplates = localStorage.getItem("coffee-timer-templates");
        
        if (storedRecipes) {
          try {
            setRecipes(JSON.parse(storedRecipes));
          } catch (parseError) {
            console.error("Failed to parse stored recipes:", parseError);
            setRecipes(DEFAULT_RECIPES);
          }
        } else {
          setRecipes(DEFAULT_RECIPES);
        }
        
        if (storedTemplates) {
          try {
            setTemplates(JSON.parse(storedTemplates));
          } catch (parseError) {
            console.error("Failed to parse stored templates:", parseError);
            setTemplates([]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save recipes to localStorage whenever recipes change
  useEffect(() => {
    if (!isLoading && recipes.length > 0) {
      localStorage.setItem("coffee-timer-recipes", JSON.stringify(recipes));
    }
  }, [recipes, isLoading]);

  const addRecipe = async (recipe: Omit<Recipe, "id">) => {
    const newRecipe = {
      ...recipe,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11)
    };

    try {
      // Try API first
      const createdRecipe = await api.recipes.create(newRecipe);
      setRecipes(prev => [...prev, createdRecipe]);
    } catch (error) {
      console.warn("Failed to create recipe via API, using local storage:", error);
      // Fallback to local state
      setRecipes(prev => [...prev, newRecipe]);
    }
  };

  const updateRecipe = async (id: string, recipe: Partial<Recipe>) => {
    try {
      // Try API first
      await api.recipes.update(id, recipe);
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...recipe } : r));
    } catch (error) {
      console.warn("Failed to update recipe via API, using local storage:", error);
      // Fallback to local state
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...recipe } : r));
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      // Try API first
      await api.recipes.delete(id);
      setRecipes(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.warn("Failed to delete recipe via API, using local storage:", error);
      // Fallback to local state
      setRecipes(prev => prev.filter(r => r.id !== id));
    }
  };

  const toggleRecipeFavorite = async (id: string) => {
    try {
      // Try API first
      await api.recipes.toggleFavorite(id);
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r));
    } catch (error) {
      console.warn("Failed to toggle favorite via API, using local storage:", error);
      // Fallback to local state
      setRecipes(prev => prev.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r));
    }
  };

  const createFromTemplate = async (templateId: string, name?: string) => {
    try {
      // Try API first
      const createdRecipe = await api.recipes.createFromTemplate(templateId, name);
      setRecipes(prev => [...prev, createdRecipe]);
    } catch (error) {
      console.warn("Failed to create recipe from template via API:", error);
      // Fallback: find template and create locally
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const newRecipe: Recipe = {
          ...template,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          name: name || template.name,
          favorite: false,
          templateId
        };
        setRecipes(prev => [...prev, newRecipe]);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        recipes,
        templates,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        toggleRecipeFavorite,
        createFromTemplate,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};