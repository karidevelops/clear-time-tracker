
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

interface TwoFactorFormProps {
  sessionData: any;
}

const TwoFactorForm = ({ sessionData }: TwoFactorFormProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [otp, setOTP] = useState("");
  const [loading, setLoading] = useState(false);

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
                      <InputOTPSlot key={index} {...slot} />
                    ))}
                  </InputOTPGroup>
                )}
              />
              <p className="text-sm text-muted-foreground">
                {t('demo_use_code')} 123456
              </p>
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
