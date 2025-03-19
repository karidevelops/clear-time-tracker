
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCheckAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkUserRole = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }
      
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Exception checking admin status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkUserRole();
  }, []);

  return { isAdmin, isChecking };
};
