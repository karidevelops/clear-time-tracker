
import { useState } from "react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onShowForgotPassword: () => void;
  onLoginSuccess: (data: any, isAdmin: boolean) => void;
}

const LoginForm = ({ onShowForgotPassword, onLoginSuccess }: LoginFormProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        toast.error(error.message);
        return;
      }

      if (email === "kari.vatka@sebitti.fi") {
        onLoginSuccess(data, true);
      } else {
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

  return (
    <>
      <CardHeader>
        <CardTitle>{t('login')}</CardTitle>
        <CardDescription>
          {t('enter_credentials')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
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
          <Button 
            type="button" 
            variant="link" 
            className="p-0 h-auto font-normal text-xs" 
            onClick={onShowForgotPassword}
          >
            {t('forgot_password')}
          </Button>
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
    </>
  );
};

export default LoginForm;
