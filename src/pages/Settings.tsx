
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ClientsList } from "@/components/settings/ClientsList";
import { AddProjectDialog } from "@/components/settings/AddProjectDialog";

const Settings = () => {
  const { t } = useLanguage();
  const [selectedClient, setSelectedClient] = React.useState<{ id: string, name: string } | null>(null);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = React.useState(false);

  const handleAddProject = (client: { id: string, name: string }) => {
    setSelectedClient(client);
    setAddProjectDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <ClientsList onAddProject={handleAddProject} />

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
