import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrewTimerContent from "@/components/BrewTimerContent";

export default function BrewTimer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recipes } = useApp();
  
  // Get recipe from location state or find by ID
  const recipe = location.state?.recipe || recipes.find(r => r.id === location.state?.recipeId);

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleComplete = (recordedBrewTime?: string) => {
    // For the simplified timer app, just go back to dashboard
    navigate("/dashboard");
  };

  if (!recipe) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Recipe not found</p>
            <Button onClick={handleBack} className="mt-4 w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <BrewTimerContent
        recipe={recipe}
        onComplete={handleComplete}
        completeButtonText="Done"
        showCloseButton={false}
        showBorder={true}
        onBack={handleBack}
      />
    </div>
  );
}