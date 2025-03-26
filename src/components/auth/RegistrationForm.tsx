
import { useState } from "react";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface RegistrationFormProps {
  onRegistrationSuccess: () => void;
}

const RegistrationForm = ({ onRegistrationSuccess }: RegistrationFormProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
        onRegistrationSuccess();
      }
      
    } catch (error: any) {
      console.error("Exception during registration:", error);
      toast.error(error.message || t('registration_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>{t('register')}</CardTitle>
        <CardDescription>
          {t('create_account')}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleRegister}>
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
    </>
  );
};

export default RegistrationForm;
