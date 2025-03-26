
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

const ForgotPasswordForm = ({ onBackToLogin }: ForgotPasswordFormProps) => {
  const { t } = useLanguage();
  const [resetEmail, setResetEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get the correct base URL for redirection
      const currentUrl = window.location.origin;
      const redirectTo = `${currentUrl}/auth`;
      
      console.log("Password reset with redirect URL:", redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
      });

      if (error) {
        console.error("Password reset error:", error);
        toast.error(error.message);
        return;
      }

      toast.success(t('password_reset_email_sent'));
      onBackToLogin();
      setResetEmail("");
    } catch (error: any) {
      console.error("Exception during password reset:", error);
      toast.error(error.message || t('password_reset_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('forgot_password') || "Forgot Password"}</CardTitle>
          <CardDescription>
            {t('enter_email_for_password_reset') || "Enter your email to receive a password reset link"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleForgotPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t('email')}</Label>
              <Input 
                id="reset-email" 
                type="email" 
                value={resetEmail} 
                onChange={(e) => setResetEmail(e.target.value)} 
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-reportronic-500 hover:bg-reportronic-600" 
              disabled={loading}
            >
              {loading ? t('sending') || "Sending..." : t('send_reset_link') || "Send Reset Link"}
            </Button>
            <Button 
              type="button" 
              variant="ghost"
              className="w-full" 
              onClick={onBackToLogin}
            >
              {t('back_to_login') || "Back to Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPasswordForm;
