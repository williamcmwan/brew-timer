import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Coffee, Droplet, Bean, BookOpen, Timer, Star, Settings, Play, CheckCircle2, GlassWater, Camera, Copy } from "lucide-react";

export default function UserGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Getting Started</h1>
            <p className="text-sm text-muted-foreground">Learn how to use the app</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" />
              Welcome to Your Coffee Journal
            </CardTitle>
            <CardDescription>
              Track your brews, perfect your recipes, and discover your ideal cup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Follow these 5 steps to start logging your coffee brews. Each step builds on the previous one to help you track and improve your brewing.
            </p>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="space-y-3">
          {/* Step 1: Setting up Equipment */}
          <AccordionItem value="step-1" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  1
                </div>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Set Up Your Equipment
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">Grinders, brewers, and servers</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="flex gap-6 pl-11">
                <div className="flex-1 space-y-4">
                  <p className="text-sm">Before brewing, add your coffee equipment to the app:</p>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <Coffee className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Grinders</p>
                        <p className="text-sm text-muted-foreground">Add your coffee grinder with model name, burr type (flat/conical), and what it's ideal for (espresso/pour-over).</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <Droplet className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Brewers</p>
                        <p className="text-sm text-muted-foreground">Add your brewing devices like V60, Chemex, AeroPress, or espresso machine.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <GlassWater className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Coffee Servers</p>
                        <p className="text-sm text-muted-foreground">Add your serving vessels with their weight. The server weight is used to calculate accurate yield during brewing.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm flex items-start gap-2">
                      <Copy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong>Quick Setup:</strong> Use the "Copy from Template" feature to quickly add commonly used equipment like popular grinders and brewers without manual input.</span>
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      <span><strong>How to:</strong> Go to Settings → tap the + button on Grinders, Brewers, or Coffee Servers</span>
                    </p>
                  </div>
                </div>
                
                <div className="hidden sm:block w-40 shrink-0">
                  <img 
                    src="/equipment.png" 
                    alt="Equipment setup screen" 
                    className="w-full rounded-lg border shadow-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 2: Adding Coffee Beans */}
          <AccordionItem value="step-2" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  2
                </div>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2">
                    <Bean className="h-4 w-4" />
                    Add Your Coffee Beans
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">Track origins, roasters, and batches</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="flex gap-6 pl-11">
                <div className="flex-1 space-y-4">
                  <p className="text-sm">Add your coffee beans with detailed information:</p>
                  
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Bean info:</strong> Name, roaster, country, region, process method</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Roast details:</strong> Roast level (light/medium/dark), roast date</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Tasting notes:</strong> Flavor profile from the roaster</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span><strong>Batches:</strong> Track multiple purchases with roast dates and weights</span>
                    </li>
                  </ul>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm flex items-start gap-2">
                      <Camera className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong>AI Photo Recognition:</strong> Take a photo of your coffee bag and let AI automatically extract the bean information — no manual typing needed!</span>
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      <span><strong>How to:</strong> Go to Settings → Coffee Beans → tap + to add</span>
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Add batches to track how many days after roast you're brewing. The app will automatically deduct coffee weight when you log brews.
                  </p>
                </div>
                
                <div className="hidden sm:block w-40 shrink-0">
                  <img 
                    src="/coffeebean.png" 
                    alt="Coffee beans screen" 
                    className="w-full rounded-lg border shadow-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 3: Creating Recipes */}
          <AccordionItem value="step-3" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  3
                </div>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Create a Recipe
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">Save your brew parameters</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="flex gap-6 pl-11">
                <div className="flex-1 space-y-4">
                  <p className="text-sm">Recipes store your brewing parameters for consistent results:</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-card border rounded-lg p-3">
                      <p className="font-medium mb-1">Basic Parameters</p>
                      <ul className="text-muted-foreground space-y-1 text-xs">
                        <li>• Dose (coffee weight)</li>
                        <li>• Water amount</li>
                        <li>• Ratio (e.g., 1:15)</li>
                        <li>• Grind size</li>
                      </ul>
                    </div>
                    <div className="bg-card border rounded-lg p-3">
                      <p className="font-medium mb-1">Brew Settings</p>
                      <ul className="text-muted-foreground space-y-1 text-xs">
                        <li>• Water temperature</li>
                        <li>• Target brew time</li>
                        <li>• Expected yield</li>
                        <li>• Process steps</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-sm flex items-start gap-2">
                      <Copy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span><strong>Recipe Templates:</strong> Load famous recipes like Tetsu Kasuya 4:6, James Hoffmann V60, or Scott Rao method from templates. Simply modify them to match your taste!</span>
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      <span><strong>How to:</strong> Go to Settings → Recipes → tap + to create</span>
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Add process steps (bloom, pours) to get a guided timer during brewing. You can also add a photo of your setup.
                  </p>
                </div>
                
                <div className="hidden sm:block w-40 shrink-0">
                  <img 
                    src="/recipe.png?" 
                    alt="Recipe screen" 
                    className="w-full rounded-lg border shadow-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 4: Brewing with Timer */}
          <AccordionItem value="step-4" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  4
                </div>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Brew with the Timer
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">Follow your recipe step by step</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="flex gap-6 pl-11">
                <div className="flex-1 space-y-4">
                  <p className="text-sm">Start a new brew from the Dashboard:</p>
                  
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">1</span>
                      <span>Select your coffee bean and batch</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">2</span>
                      <span>Choose your grinder and brewer</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">3</span>
                      <span>Pick a recipe (parameters auto-fill)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">4</span>
                      <span>Adjust parameters if needed, then start the timer</span>
                    </li>
                  </ol>

                  <div className="bg-card border rounded-lg p-3">
                    <p className="font-medium text-sm mb-2 flex items-center gap-2">
                      <Timer className="h-4 w-4 text-primary" />
                      Timer Features
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Visual progress through each pour step</li>
                      <li>• Audio alerts when it's time for the next step</li>
                      <li>• Running total of water poured</li>
                      <li>• Pause/resume functionality</li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      <span><strong>How to:</strong> Dashboard → New Brew → follow the steps</span>
                    </p>
                  </div>
                </div>
                
                <div className="hidden sm:block w-40 shrink-0">
                  <img 
                    src="/brew.png" 
                    alt="Brew timer screen" 
                    className="w-full rounded-lg border shadow-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Step 5: Brew Evaluation */}
          <AccordionItem value="step-5" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  5
                </div>
                <div className="text-left">
                  <div className="font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Evaluate Your Brew
                  </div>
                  <div className="text-sm text-muted-foreground font-normal">Rate, measure, and take notes</div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <div className="flex gap-6 pl-11">
                <div className="flex-1 space-y-4">
                  <p className="text-sm">After brewing, evaluate your coffee to track what works:</p>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <Star className="h-5 w-5 text-golden mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Rating</p>
                        <p className="text-sm text-muted-foreground">Give your brew 1-5 stars based on taste</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary mt-0.5 shrink-0">%</div>
                      <div>
                        <p className="font-medium">TDS & Extraction Yield</p>
                        <p className="text-sm text-muted-foreground">If you have a refractometer, enter TDS to calculate extraction yield automatically</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Notes & Photos</p>
                        <p className="text-sm text-muted-foreground">Add tasting notes, observations, and photos of your brew</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border rounded-lg p-3">
                    <p className="font-medium text-sm mb-2">Brew Templates</p>
                    <p className="text-xs text-muted-foreground">
                      Create custom evaluation templates in Settings → Brew Templates to track specific attributes like acidity, body, sweetness, or any custom fields you want to monitor.
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" />
                      <span><strong>How to:</strong> Complete the timer → fill in evaluation → Save</span>
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    💡 Tip: You can always edit or add evaluation later from Brew History by tapping the clipboard icon.
                  </p>
                </div>
                
                <div className="hidden sm:block w-40 shrink-0">
                  <img 
                    src="/evaluation.png" 
                    alt="Evaluation screen" 
                    className="w-full rounded-lg border shadow-sm"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="font-medium">Ready to start?</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/settings")} variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Set Up Equipment
                </Button>
                <Button onClick={() => navigate("/brew")}>
                  <Coffee className="h-4 w-4 mr-2" />
                  Start Brewing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
