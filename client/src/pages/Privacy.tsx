import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { BuyMeCoffee } from "@/components/BuyMeCoffee";

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>
          <BuyMeCoffee />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Privacy Matters
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Introduction</h3>
              <p className="text-muted-foreground">
                Welcome to Coffee Brew Timer ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience using our application. This Privacy Policy explains how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Information We Collect</h3>
              <div className="space-y-3 text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground">2.1 Information You Provide</h4>
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li><strong>Recipe Data:</strong> Coffee recipes, brewing parameters, and preferences you create</li>
                    <li><strong>Contact Information:</strong> Name and email address when you use our contact form</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground">2.2 Automatically Collected Information</h4>
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li><strong>Guest ID:</strong> A unique identifier generated to sync your recipes across devices</li>
                    <li><strong>Local Storage:</strong> Browser storage for offline access and preferences</li>
                    <li><strong>Usage Data:</strong> Basic analytics about how you use the app (no personal identification)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. How We Use Your Information</h3>
              <p className="text-muted-foreground mb-2">We use the collected information for:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Providing and maintaining the coffee timer service</li>
                <li>Syncing your recipes across devices</li>
                <li>Responding to your inquiries and support requests</li>
                <li>Improving our application and user experience</li>
                <li>Sending important service updates (if applicable)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Data Storage and Security</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  <strong>Local Storage:</strong> Your recipes are stored in your browser's local storage for offline access.
                </p>
                <p>
                  <strong>Database Storage:</strong> Recipe data is stored in our secure database to enable syncing across devices.
                </p>
                <p>
                  <strong>Security Measures:</strong> We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Data Sharing and Third Parties</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  We do not sell, trade, or rent your personal information to third parties. We may share data with:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>EmailJS:</strong> For processing contact form submissions (only when you contact us)</li>
                  <li><strong>Google reCAPTCHA:</strong> For spam protection on contact forms</li>
                  <li><strong>Cloudflare:</strong> For content delivery and DDoS protection</li>
                </ul>
                <p className="mt-2">
                  These services have their own privacy policies and we encourage you to review them.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Cookies and Tracking</h3>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  We use browser local storage (not traditional cookies) to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Store your recipes and preferences</li>
                  <li>Remember your cookie consent choice</li>
                  <li>Maintain your guest ID for syncing</li>
                </ul>
                <p className="mt-2">
                  We do not use tracking cookies or third-party analytics that identify you personally.
                </p>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Your Rights</h3>
              <p className="text-muted-foreground mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Access:</strong> Request a copy of your data</li>
                <li><strong>Correction:</strong> Update or correct your information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (clear browser storage or contact us)</li>
                <li><strong>Portability:</strong> Export your recipes in a standard format</li>
                <li><strong>Opt-out:</strong> Stop using the service at any time</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">8. Children's Privacy</h3>
              <p className="text-muted-foreground">
                Our service is not directed to children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">9. International Data Transfers</h3>
              <p className="text-muted-foreground">
                Your information may be transferred to and maintained on servers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our service, you consent to this transfer.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">10. Changes to This Policy</h3>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">11. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices, please contact us using the contact form on our website.
              </p>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-sm text-muted-foreground italic">
                By using Coffee Brew Timer, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center pb-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
