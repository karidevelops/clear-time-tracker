
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ClientsList } from "@/components/settings/ClientsList";
import { UsersList } from "@/components/settings/UsersList";
import { AddProjectDialog } from "@/components/settings/AddProjectDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

const Settings = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = React.useState<{ id: string, name: string } | null>(null);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("clients");

  const handleAddProject = (client: { id: string, name: string }) => {
    setSelectedClient(client);
    setAddProjectDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="clients" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="clients">{t('clients_and_projects')}</TabsTrigger>
          <TabsTrigger value="users">{t('users')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <ClientsList onAddProject={handleAddProject} />
        </TabsContent>
        
        <TabsContent value="users">
          <UsersList />
        </TabsContent>
      </Tabs>

      {selectedClient && (
        <AddProjectDialog
          open={addProjectDialogOpen}
          onOpenChange={setAddProjectDialogOpen}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
        />
      )}
    </div>
  );
};

export default Settings;
