
import React, { useState, useEffect } from "react";
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
import { useSearchParams } from "react-router-dom";

const Settings = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("clients");
  
  // Get client_id from URL if present
  const clientId = searchParams.get("client_id");

  // Set the active tab on component mount or search params change
  useEffect(() => {
    // If there's a client_id in the URL, switch to the projects tab
    if (clientId) {
      setActiveTab("projects");
    } else {
      // Get tab from URL or default to clients
      const tabFromUrl = searchParams.get("tab");
      setActiveTab(tabFromUrl === "projects" ? "projects" : "clients");
    }
  }, [clientId, searchParams]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(params => {
      params.set("tab", value);
      // If switching to clients tab, remove client_id
      if (value === "clients") {
        params.delete("client_id");
      }
      return params;
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="h-7 w-7 text-reportronic-600" />
        <h1 className="text-3xl font-bold text-reportronic-800">{t('settings')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
