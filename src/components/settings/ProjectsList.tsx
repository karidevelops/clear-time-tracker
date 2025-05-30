
import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Client = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  client_id: string;
  client_name?: string;
};

export const ProjectsList = () => {
  const { t } = useLanguage();
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const formSchema = z.object({
    name: z.string().min(3, t('project_name_required')),
    client_id: z.string().min(1, t('client_required'))
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      client_id: ""
    }
  });

  // Fetch clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        toast.error(t('error_fetching_clients'));
        return [];
      }
      
      return data;
    }
  });

  // Fetch projects with client info
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          name, 
          client_id,
          clients(name)
        `);
      
      if (error) {
        console.error('Error fetching projects:', error);
        toast.error(t('error_fetching_projects'));
        return [];
      }
      
      // Format the data for easier use in the UI
      return data.map(project => ({
        id: project.id,
        name: project.name,
        client_id: project.client_id,
        client_name: project.clients?.name
      }));
    },
    enabled: clients.length > 0
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (values: { name: string, client_id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: values.name,
          client_id: values.client_id,
          // Completely remove owner_id to let it be null in the database
        })
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('project_added'));
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error(t('error_adding_project'));
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, name, client_id }: { id: string, name: string, client_id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          name,
          client_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('project_updated'));
      setDialogOpen(false);
      setEditingProject(null);
      form.reset();
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error(t('error_updating_project'));
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if project has time entries
      const { count, error: countError } = await supabase
        .from('time_entries')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error('project_has_time_entries');
      }
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(t('project_deleted'));
    },
    onError: (error: any) => {
      console.error('Error deleting project:', error);
      if (error.message === 'project_has_time_entries') {
        toast.error(t('cannot_delete_project_with_time_entries'));
      } else {
        toast.error(t('error_deleting_project'));
      }
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingProject) {
      updateProjectMutation.mutate({ 
        id: editingProject, 
        name: values.name, 
        client_id: values.client_id 
      });
    } else {
      createProjectMutation.mutate({ 
        name: values.name, 
        client_id: values.client_id 
      });
    }
  };

  const handleEdit = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setEditingProject(projectId);
      form.setValue("name", project.name);
      form.setValue("client_id", project.client_id || "");
      setDialogOpen(true);
    }
  };

  const handleDelete = (projectId: string) => {
    deleteProjectMutation.mutate(projectId);
  };

  const handleAddNew = () => {
    setEditingProject(null);
    form.reset();
    setDialogOpen(true);
  };

  const isLoading = isLoadingClients || isLoadingProjects;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{t('manage_projects')}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} disabled={clients.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              {t('add_project')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? t('edit_project') : t('add_project')}
              </DialogTitle>
              <DialogDescription>
                {editingProject ? t('edit_project_description') : t('add_project_description')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('client')}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_client')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                    disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  >
                    {(createProjectMutation.isPending || updateProjectMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingProject ? t('update') : t('add')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('project_name')}</TableHead>
              <TableHead>{t('client')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  {t('no_projects')}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.client_name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(project.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                      disabled={deleteProjectMutation.isPending}
                    >
                      {deleteProjectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
