
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ClientsList } from "@/components/settings/ClientsList";
import { ProjectsList } from "@/components/settings/ProjectsList";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-7 w-7 text-reportronic-600" />
        <h1 className="text-3xl font-bold text-reportronic-800">{t('settings')}</h1>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="clients">{t('clients')}</TabsTrigger>
          <TabsTrigger value="projects">{t('projects')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients">
          <ClientsList />
        </TabsContent>
        
        <TabsContent value="projects">
          <ProjectsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
