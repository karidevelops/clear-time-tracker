
import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { clients, Client, Project } from '@/data/ClientsData';

const ClientsProjects = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('clients');

  return (
    <Layout>
      <div className="py-6 reportronic-container">
        <h1 className="text-2xl font-bold mb-6">{t('clients_and_projects')}</h1>
        
        <Tabs defaultValue="clients" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="clients">{t('clients')}</TabsTrigger>
            <TabsTrigger value="projects">{t('projects')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="space-y-6">
            {clients.map((client) => (
              <Card key={client.id} className="shadow-sm hover:shadow transition-shadow">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>
                    {t('projects')}: {client.projects.length}
                  </CardDescription>
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
              {clients.flatMap(client => 
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
    </Layout>
  );
};

export default ClientsProjects;
