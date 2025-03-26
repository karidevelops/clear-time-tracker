
import { useState, useEffect } from "react";
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
import { AlertCircle, Loader2 } from "lucide-react";

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
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const setupRedirectUrl = async () => {
      try {
        const currentUrl = window.location.origin;
        console.log("Setting redirect URL to:", currentUrl);
      } catch (err) {
        console.error('Exception during setupRedirectUrl:', err);
      }
    };
    
    setupRedirectUrl();

    // Check initial session
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("User already logged in, redirecting to home");
        navigate("/");
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo("");
    
    try {
      console.log(`Attempting to login with email: ${email}`);
      
      // Trim whitespace from inputs
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      setDebugInfo(`Attempting login with: ${trimmedEmail}`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword
      });

      if (error) {
        console.error("Login error:", error);
        setDebugInfo(prev => `${prev}\nError: ${JSON.stringify(error)}`);
        toast.error(error.message);
        
        // If the error is for the admin user, check if they need to reset their password
        if (trimmedEmail.toLowerCase() === "kari.vatka@sebitti.fi") {
          setDebugInfo(prev => `${prev}\nThis is the admin account. You may need to reset the password.`);
        }
        
        return;
      }

      // Special handling for admin user with 2FA
      if (trimmedEmail.toLowerCase() === "kari.vatka@sebitti.fi") {
        setIsAdmin(true);
        setShowOTP(true);
        setSessionData(data);
        toast.success(t('enter_verification_code'));
        setDebugInfo(prev => `${prev}\nAdmin login successful. 2FA required.`);
      } else {
        toast.success(t('login_successful'));
        navigate("/");
      }
    } catch (error: any) {
      console.error("Exception during login:", error);
      setDebugInfo(prev => `${prev}\nException: ${JSON.stringify(error)}`);
      toast.error(error.message || t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const redirectUrl = window.location.origin;
      console.log("Registration with redirect URL:", redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
          },
          emailRedirectTo: `${redirectUrl}/auth`
        }
      });

      if (error) {
        console.error("Registration error:", error);
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        toast.success(t('login_successful'));
        navigate("/");
      } else {
        toast.success(t('registration_successful'));
        toast.info(t('check_email_for_confirmation'));
        
        setEmail("");
        setPassword("");
        document.getElementById("login-tab")?.click();
      }
      
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

  const resetAdminPassword = async () => {
    try {
      setResetPasswordLoading(true);
      setResetSuccess(false);
      setDebugInfo(prev => `${prev}\nAttempting to reset admin password...`);
      
      toast.info("Attempting to reset admin password...");
      
      const response = await supabase.functions.invoke('reset-admin-password');
      
      console.log("Password reset response:", response);
      setDebugInfo(prev => `${prev}\nPassword reset response: ${JSON.stringify(response)}`);
      
      if (response.error) {
        toast.error(`Reset failed: ${response.error}`);
        console.error("Password reset error:", response.error);
        setDebugInfo(prev => `${prev}\nReset failed: ${response.error}`);
        return;
      }
      
      if (response.data && response.data.success) {
        toast.success("Password has been reset to 'testailu'");
        setPassword("testailu");
        setResetSuccess(true);
        setDebugInfo(prev => `${prev}\nPassword successfully reset to 'testailu'`);
      } else {
        const errorMsg = response.data?.error || "Unknown error";
        toast.error(`Reset failed: ${errorMsg}`);
        setDebugInfo(prev => `${prev}\nReset failed: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error("Exception during password reset:", error);
      setDebugInfo(prev => `${prev}\nException: ${error.message || JSON.stringify(error)}`);
      toast.error(`Error: ${error.message}`);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const sendVerificationCode = () => {
    // In a real implementation, this would send a code via email
    toast.success("Verification code sent to your email!");
    // For demo purposes, we'll display the code in the UI
    toast.info("Demo code: 123456");
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
                      {slots && slots.map((slot, index) => (
                        <InputOTPSlot key={index} {...slot} index={index} />
                      ))}
                    </InputOTPGroup>
                  )}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-sm text-muted-foreground">
                    {t('demo_use_code')} 123456
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={sendVerificationCode}
                  >
                    {t('send_code')}
                  </Button>
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
                {email.toLowerCase() === "kari.vatka@sebitti.fi" && (
                  <div className="pt-2">
                    <Button 
                      type="button" 
                      variant={resetSuccess ? "outline" : "secondary"}
                      size="sm" 
                      onClick={resetAdminPassword}
                      className="w-full"
                      disabled={resetPasswordLoading}
                    >
                      {resetPasswordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : resetSuccess ? (
                        "Password Reset Successful ✓"
                      ) : (
                        "Reset Admin Password"
                      )}
                    </Button>
                  </div>
                )}
                {debugInfo && (
                  <div className="text-xs mt-2 p-2 bg-muted rounded-md overflow-x-auto">
                    <div className="flex items-center text-amber-500 mb-1 gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span className="font-medium">Debug Information</span>
                    </div>
                    <pre className="whitespace-pre-wrap break-words">{debugInfo}</pre>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-reportronic-500 hover:bg-reportronic-600" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('logging_in')}
                    </>
                  ) : t('login')}
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
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('registering')}
                    </>
                  ) : t('register')}
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
