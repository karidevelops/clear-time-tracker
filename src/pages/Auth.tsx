
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        toast.error(error.message);
        return;
      }

      // Check if user is admin
      if (email === "kari.vatka@sebitti.fi") {
        setIsAdmin(true);
      }

      // For demo purposes, always show 2FA for the admin
      if (email === "kari.vatka@sebitti.fi") {
        setShowOTP(true);
        setSessionData(data);
      } else {
        // For regular users, just log them in directly
        toast.success(t('login_successful'));
        navigate("/");
      }
    } catch (error: any) {
      console.error("Exception during login:", error);
      toast.error(error.message || t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0], // Basic name from email
          }
        }
      });

      if (error) {
        console.error("Registration error:", error);
        toast.error(error.message);
        return;
      }

      toast.success(t('registration_successful'));
      
      // In a real system, you might want to verify email first
      // For now, we'll just redirect to login tab
      setEmail("");
      setPassword("");
      document.getElementById("login-tab")?.click();
      
    } catch (error: any) {
      console.error("Exception during registration:", error);
      toast.error(error.message || t('registration_error'));
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In a real 2FA system, you would verify the code with a service
      // For this demo, we'll just check if it matches a hardcoded value for the admin
      if (isAdmin && otp === "123456") {
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

  if (showOTP) {
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
                <Label>{t('verification_code')}</Label>
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
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger id="login-tab" value="login">{t('login')}</TabsTrigger>
            <TabsTrigger value="register">{t('register')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardHeader>
                <CardTitle>{t('login')}</CardTitle>
                <CardDescription>
                  {t('enter_credentials')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-reportronic-500 hover:bg-reportronic-600" 
                  disabled={loading}
                >
                  {loading ? t('logging_in') : t('login')}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardHeader>
                <CardTitle>{t('register')}</CardTitle>
                <CardDescription>
                  {t('create_account')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t('email')}</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t('password')}</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-reportronic-500 hover:bg-reportronic-600" 
                  disabled={loading}
                >
                  {loading ? t('registering') : t('register')}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
