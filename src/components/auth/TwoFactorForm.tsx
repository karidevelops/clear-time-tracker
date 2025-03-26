
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorFormProps {
  sessionData: any;
}

const TwoFactorForm = ({ sessionData }: TwoFactorFormProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [otp, setOTP] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const verify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log("Verifying 2FA code:", otp);
      if (otp === "123456") {
        toast.success(t('2fa_verified'));
        navigate("/");
      } else {
        toast.error(t('invalid_2fa_code'));
      }
    } catch (error: any) {
      console.error("Exception during 2FA:", error);
      toast.error(error.message || t('2fa_error'));
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async () => {
    setSendingEmail(true);
    
    try {
      // In a real application, this would send a code to the user's email
      // We're simulating this behavior here
      
      // Get the user's email from the session data if available
      const userEmail = sessionData?.user?.email || "user@example.com";
      
      console.log("Sending verification code to email:", userEmail);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would use an edge function to send the email
      // with the code securely, not expose it in the frontend
      
      toast.success(t('verification_code_sent') || 'Verification code sent to your email');
      toast.info('123456'); // For demo purposes only, showing the code as a toast
    } catch (error: any) {
      console.error("Exception during email code sending:", error);
      toast.error(error.message || t('email_send_error') || 'Error sending verification code');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('two_factor_authentication')}</CardTitle>
          <CardDescription>{t('enter_2fa_code')}</CardDescription>
        </CardHeader>
        <form onSubmit={verify2FA}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label>{t('verification_code')}</label>
              <InputOTP 
                maxLength={6} 
                value={otp} 
                onChange={setOTP}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} index={index} />
                    ))}
                  </InputOTPGroup>
                )}
              />
              <div className="flex flex-col space-y-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={sendEmailCode}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (t('sending') || 'Sending...') : (t('send_code_to_email') || 'Send Code to Email')}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {t('demo_use_code')} 123456
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-reportronic-500 hover:bg-reportronic-600" 
              disabled={loading || otp.length < 6}
            >
              {loading ? t('verifying') : t('verify')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default TwoFactorForm;
