
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clients } from "@/data/ClientsData";

export const ClientsList = () => {
  const { t } = useLanguage();
  const [localClients, setLocalClients] = useState(clients);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const formSchema = z.object({
    name: z.string().min(3, t('client_name_required'))
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingClient) {
      // Edit existing client
      const updatedClients = localClients.map(client => 
        client.id === editingClient 
          ? { ...client, name: values.name } 
          : client
      );
      setLocalClients(updatedClients);
      toast.success(t('client_updated'));
    } else {
      // Add new client
      const newClient = {
        id: Date.now().toString(),
        name: values.name,
        projects: []
      };
      setLocalClients([...localClients, newClient]);
      toast.success(t('client_added'));
    }
    
    setDialogOpen(false);
    setEditingClient(null);
    form.reset();
  };

  const handleEdit = (clientId: string) => {
    const client = localClients.find(c => c.id === clientId);
    if (client) {
      setEditingClient(clientId);
      form.setValue("name", client.name);
      setDialogOpen(true);
    }
  };

  const handleDelete = (clientId: string) => {
    // Check if client has projects
    const client = localClients.find(c => c.id === clientId);
    if (client && client.projects.length > 0) {
      toast.error(t('cannot_delete_client_with_projects'));
      return;
    }
    
    setLocalClients(localClients.filter(client => client.id !== clientId));
    toast.success(t('client_deleted'));
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
                  <Button type="submit">
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
            {localClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  {t('no_clients')}
                </TableCell>
              </TableRow>
            ) : (
              localClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.projects.length}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
