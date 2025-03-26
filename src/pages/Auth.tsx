
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/context/LanguageContext";
import LoginForm from "@/components/auth/LoginForm";
import RegistrationForm from "@/components/auth/RegistrationForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import TwoFactorForm from "@/components/auth/TwoFactorForm";

const Auth = () => {
  const { t } = useLanguage();
  const [showOTP, setShowOTP] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const setupRedirectUrl = async () => {
      try {
        // Get the full origin URL to use for redirects
        const currentUrl = window.location.origin;
        console.log("Setting redirect URL to:", currentUrl);
      } catch (err) {
        console.error('Exception during setupRedirectUrl:', err);
      }
    };
    
    setupRedirectUrl();
  }, []);

  const handleLoginSuccess = (data: any, isAdmin: boolean) => {
    setIsAdmin(isAdmin);
    setShowOTP(isAdmin);
    setSessionData(data);
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  const handleRegistrationSuccess = () => {
    document.getElementById("login-tab")?.click();
  };

  if (showOTP) {
    return <TwoFactorForm sessionData={sessionData} />;
  }

  if (showForgotPassword) {
    return <ForgotPasswordForm onBackToLogin={handleBackToLogin} />;
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
            <LoginForm 
              onShowForgotPassword={handleShowForgotPassword} 
              onLoginSuccess={handleLoginSuccess} 
            />
          </TabsContent>
          
          <TabsContent value="register">
            <RegistrationForm
              onRegistrationSuccess={handleRegistrationSuccess}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
