
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define available languages
export type Language = 'fi' | 'sv' | 'en';

// Define the context type
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'fi',
  setLanguage: () => {},
  t: () => '',
});

// Translations for all supported languages
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    'dashboard': 'Dashboard',
    'weekly_view': 'Weekly View',
    'reports': 'Reports',
    'calendar': 'Calendar',
    'log_time': 'Log Time',
    'timetracker': 'TimeTracker',
    
    // TimeEntry
    'date': 'Date',
    'hours': 'Hours',
    'project': 'Project',
    'description': 'Description',
    'select_project': 'Select project...',
    'select_client': 'Select client',
    'what_did_you_work_on': 'What did you work on?',
    'save_time_entry': 'Save Time Entry',
    'fill_all_required_fields': 'Please fill all required fields',
    'time_entry_saved': 'Time entry saved successfully!',
    'back_to_clients': 'Back to clients',
    
    // WeeklyView
    'weekly_overview': 'Weekly Overview',
    'total': 'Total',
    'remaining': 'remaining',
    'over': 'over',
    'weekly_total': 'Weekly Total',
    'weekly_target': 'Weekly Target',
    
    // Dashboard
    'today': 'Today',
    'this_week': 'This Week',
    'this_month': 'This Month',
    'weekly_average': 'Weekly Average',
    'target': 'Target',
    'recent_time_entries': 'Recent Time Entries',
    'view_all_entries': 'View All Entries',
    'hours_by_project': 'Hours by Project',
    
    // Footer
    'inspired_by': 'Inspired by Reportronic',
    
    // NotFound
    'not_found': '404',
    'page_not_found': 'Oops! Page not found',
    'return_to_home': 'Return to Home',
    
    // Reports
    'report_functionality': 'Report functionality coming soon.',
    
    // Clients & Projects
    'clients_and_projects': "Clients & Projects",
    
    // Settings
    'settings': 'Settings',
    'manage_clients': 'Manage Clients',
    'manage_projects': 'Manage Projects',
    'add_client': 'Add Client',
    'edit_client': 'Edit Client',
    'client_name': 'Client Name',
    'enter_client_name': 'Enter client name',
    'add_project': 'Add Project',
    'edit_project': 'Edit Project',
    'project_name': 'Project Name',
    'enter_project_name': 'Enter project name',
    'projects_count': 'Projects',
    'actions': 'Actions',
    'no_clients': 'No clients found',
    'no_projects': 'No projects found',
    'client': 'Client',
    'clients': 'Clients',
    'projects': 'Projects',
    'project_name_required': 'Project name is required (min 3 characters)',
    'client_name_required': 'Client name is required (min 3 characters)',
    'client_required': 'Client is required',
    'cancel': 'Cancel',
    'add': 'Add',
    'update': 'Update',
    'client_added': 'Client added successfully',
    'client_updated': 'Client updated successfully',
    'client_deleted': 'Client deleted successfully',
    'project_added': 'Project added successfully',
    'project_updated': 'Project updated successfully',
    'project_deleted': 'Project deleted successfully',
    'client_not_found': 'Client not found',
    'cannot_delete_client_with_projects': 'Cannot delete client with projects',
    'unknown_client': 'Unknown Client',
    'unknown_project': 'Unknown Project',
    
    // Reports
    'reports': 'Reports',
    'filter_reports': 'Filter Reports',
    'date_range': 'Date Range',
    'select_date_range': 'Select date range',
    'quick_filters': 'Quick Filters',
    'last_month': 'Last Month',
    'all_time': 'All Time',
    'summary': 'Summary',
    'export_to_csv': 'Export to CSV',
    'total_entries': 'Total Entries',
    'total_hours': 'Total Hours',
    'avg_hours_per_day': 'Avg Hours/Day',
    'no_time_entries_found': 'No time entries found',
    'client': 'Client'
  },
  fi: {
    // Header
    'dashboard': 'Kojelauta',
    'weekly_view': 'Viikkonäkymä',
    'reports': 'Raportit',
    'calendar': 'Kalenteri',
    'log_time': 'Kirjaa aikaa',
    'timetracker': 'Ajanseuranta',
    
    // TimeEntry
    'date': 'Päivämäärä',
    'hours': 'Tunnit',
    'project': 'Projekti',
    'description': 'Kuvaus',
    'select_project': 'Valitse projekti...',
    'select_client': 'Valitse asiakas',
    'what_did_you_work_on': 'Mitä teit?',
    'save_time_entry': 'Tallenna kirjaus',
    'fill_all_required_fields': 'Täytä kaikki pakolliset kentät',
    'time_entry_saved': 'Aikakirjaus tallennettu onnistuneesti!',
    'back_to_clients': 'Takaisin asiakkaisiin',
    
    // WeeklyView
    'weekly_overview': 'Viikon yhteenveto',
    'total': 'Yhteensä',
    'remaining': 'jäljellä',
    'over': 'yli',
    'weekly_total': 'Viikon yhteensä',
    'weekly_target': 'Viikon tavoite',
    
    // Dashboard
    'today': 'Tänään',
    'this_week': 'Tämä viikko',
    'this_month': 'Tämä kuukausi',
    'weekly_average': 'Viikon keskiarvo',
    'target': 'Tavoite',
    'recent_time_entries': 'Viimeisimmät aikakirjaukset',
    'view_all_entries': 'Näytä kaikki kirjaukset',
    'hours_by_project': 'Tunnit projekteittain',
    
    // Footer
    'inspired_by': 'Reportronicin innoittamana',
    
    // NotFound
    'not_found': 'Sivua ei löytynyt',
    'page_not_found': 'Hups! Sivua ei löytynyt',
    'return_to_home': 'Palaa etusivulle',
    
    // Reports
    'report_functionality': 'Raportointitoiminnallisuus tulossa pian.',
    
    // Clients & Projects
    'clients_and_projects': "Asiakkaat & Projektit",
    
    // Settings
    'settings': 'Asetukset',
    'manage_clients': 'Hallinnoi asiakkaita',
    'manage_projects': 'Hallinnoi projekteja',
    'add_client': 'Lisää asiakas',
    'edit_client': 'Muokkaa asiakasta',
    'client_name': 'Asiakkaan nimi',
    'enter_client_name': 'Syötä asiakkaan nimi',
    'add_project': 'Lisää projekti',
    'edit_project': 'Muokkaa projektia',
    'project_name': 'Projektin nimi',
    'enter_project_name': 'Syötä projektin nimi',
    'projects_count': 'Projekteja',
    'actions': 'Toiminnot',
    'no_clients': 'Asiakkaita ei löytynyt',
    'no_projects': 'Projekteja ei löytynyt',
    'client': 'Asiakas',
    'clients': 'Asiakkaat',
    'projects': 'Projektit',
    'project_name_required': 'Projektin nimi vaaditaan (väh. 3 merkkiä)',
    'client_name_required': 'Asiakkaan nimi vaaditaan (väh. 3 merkkiä)',
    'client_required': 'Asiakas vaaditaan',
    'cancel': 'Peruuta',
    'add': 'Lisää',
    'update': 'Päivitä',
    'client_added': 'Asiakas lisätty onnistuneesti',
    'client_updated': 'Asiakas päivitetty onnistuneesti',
    'client_deleted': 'Asiakas poistettu onnistuneesti',
    'project_added': 'Projekti lisätty onnistuneesti',
    'project_updated': 'Projekti päivitetty onnistuneesti',
    'project_deleted': 'Projekti poistettu onnistuneesti',
    'client_not_found': 'Asiakasta ei löytynyt',
    'cannot_delete_client_with_projects': 'Asiakasta, jolla on projekteja, ei voi poistaa',
    'unknown_client': 'Tuntematon asiakas',
    'unknown_project': 'Tuntematon projekti',
    
    // Reports
    'reports': 'Raportit',
    'filter_reports': 'Suodata raportteja',
    'date_range': 'Aikaväli',
    'select_date_range': 'Valitse aikaväli',
    'quick_filters': 'Pikavalinnat',
    'last_month': 'Viime kuukausi',
    'all_time': 'Kaikki ajat',
    'summary': 'Yhteenveto',
    'export_to_csv': 'Vie CSV-muotoon',
    'total_entries': 'Kirjauksia yhteensä',
    'total_hours': 'Tunteja yhteensä',
    'avg_hours_per_day': 'Keskim. tunnit/päivä',
    'no_time_entries_found': 'Aikakirjauksia ei löytynyt'
  },
  sv: {
    // Header
    'dashboard': 'Instrumentpanel',
    'weekly_view': 'Veckovy',
    'reports': 'Rapporter',
    'calendar': 'Kalender',
    'log_time': 'Logga tid',
    'timetracker': 'Tidsspårning',
    
    // TimeEntry
    'date': 'Datum',
    'hours': 'Timmar',
    'project': 'Projekt',
    'description': 'Beskrivning',
    'select_project': 'Välj projekt...',
    'select_client': 'Välj kund',
    'what_did_you_work_on': 'Vad jobbade du med?',
    'save_time_entry': 'Spara tidsinlägg',
    'fill_all_required_fields': 'Fyll i alla obligatoriska fält',
    'time_entry_saved': 'Tidsinlägg sparades framgångsrikt!',
    'back_to_clients': 'Tillbaka till kunder',
    
    // WeeklyView
    'weekly_overview': 'Veckoöversikt',
    'total': 'Totalt',
    'remaining': 'återstår',
    'over': 'över',
    'weekly_total': 'Veckans totalt',
    'weekly_target': 'Veckans mål',
    
    // Dashboard
    'today': 'Idag',
    'this_week': 'Denna vecka',
    'this_month': 'Denna månad',
    'weekly_average': 'Veckomedelvärde',
    'target': 'Mål',
    'recent_time_entries': 'Senaste tidsinlägg',
    'view_all_entries': 'Visa alla inlägg',
    'hours_by_project': 'Timmar per projekt',
    
    // Footer
    'inspired_by': 'Inspirerad av Reportronic',
    
    // NotFound
    'not_found': '404',
    'page_not_found': 'Hoppsan! Sidan hittades inte',
    'return_to_home': 'Återgå till startsidan',
    
    // Reports
    'report_functionality': 'Rapportfunktionen kommer snart.',
    
    // Clients & Projects
    'clients_and_projects': "Kunder & Projekt",
    
    // Settings
    'settings': 'Inställningar',
    'manage_clients': 'Hantera kunder',
    'manage_projects': 'Hantera projekt',
    'add_client': 'Lägg till kund',
    'edit_client': 'Redigera kund',
    'client_name': 'Kundnamn',
    'enter_client_name': 'Ange kundnamn',
    'add_project': 'Lägg till projekt',
    'edit_project': 'Redigera projekt',
    'project_name': 'Projektnamn',
    'enter_project_name': 'Ange projektnamn',
    'projects_count': 'Projekt',
    'actions': 'Åtgärder',
    'no_clients': 'Inga kunder hittades',
    'no_projects': 'Inga projekt hittades',
    'client': 'Kund',
    'clients': 'Kunder',
    'projects': 'Projekt',
    'project_name_required': 'Projektnamn krävs (minst 3 tecken)',
    'client_name_required': 'Kundnamn krävs (minst 3 tecken)',
    'client_required': 'Kund krävs',
    'cancel': 'Avbryt',
    'add': 'Lägg till',
    'update': 'Uppdatera',
    'client_added': 'Kund har lagts till',
    'client_updated': 'Kund har uppdaterats',
    'client_deleted': 'Kund har tagits bort',
    'project_added': 'Projekt har lagts till',
    'project_updated': 'Projekt har uppdaterats',
    'project_deleted': 'Projekt har tagits bort',
    'client_not_found': 'Kund hittades inte',
    'cannot_delete_client_with_projects': 'Kan inte ta bort kund med projekt',
    'unknown_client': 'Okänd kund',
    'unknown_project': 'Okänt projekt',
    
    // Reports
    'reports': 'Rapporter',
    'filter_reports': 'Filtrera rapporter',
    'date_range': 'Datumintervall',
    'select_date_range': 'Välj datumintervall',
    'quick_filters': 'Snabbfilter',
    'last_month': 'Förra månaden',
    'all_time': 'All tid',
    'summary': 'Sammanfattning',
    'export_to_csv': 'Exportera till CSV',
    'total_entries': 'Totala inlägg',
    'total_hours': 'Totala timmar',
    'avg_hours_per_day': 'Genomsn. timmar/dag',
    'no_time_entries_found': 'Inga tidsinlägg hittades'
  }
};

// Create a provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fi'); // Default to Finnish

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext);
