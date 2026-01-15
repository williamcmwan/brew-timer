import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export function CookieNotice() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem("coffee-timer-cookies-accepted");
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("coffee-timer-cookies-accepted", "true");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("coffee-timer-cookies-accepted", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <Card className="max-w-2xl mx-auto border-2 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">🍪 Privacy & Data Storage</h3>
              <p className="text-sm text-muted-foreground mb-3">
                This app stores your recipes and preferences in our database and uses browser local storage for offline access. 
                We generate a unique guest ID to sync your data across devices. No personal information is required or collected. 
                Your data is not shared with third parties.{" "}
                <button
                  onClick={() => {
                    handleAccept();
                    navigate("/privacy");
                  }}
                  className="text-primary hover:underline"
                >
                  Learn more
                </button>
              </p>
              <div className="flex gap-2">
                <Button onClick={handleAccept} size="sm">
                  Accept
                </Button>
                <Button onClick={handleDismiss} variant="outline" size="sm">
                  Dismiss
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
