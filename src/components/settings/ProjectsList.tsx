
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { clients, Client, Project, getAllProjects } from "@/data/ClientsData";

export const ProjectsList = () => {
  const { t } = useLanguage();
  const [localClients, setLocalClients] = useState<Client[]>(clients);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const allProjects = getAllProjects();

  const formSchema = z.object({
    name: z.string().min(3, t('project_name_required')),
    clientId: z.string().min(1, t('client_required'))
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      clientId: ""
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Deep clone the clients array to avoid direct state mutation
    const updatedClients = JSON.parse(JSON.stringify(localClients)) as Client[];
    const clientIndex = updatedClients.findIndex(c => c.id === values.clientId);
    
    if (clientIndex === -1) {
      toast.error(t('client_not_found'));
      return;
    }

    if (editingProject) {
      // Edit existing project
      // First, find which client has this project
      let foundInClient: Client | undefined;
      let projectToUpdate: Project | undefined;
      
      for (const client of updatedClients) {
        const projectIndex = client.projects.findIndex(p => p.id === editingProject);
        if (projectIndex !== -1) {
          foundInClient = client;
          projectToUpdate = client.projects[projectIndex];
          
          // Remove from old client if moving to a different client
          if (client.id !== values.clientId) {
            client.projects.splice(projectIndex, 1);
          } else {
            // Update in the same client
            client.projects[projectIndex] = {
              ...client.projects[projectIndex],
              name: values.name
            };
          }
          break;
        }
      }
      
      // If moving to a different client, add to the new one
      if (foundInClient && projectToUpdate && foundInClient.id !== values.clientId) {
        const targetClient = updatedClients.find(c => c.id === values.clientId);
        if (targetClient) {
          targetClient.projects.push({
            ...projectToUpdate,
            name: values.name,
            clientId: values.clientId
          });
        }
      }
      
      toast.success(t('project_updated'));
    } else {
      // Add new project
      const newProject = {
        id: Date.now().toString(),
        name: values.name,
        clientId: values.clientId
      };
      
      updatedClients[clientIndex].projects.push(newProject);
      toast.success(t('project_added'));
    }
    
    setLocalClients(updatedClients);
    setDialogOpen(false);
    setEditingProject(null);
    form.reset();
  };

  const handleEdit = (projectId: string) => {
    const project = allProjects.find(p => p.id === projectId);
    if (project) {
      setEditingProject(projectId);
      form.setValue("name", project.name);
      form.setValue("clientId", project.clientId);
      setDialogOpen(true);
    }
  };

  const handleDelete = (projectId: string) => {
    const updatedClients = localClients.map(client => ({
      ...client,
      projects: client.projects.filter(project => project.id !== projectId)
    }));
    
    setLocalClients(updatedClients);
    toast.success(t('project_deleted'));
  };

  const handleAddNew = () => {
    setEditingProject(null);
    form.reset();
    setDialogOpen(true);
  };

  // Get all projects from all clients for the list view
  const allProjectsWithClients = allProjects.map(project => {
    const client = localClients.find(c => c.id === project.clientId);
    return {
      ...project,
      clientName: client ? client.name : t('unknown_client')
    };
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{t('manage_projects')}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} disabled={localClients.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              {t('add_project')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? t('edit_project') : t('add_project')}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
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
                          {localClients.map((client) => (
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
                  <Button type="submit">
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
            {allProjectsWithClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  {t('no_projects')}
                </TableCell>
              </TableRow>
            ) : (
              allProjectsWithClients.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.clientName}</TableCell>
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
