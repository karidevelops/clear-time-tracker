
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clients, Client, Project } from '@/data/ClientsData';
import { Button } from '@/components/ui/button';
import { Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ClientsProjects = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('clients');
  const [localClients, setLocalClients] = useState<Client[]>(clients);
  const [editClientDialog, setEditClientDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedProjects, setEditedProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  
  // New state for add project dialog
  const [addProjectDialog, setAddProjectDialog] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', clientId: '' });

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setEditedName(client.name);
    setEditedProjects([...client.projects]);
    setEditClientDialog(true);
  };

  const handleSaveClient = () => {
    if (!currentClient) return;

    const updatedClients = localClients.map(client => {
      if (client.id === currentClient.id) {
        return {
          ...client,
          name: editedName,
          projects: editedProjects
        };
      }
      return client;
    });

    setLocalClients(updatedClients);
    setEditClientDialog(false);
    toast.success(t('client_updated_successfully') || 'Client updated successfully');
  };

  const handleAddProject = () => {
    if (!newProjectName.trim() || !currentClient) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      clientId: currentClient.id
    };

    setEditedProjects([...editedProjects, newProject]);
    setNewProjectName('');
  };

  const handleRemoveProject = (projectId: string) => {
    setEditedProjects(editedProjects.filter(project => project.id !== projectId));
  };

  // New handler for opening add project dialog
  const handleAddNewProject = () => {
    setNewProject({ name: '', clientId: '' });
    setAddProjectDialog(true);
  };

  // New handler for saving a new project
  const handleSaveNewProject = () => {
    if (!newProject.name.trim() || !newProject.clientId) {
      toast.error(t('please_fill_all_fields') || 'Please fill all fields');
      return;
    }

    const projectToAdd: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      clientId: newProject.clientId
    };

    // Find the client and add the project
    const updatedClients = localClients.map(client => {
      if (client.id === newProject.clientId) {
        return {
          ...client,
          projects: [...client.projects, projectToAdd]
        };
      }
      return client;
    });

    setLocalClients(updatedClients);
    setAddProjectDialog(false);
    toast.success(t('project_added_successfully') || 'Project added successfully');
  };

  return (
    <Layout>
      <div className="py-6 reportronic-container">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('clients_and_projects')}</h1>
          <Button onClick={handleAddNewProject}>
            <Plus className="h-4 w-4 mr-2" />
            {t('add_project') || 'Add Project'}
          </Button>
        </div>
        
        <Tabs defaultValue="clients" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="clients">{t('clients')}</TabsTrigger>
            <TabsTrigger value="projects">{t('projects')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="space-y-6">
            {localClients.map((client) => (
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
                    {client.projects.map((project) => (
                      <li key={project.id} className="text-gray-700">
                        {project.name}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {localClients.flatMap(client => 
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
                  {localClients.map(client => (
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
    </Layout>
  );
};

export default ClientsProjects;
