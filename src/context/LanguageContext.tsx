
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
    'clients_and_projects': "Clients & Projects"
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
    'clients_and_projects': "Asiakkaat & Projektit"
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
    'clients_and_projects': "Kunder & Projekt"
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
