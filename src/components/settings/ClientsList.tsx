
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Client = {
  id: string;
  name: string;
  project_count?: number;
};

export const ClientsList = () => {
  const { t } = useLanguage();
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  // Fetch clients from Supabase
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name');
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        toast.error(t('error_fetching_clients'));
        return [];
      }

      // Fetch project counts for each client
      const clientsWithProjects = await Promise.all(
        clientsData.map(async (client) => {
          const { count, error: countError } = await supabase
            .from('projects')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', client.id);
          
          return {
            ...client,
            project_count: count || 0
          };
        })
      );
      
      return clientsWithProjects;
    }
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (values: { name: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({ name: values.name })
        .select();
      
      if (error) throw error;
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

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      
      if (error) throw error;
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

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      // First check if client has projects
      const { count, error: countError } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', id);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error('client_has_projects');
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
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
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.project_count}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client.id, client.name)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      disabled={deleteClientMutation.isPending}
                    >
                      {deleteClientMutation.isPending ? (
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
