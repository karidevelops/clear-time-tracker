
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ClientsList } from "@/components/settings/ClientsList";
import { Settings as SettingsIcon } from "lucide-react";
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
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-7 w-7 text-reportronic-600" />
        <h1 className="text-3xl font-bold text-reportronic-800">{t('settings')}</h1>
      </div>

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
