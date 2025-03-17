
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName: string;
}

export function AddProjectDialog({ open, onOpenChange, clientId, clientName }: AddProjectDialogProps) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const formSchema = z.object({
    name: z.string().min(3, t('project_name_required')),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ""
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (values: { name: string }) => {
      if (!clientId) {
        throw new Error('Client ID is required');
      }
      
      if (!isAdmin) {
        throw new Error('Admin access required');
      }
      
      console.log('Creating project for client:', clientId, 'with name:', values.name);
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: values.name,
          client_id: clientId,
          // owner_id is now nullable in the database, so we don't need to provide it
        })
        .select();
      
      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }
      
      console.log('Project created successfully:', data);
      return data[0];
    },
    onSuccess: () => {
      // Invalidate both projects and clients queries to refresh counts
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('project_added'));
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Error creating project:', error);
      if (error.message === 'Admin access required') {
        toast.error(t('admin_only_feature') || 'This feature is for administrators only');
      } else {
        toast.error(t('error_adding_project'));
      }
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!isAdmin) {
      toast.error(t('admin_only_feature') || 'This feature is for administrators only');
      return;
    }
    createProjectMutation.mutate({ name: values.name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('add_project_for')} {clientName}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('project_name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('enter_project_name')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  {t('cancel')}
                </Button>
              </DialogClose>
              <Button 
                type="submit"
                disabled={createProjectMutation.isPending || !isAdmin}
              >
                {createProjectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('add')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
