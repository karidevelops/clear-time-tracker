
// Mock data for clients and their projects
export type Client = {
  id: string;
  name: string;
  projects: Project[];
};

export type Project = {
  id: string;
  name: string;
  clientId: string;
};

export const clients: Client[] = [
  {
    id: "1",
    name: "Acme Corp",
    projects: [
      { id: "101", name: "Website Development", clientId: "1" },
      { id: "102", name: "Mobile App", clientId: "1" },
    ],
  },
  {
    id: "2",
    name: "TechGiant",
    projects: [
      { id: "201", name: "Backend API", clientId: "2" },
      { id: "202", name: "UI/UX Design", clientId: "2" },
    ],
  },
  {
    id: "3",
    name: "Innovate Inc",
    projects: [
      { id: "301", name: "Quality Assurance", clientId: "3" },
      { id: "302", name: "Documentation", clientId: "3" },
    ],
  },
];

// Function to get all projects flattened
export const getAllProjects = (): Project[] => {
  return clients.flatMap(client => client.projects);
};

// Function to get project by ID
export const getProjectById = (id: string): Project | undefined => {
  return getAllProjects().find(project => project.id === id);
};

// Function to get client by ID
export const getClientById = (id: string): Client | undefined => {
  return clients.find(client => client.id === id);
};
