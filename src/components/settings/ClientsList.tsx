
import React, { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Loader2, FolderPlus, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Client = {
  id: string;
  name: string;
  project_count?: number;
};

type Project = {
  id: string;
  name: string;
  client_id: string;
};

interface ClientsListProps {
  onAddProject?: (client: { id: string; name: string }) => void;
}

export const ClientsList = ({ onAddProject }: ClientsListProps) => {
  const { t } = useLanguage();
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  const formSchema = z.object({
    name: z.string().min(3, t('client_name_required'))
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ""
    }
  });

  const toggleClientExpanded = (clientId: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      console.log('Fetching clients...');
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name');
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        toast.error(t('error_fetching_clients'));
        return [];
      }

      console.log('Clients data:', clientsData);

      const clientsWithProjects = await Promise.all(
        clientsData.map(async (client) => {
          const { count, error: countError } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id);
          
          if (countError) {
            console.error('Error counting projects:', countError);
          }
          
          return {
            ...client,
            project_count: count || 0
          };
        })
      );
      
      return clientsWithProjects;
    }
  });

  // Fetch projects for all clients
  const { data: allProjects = {}, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['clients-projects'],
    queryFn: async () => {
      if (!clients.length) return {};
      
      const clientProjects: Record<string, Project[]> = {};
      
      for (const client of clients) {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, client_id')
          .eq('client_id', client.id);
        
        if (error) {
          console.error(`Error fetching projects for client ${client.id}:`, error);
          continue;
        }
        
        clientProjects[client.id] = data;
      }
      
      return clientProjects;
    },
    enabled: clients.length > 0
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async ({ clientId, name }: { clientId: string, name: string }) => {
      console.log('Creating project for client:', clientId, 'with name:', name);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: name,
          client_id: clientId
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
      queryClient.invalidateQueries({ queryKey: ['clients-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('project_added'));
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error(t('error_adding_project'));
    }
  });

  const createClientMutation = useMutation({
    mutationFn: async (values: { name: string }) => {
      console.log('Creating client with name:', values.name);
      const { data, error } = await supabase
        .from('clients')
        .insert({ name: values.name })
        .select();
      
      if (error) {
        console.error('Error creating client:', error);
        throw error;
      }
      console.log('Client created successfully:', data);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('client_added'));
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error('Error creating client:', error);
      toast.error(t('error_adding_client'));
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      console.log('Updating client with id:', id, 'new name:', name);
      const { data, error } = await supabase
        .from('clients')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating client:', error);
        throw error;
      }
      console.log('Client updated successfully:', data);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('client_updated'));
      setDialogOpen(false);
      setEditingClient(null);
      form.reset();
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast.error(t('error_updating_client'));
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting client with id:', id);
      const { count, error: countError } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', id);
      
      if (countError) {
        console.error('Error checking projects:', countError);
        throw countError;
      }
      
      if (count && count > 0) {
        console.error('Client has projects, cannot delete');
        throw new Error('client_has_projects');
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting client:', error);
        throw error;
      }
      console.log('Client deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(t('client_deleted'));
    },
    onError: (error: any) => {
      console.error('Error deleting client:', error);
      if (error.message === 'client_has_projects') {
        toast.error(t('cannot_delete_client_with_projects'));
      } else {
        toast.error(t('error_deleting_client'));
      }
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ['clients-projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
    console.log('Form submitted with values:', values);
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient, name: values.name });
    } else {
      createClientMutation.mutate({ name: values.name });
    }
  };

  const handleEdit = (clientId: string, clientName: string) => {
    setEditingClient(clientId);
    form.setValue("name", clientName);
    setDialogOpen(true);
  };

  const handleDelete = (clientId: string) => {
    deleteClientMutation.mutate(clientId);
  };

  const handleAddNew = () => {
    setEditingClient(null);
    form.reset();
    setDialogOpen(true);
  };

  const handleAddProject = (clientId: string, clientName: string) => {
    if (onAddProject) {
      onAddProject({ id: clientId, name: clientName });
    } else {
      // Open create project dialog with clientId
      const projectName = prompt(t('enter_project_name'));
      if (projectName && projectName.trim()) {
        createProjectMutation.mutate({ 
          clientId: clientId, 
          name: projectName.trim() 
        });
      }
    }
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProjectMutation.mutate(projectId);
  };

  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log('Form values changed:', value);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{t('manage_clients')}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              {t('add_client')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? t('edit_client') : t('add_client')}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('client_name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('enter_client_name')} {...field} />
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
                    disabled={createClientMutation.isPending || updateClientMutation.isPending}
                  >
                    {(createClientMutation.isPending || updateClientMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingClient ? t('update') : t('add')}
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
              <TableHead>{t('client_name')}</TableHead>
              <TableHead>{t('projects_count')}</TableHead>
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
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  {t('no_clients')}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <React.Fragment key={client.id}>
                  <TableRow className="bg-muted/40">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2" onClick={() => toggleClientExpanded(client.id)} style={{ cursor: 'pointer' }}>
                        {expandedClients[client.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span>{client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{client.project_count}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddProject(client.id, client.name)}
                        title={t('add_project')}
                      >
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(client.id, client.name)}
                        title={t('edit_client')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(client.id)}
                        disabled={deleteClientMutation.isPending || (client.project_count && client.project_count > 0)}
                        title={t('delete_client')}
                      >
                        {deleteClientMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Projects for this client */}
                  {expandedClients[client.id] && (
                    <>
                      {isLoadingProjects ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-2 pl-10">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : allProjects[client.id]?.length ? (
                        allProjects[client.id].map((project) => (
                          <TableRow key={project.id} className="border-t-0">
                            <TableCell className="pl-10">{project.name}</TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={deleteProjectMutation.isPending}
                                title={t('delete_project')}
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
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-2 pl-10 text-muted-foreground">
                            {t('no_projects')}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
