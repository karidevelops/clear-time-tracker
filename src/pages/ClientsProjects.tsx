
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type Client = {
  id: string;
  name: string;
  projects: Project[];
};

type Project = {
  id: string;
  name: string;
  clientId: string;
};

const ClientsProjects = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('clients');
  const [editClientDialog, setEditClientDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedProjects, setEditedProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  
  // New state for add project dialog
  const [addProjectDialog, setAddProjectDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', clientId: '' });
  
  // New state for add client dialog
  const [addClientDialog, setAddClientDialog] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch clients and projects from Supabase
  const { data: supabaseClients = [], isLoading } = useQuery({
    queryKey: ['clients-with-projects'],
    queryFn: async () => {
      console.log('Fetching clients for projects page...');
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name');
      
      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        toast.error(t('error_fetching_clients') || 'Error fetching clients');
        return [];
      }

      console.log('Clients data:', clientsData);

      // Fetch projects for each client
      const clientsWithProjects = await Promise.all(
        clientsData.map(async (client) => {
          const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, name')
            .eq('client_id', client.id);
          
          if (projectsError) {
            console.error('Error fetching projects:', projectsError);
          }

          return {
            id: client.id,
            name: client.name,
            projects: projectsData?.map(project => ({
              id: project.id,
              name: project.name,
              clientId: client.id
            })) || []
          };
        })
      );
      
      return clientsWithProjects;
    }
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientName: string) => {
      console.log('Creating client with name:', clientName);
      const { data, error } = await supabase
        .from('clients')
        .insert({ name: clientName })
        .select();
      
      if (error) {
        console.error('Error creating client:', error);
        throw error;
      }
      console.log('Client created successfully:', data);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-with-projects'] });
      toast.success(t('client_added_successfully') || 'Client added successfully');
      setAddClientDialog(false);
      setNewClientName('');
    },
    onError: (error) => {
      console.error('Error creating client:', error);
      toast.error(t('error_adding_client') || 'Error adding client');
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (project: { name: string, clientId: string }) => {
      console.log('Creating project:', project);
      const { data, error } = await supabase
        .from('projects')
        .insert({ 
          name: project.name,
          client_id: project.clientId,
          owner_id: '00000000-0000-0000-0000-000000000000' // Placeholder owner_id
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
      queryClient.invalidateQueries({ queryKey: ['clients-with-projects'] });
      toast.success(t('project_added_successfully') || 'Project added successfully');
      setAddProjectDialog(false);
      setNewProject({ name: '', clientId: '' });
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error(t('error_adding_project') || 'Error adding project');
    }
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      console.log('Updating client:', id, name);
      const { data, error } = await supabase
        .from('clients')
        .update({ name })
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating client:', error);
        throw error;
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients-with-projects'] });
      toast.success(t('client_updated_successfully') || 'Client updated successfully');
      setEditClientDialog(false);
    },
    onError: (error) => {
      console.error('Error updating client:', error);
      toast.error(t('error_updating_client') || 'Error updating client');
    }
  });

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setEditedName(client.name);
    setEditedProjects([...client.projects]);
    setEditClientDialog(true);
  };

  const handleSaveClient = () => {
    if (!currentClient) return;
    
    updateClientMutation.mutate({
      id: currentClient.id,
      name: editedName
    });
  };

  const handleAddProject = () => {
    if (!newProjectName.trim() || !currentClient) return;

    const newProjectObj: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      clientId: currentClient.id
    };

    setEditedProjects([...editedProjects, newProjectObj]);
    setNewProjectName('');
  };

  const handleRemoveProject = (projectId: string) => {
    setEditedProjects(editedProjects.filter(project => project.id !== projectId));
  };

  const handleAddNewProject = () => {
    setNewProject({ name: '', clientId: '' });
    setAddProjectDialog(true);
  };

  const handleSaveNewProject = () => {
    if (!newProject.name.trim() || !newProject.clientId) {
      toast.error(t('please_fill_all_fields') || 'Please fill all fields');
      return;
    }

    createProjectMutation.mutate({
      name: newProject.name,
      clientId: newProject.clientId
    });
  };
  
  const handleAddNewClient = () => {
    setNewClientName('');
    setAddClientDialog(true);
  };
  
  const handleSaveNewClient = () => {
    if (!newClientName.trim()) {
      toast.error(t('please_enter_client_name') || 'Please enter client name');
      return;
    }
    
    createClientMutation.mutate(newClientName);
  };

  return (
    <Layout>
      <div className="py-6 reportronic-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('clients_and_projects')}</h1>
          <div className="flex gap-2">
            <Button onClick={handleAddNewClient}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('add_client') || 'Add Client'}
            </Button>
            <Button onClick={handleAddNewProject}>
              <Plus className="h-4 w-4 mr-2" />
              {t('add_project') || 'Add Project'}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="clients" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="clients">{t('clients')}</TabsTrigger>
            <TabsTrigger value="projects">{t('projects')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 rounded-full"></div>
              </div>
            ) : supabaseClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('no_clients_found') || 'No clients found'}
              </div>
            ) : (
              supabaseClients.map((client) => (
                <Card key={client.id} className="shadow-sm hover:shadow transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{client.name}</CardTitle>
                        <CardDescription>
                          {t('projects')}: {client.projects.length}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditClient(client)}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> {t('edit') || 'Edit'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-medium mb-2">{t('projects')}:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {client.projects.length > 0 ? (
                        client.projects.map((project) => (
                          <li key={project.id} className="text-gray-700">
                            {project.name}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 italic">{t('no_projects') || 'No projects'}</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-t-blue-500 rounded-full"></div>
                </div>
              ) : supabaseClients.flatMap(client => client.projects).length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {t('no_projects_found') || 'No projects found'}
                </div>
              ) : (
                supabaseClients.flatMap(client => 
                  client.projects.map(project => (
                    <Card key={project.id} className="shadow-sm hover:shadow transition-shadow">
                      <CardHeader>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>
                          {t('client')}: {client.name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600">
                          {t('project_id')}: {project.id}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Client Edit Dialog */}
      <Dialog open={editClientDialog} onOpenChange={setEditClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('edit_client') || 'Edit Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">{t('client_name') || 'Client Name'}</Label>
              <Input 
                id="client-name" 
                value={editedName} 
                onChange={(e) => setEditedName(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t('projects') || 'Projects'}</Label>
              <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                {editedProjects.map(project => (
                  <div key={project.id} className="flex items-center justify-between">
                    <span>{project.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveProject(project.id)}
                    >
                      {t('remove') || 'Remove'}
                    </Button>
                  </div>
                ))}
                {editedProjects.length === 0 && (
                  <p className="text-sm text-gray-500">{t('no_projects') || 'No projects'}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-project">{t('add_project') || 'Add Project'}</Label>
              <div className="flex gap-2">
                <Input 
                  id="new-project" 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder={t('project_name') || 'Project name'} 
                />
                <Button onClick={handleAddProject} type="button">
                  {t('add') || 'Add'}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClientDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSaveClient}>
              {t('save_changes') || 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Project Dialog */}
      <Dialog open={addProjectDialog} onOpenChange={setAddProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('add_new_project') || 'Add New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-client">{t('client') || 'Client'}</Label>
              <Select 
                onValueChange={(value) => setNewProject({...newProject, clientId: value})} 
                value={newProject.clientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_client') || 'Select client'} />
                </SelectTrigger>
                <SelectContent>
                  {supabaseClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-name">{t('project_name') || 'Project Name'}</Label>
              <Input 
                id="project-name" 
                value={newProject.name} 
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder={t('enter_project_name') || 'Enter project name'} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProjectDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSaveNewProject}>
              {t('add_project') || 'Add Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add New Client Dialog */}
      <Dialog open={addClientDialog} onOpenChange={setAddClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('add_new_client') || 'Add New Client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">{t('client_name') || 'Client Name'}</Label>
              <Input 
                id="client-name" 
                value={newClientName} 
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder={t('enter_client_name') || 'Enter client name'} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClientDialog(false)}>
              {t('cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSaveNewClient}>
              {t('add_client') || 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ClientsProjects;
