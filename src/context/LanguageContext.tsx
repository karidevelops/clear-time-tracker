import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

// Create the context with a default value
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

// Define the translations
const translations: Record<string, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    weekly_view: 'Weekly View',
    reports: 'Reports',
    settings: 'Settings',
    log_time: 'Log Time',
    date: 'Date',
    hours: 'Hours',
    project: 'Project',
    description: 'Description',
    what_did_you_work_on: 'What did you work on?',
    save_time_entry: 'Save Time Entry',
    fill_all_required_fields: 'Please fill all required fields',
    time_entry_saved: 'Time entry saved successfully',
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    weekly_average: 'Weekly Average',
    target: 'Target',
    recent_time_entries: 'Recent Time Entries',
    view_all_entries: 'View All Entries',
    hours_by_project: 'Hours by Project',
    weekly_overview: 'Weekly Overview',
    total: 'Total',
    remaining: 'Remaining',
    over: 'Over',
    weekly_total: 'Weekly Total',
    weekly_target: 'Weekly Target',
    clients: 'Clients',
    projects: 'Projects',
    select_client: 'Select Client',
    select_project: 'Select Project',
    all_clients: 'All Clients',
    no_projects_available: 'No projects available',
    add_client: 'Add Client',
    add_project: 'Add Project',
    edit_client: 'Edit Client',
    edit_project: 'Edit Project',
    delete_client: 'Delete Client',
    delete_project: 'Delete Project',
    client_name: 'Client Name',
    contact_person: 'Contact Person',
    email: 'Email',
    phone: 'Phone',
    actions: 'Actions',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    confirm_delete: 'Are you sure you want to delete this?',
    yes_delete: 'Yes, Delete',
    project_name: 'Project Name',
    client: 'Client',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    completed: 'Completed',
    hourly_rate: 'Hourly Rate',
    start_date: 'Start Date',
    end_date: 'End Date',
    generate_report: 'Generate Report',
    time_period: 'Time Period',
    custom_range: 'Custom Range',
    from_date: 'From Date',
    to_date: 'To Date',
    export_pdf: 'Export PDF',
    export_excel: 'Export Excel',
    total_hours: 'Total Hours',
    billable_hours: 'Billable Hours',
    non_billable_hours: 'Non-Billable Hours',
    billable_amount: 'Billable Amount',
    daily_breakdown: 'Daily Breakdown',
    project_breakdown: 'Project Breakdown',
    no_data_available: 'No data available for the selected period',
    clients_and_projects: 'Clients & Projects',
    calendar: 'Calendar'
  },
  fi: {
    dashboard: 'Kojelauta',
    weekly_view: 'Viikkonäkymä',
    reports: 'Raportit',
    settings: 'Asetukset',
    log_time: 'Kirjaa aikaa',
    date: 'Päivämäärä',
    hours: 'Tunnit',
    project: 'Projekti',
    description: 'Kuvaus',
    what_did_you_work_on: 'Mitä teit?',
    save_time_entry: 'Tallenna kirjaus',
    fill_all_required_fields: 'Täytä kaikki pakolliset kentät',
    time_entry_saved: 'Aikakirjaus tallennettu onnistuneesti',
    today: 'Tänään',
    this_week: 'Tämä viikko',
    this_month: 'Tämä kuukausi',
    weekly_average: 'Viikkokeskiarvo',
    target: 'Tavoite',
    recent_time_entries: 'Viimeaikaiset kirjaukset',
    view_all_entries: 'Näytä kaikki kirjaukset',
    hours_by_project: 'Tunnit projekteittain',
    weekly_overview: 'Viikkonäkymä',
    total: 'Yhteensä',
    remaining: 'Jäljellä',
    over: 'Yli',
    weekly_total: 'Viikon tunnit',
    weekly_target: 'Viikon tavoite',
    clients: 'Asiakkaat',
    projects: 'Projektit',
    select_client: 'Valitse asiakas',
    select_project: 'Valitse projekti',
    all_clients: 'Kaikki asiakkaat',
    no_projects_available: 'Ei projekteja saatavilla',
    add_client: 'Lisää asiakas',
    add_project: 'Lisää projekti',
    edit_client: 'Muokkaa asiakasta',
    edit_project: 'Muokkaa projektia',
    delete_client: 'Poista asiakas',
    delete_project: 'Poista projekti',
    client_name: 'Asiakkaan nimi',
    contact_person: 'Yhteyshenkilö',
    email: 'Sähköposti',
    phone: 'Puhelin',
    actions: 'Toiminnot',
    cancel: 'Peruuta',
    save: 'Tallenna',
    delete: 'Poista',
    confirm_delete: 'Haluatko varmasti poistaa tämän?',
    yes_delete: 'Kyllä, poista',
    project_name: 'Projektin nimi',
    client: 'Asiakas',
    status: 'Tila',
    active: 'Aktiivinen',
    inactive: 'Ei-aktiivinen',
    completed: 'Valmis',
    hourly_rate: 'Tuntihinta',
    start_date: 'Aloituspäivä',
    end_date: 'Lopetuspäivä',
    generate_report: 'Luo raportti',
    time_period: 'Aikaväli',
    custom_range: 'Mukautettu aikaväli',
    from_date: 'Alkupäivä',
    to_date: 'Loppupäivä',
    export_pdf: 'Vie PDF',
    export_excel: 'Vie Excel',
    total_hours: 'Tunnit yhteensä',
    billable_hours: 'Laskutettavat tunnit',
    non_billable_hours: 'Ei-laskutettavat tunnit',
    billable_amount: 'Laskutettava määrä',
    daily_breakdown: 'Päivittäinen erittely',
    project_breakdown: 'Projektierittely',
    no_data_available: 'Ei dataa valitulle ajanjaksolle',
    clients_and_projects: 'Asiakkaat & Projektit',
    calendar: 'Kalenteri'
  },
  sv: {
    dashboard: 'Instrumentbräda',
    weekly_view: 'Veckovy',
    reports: 'Rapporter',
    settings: 'Inställningar',
    log_time: 'Logga tid',
    date: 'Datum',
    hours: 'Timmar',
    project: 'Projekt',
    description: 'Beskrivning',
    what_did_you_work_on: 'Vad jobbade du med?',
    save_time_entry: 'Spara tidsinmatning',
    fill_all_required_fields: 'Fyll i alla obligatoriska fält',
    time_entry_saved: 'Tidsinmatning sparad',
    today: 'Idag',
    this_week: 'Denna vecka',
    this_month: 'Denna månad',
    weekly_average: 'Veckogenomsnitt',
    target: 'Mål',
    recent_time_entries: 'Senaste tidsinmatningar',
    view_all_entries: 'Visa alla inmatningar',
    hours_by_project: 'Timmar per projekt',
    weekly_overview: 'Veckoöversikt',
    total: 'Totalt',
    remaining: 'Återstående',
    over: 'Över',
    weekly_total: 'Veckans totalt',
    weekly_target: 'Veckans mål',
    clients: 'Kunder',
    projects: 'Projekt',
    select_client: 'Välj kund',
    select_project: 'Välj projekt',
    all_clients: 'Alla kunder',
    no_projects_available: 'Inga projekt tillgängliga',
    add_client: 'Lägg till kund',
    add_project: 'Lägg till projekt',
    edit_client: 'Redigera kund',
    edit_project: 'Redigera projekt',
    delete_client: 'Ta bort kund',
    delete_project: 'Ta bort projekt',
    client_name: 'Kundnamn',
    contact_person: 'Kontaktperson',
    email: 'E-post',
    phone: 'Telefon',
    actions: 'Åtgärder',
    cancel: 'Avbryt',
    save: 'Spara',
    delete: 'Ta bort',
    confirm_delete: 'Är du säker på att du vill ta bort detta?',
    yes_delete: 'Ja, ta bort',
    project_name: 'Projektnamn',
    client: 'Kund',
    status: 'Status',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    completed: 'Slutförd',
    hourly_rate: 'Timpris',
    start_date: 'Startdatum',
    end_date: 'Slutdatum',
    generate_report: 'Generera rapport',
    time_period: 'Tidsperiod',
    custom_range: 'Anpassat intervall',
    from_date: 'Från datum',
    to_date: 'Till datum',
    export_pdf: 'Exportera PDF',
    export_excel: 'Exportera Excel',
    total_hours: 'Totala timmar',
    billable_hours: 'Fakturerbara timmar',
    non_billable_hours: 'Icke-fakturerbara timmar',
    billable_amount: 'Fakturerbart belopp',
    daily_breakdown: 'Daglig fördelning',
    project_breakdown: 'Projektfördelning',
    no_data_available: 'Ingen data tillgänglig för den valda perioden',
    clients_and_projects: 'Kunder & Projekt',
    calendar: 'Kalender'
  },
};

// Create the provider
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Load the user's language preference from localStorage on component mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
      setLanguage(storedLanguage);
    } else {
      // Try to detect the browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang && translations[browserLang]) {
        setLanguage(browserLang);
      }
    }
  }, []);

  // Save the language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translate function
  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Fallback to English if the key doesn't exist in the current language
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    // Return the key itself if it doesn't exist in any language
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Create a custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);
