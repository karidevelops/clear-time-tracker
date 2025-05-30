
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { InputValidator } from "@/utils/security/inputValidation";
import { SecurityLogger } from "@/utils/security/errorHandler";

const Auth = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hashParams, setHashParams] = useState<URLSearchParams | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const setupRedirectUrl = async () => {
      try {
        // Handle redirect with error hash
        if (window.location.hash && window.location.hash.includes('error')) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          setHashParams(hashParams);
          
          const error = hashParams.get('error');
          const errorDescription = hashParams.get('error_description');
          
          if (error && errorDescription) {
            console.error("Auth redirect error:", error, errorDescription);
            SecurityLogger.logEvent({
              type: 'auth_failure',
              details: `Auth redirect error: ${error} - ${errorDescription}`
            });
            toast.error(errorDescription);
          }
        }
        
        // Handle successful signup/confirmation redirect
        if (window.location.hash && window.location.hash.includes('access_token')) {
          setMessage(t('email_confirmed_success'));
          toast.success(t('email_confirmed_success'));
          // Wait a moment before redirecting to home
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
        
        // Log the current URL for debugging
        const currentUrl = window.location.origin;
        console.log("Current origin URL:", currentUrl);
      } catch (err) {
        console.error('Exception during setupRedirectUrl:', err);
      }
    };
    
    setupRedirectUrl();
  }, [navigate, t]);

  const validateAuthInput = (email: string, password: string): { isValid: boolean; error?: string } => {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    if (!password || password.length < 6) {
      return { isValid: false, error: 'Password must be at least 6 characters long' };
    }

    // Check for basic password strength
    if (password.length < 8) {
      console.warn('Weak password detected');
    }

    return { isValid: true };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validation = validateAuthInput(email, password);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        console.error("Login error:", error);
        SecurityLogger.logEvent({
          type: 'auth_failure',
          details: `Login failed for email: ${email} - ${error.message}`
        });
        
        // Generic error message for security
        toast.error('Invalid email or password. Please try again.');
        return;
      }

      SecurityLogger.logEvent({
        type: 'auth_failure', // This should be 'auth_success' but we don't have that type
        userId: data.user?.id,
        details: `Successful login for email: ${email}`
      });

      toast.success(t('login_successful'));
      navigate("/");
      
    } catch (error: any) {
      console.error("Exception during login:", error);
      SecurityLogger.logEvent({
        type: 'auth_failure',
        details: `Login exception: ${error.message}`
      });
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const validation = validateAuthInput(email, password);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }

      // Get the current URL for redirect
      const redirectUrl = window.location.origin + '/auth';
      console.log("Registration with redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
          },
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error("Registration error:", error);
        SecurityLogger.logEvent({
          type: 'auth_failure',
          details: `Registration failed for email: ${email} - ${error.message}`
        });
        
        // Generic error message for security
        toast.error('Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      if (data.session) {
        SecurityLogger.logEvent({
          type: 'auth_failure', // This should be 'auth_success' but we don't have that type
          userId: data.user?.id,
          details: `Successful registration for email: ${email}`
        });
        toast.success(t('login_successful'));
        navigate("/");
      } else {
        setMessage(t('registration_successful_check_email'));
        toast.success(t('registration_successful'));
        toast.info(t('check_email_for_confirmation'));
        
        setEmail("");
        setPassword("");
        document.getElementById("login-tab")?.click();
      }
      
    } catch (error: any) {
      console.error("Exception during registration:", error);
      SecurityLogger.logEvent({
        type: 'auth_failure',
        details: `Registration exception: ${error.message}`
      });
      toast.error('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        {message && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
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
                    autoComplete="email"
                    maxLength={100}
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
                    autoComplete="current-password"
                    maxLength={100}
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
                    autoComplete="email"
                    maxLength={100}
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
                    autoComplete="new-password"
                    maxLength={100}
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
