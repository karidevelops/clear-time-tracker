import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

interface Translations {
  login: string;
  register: string;
  email: string;
  password: string;
  logging_in: string;
  registering: string;
  login_successful: string;
  registration_successful: string;
  login_error: string;
  registration_error: string;
  enter_credentials: string;
  create_account: string;
  two_factor_authentication: string;
  enter_2fa_code: string;
  verification_code: string;
  demo_use_code: string;
  verify: string;
  verifying: string;
  "2fa_verified": string;
  invalid_2fa_code: string;
  "2fa_error": string;
  login_required: string;
  
  dashboard: string;
  weekly_view: string;
  reports: string;
  settings: string;
  log_time: string;
  date: string;
  hours: string;
  project: string;
  description: string;
  what_did_you_work_on: string;
  save_time_entry: string;
  fill_all_required_fields: string;
  time_entry_saved: string;
  today: string;
  this_week: string;
  this_month: string;
  weekly_average: string;
  target: string;
  recent_time_entries: string;
  view_all_entries: string;
  hours_by_project: string;
  weekly_overview: string;
  total: string;
  remaining: string;
  over: string;
  weekly_total: string;
  weekly_target: string;
  clients: string;
  projects: string;
  select_client: string;
  select_project: string;
  all_clients: string;
  no_projects_available: string;
  add_client: string;
  add_project: string;
  edit_client: string;
  edit_project: string;
  delete_client: string;
  delete_project: string;
  client_name: string;
  contact_person: string;
  phone: string;
  actions: string;
  cancel: string;
  save: string;
  delete: string;
  confirm_delete: string;
  yes_delete: string;
  project_name: string;
  client: string;
  status: string;
  active: string;
  inactive: string;
  completed: string;
  hourly_rate: string;
  start_date: string;
  end_date: string;
  generate_report: string;
  time_period: string;
  custom_range: string;
  from_date: string;
  to_date: string;
  export_pdf: string;
  export_excel: string;
  total_hours: string;
  billable_hours: string;
  non_billable_hours: string;
  billable_amount: string;
  daily_breakdown: string;
  project_breakdown: string;
  no_data_available: string;
  clients_and_projects: string;
  calendar: string;
  inspired_by: string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

const translations: Record<string, Translations> = {
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
    calendar: 'Calendar',
    inspired_by: 'Reportronic',
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    logging_in: "Logging in...",
    registering: "Registering...",
    login_successful: "Login successful",
    registration_successful: "Registration successful",
    login_error: "Login failed",
    registration_error: "Registration failed",
    enter_credentials: "Enter your credentials to login",
    create_account: "Create a new account",
    two_factor_authentication: "Two-Factor Authentication",
    enter_2fa_code: "Enter the verification code",
    verification_code: "Verification Code",
    demo_use_code: "For demo purposes, use code:",
    verify: "Verify",
    verifying: "Verifying...",
    "2fa_verified": "Code verified successfully",
    invalid_2fa_code: "Invalid verification code",
    "2fa_error": "Error verifying code",
    login_required: "You need to be logged in"
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
    calendar: 'Kalenteri',
    inspired_by: 'Reportronic',
    login: "Kirjaudu",
    register: "Rekisteröidy",
    email: "Sähköposti",
    password: "Salasana",
    logging_in: "Kirjaudutaan...",
    registering: "Rekisteröidään...",
    login_successful: "Kirjautuminen onnistui",
    registration_successful: "Rekisteröityminen onnistui",
    login_error: "Kirjautuminen epäonnistui",
    registration_error: "Rekisteröityminen epäonnistui",
    enter_credentials: "Syötä kirjautumistiedot",
    create_account: "Luo uusi käyttäjätili",
    two_factor_authentication: "Kaksivaiheinen tunnistautuminen",
    enter_2fa_code: "Syötä vahvistuskoodi",
    verification_code: "Vahvistuskoodi",
    demo_use_code: "Demotarkoitukseen käytä koodia:",
    verify: "Vahvista",
    verifying: "Vahvistetaan...",
    "2fa_verified": "Koodi vahvistettu onnistuneesti",
    invalid_2fa_code: "Virheellinen vahvistuskoodi",
    "2fa_error": "Virhe koodin vahvistamisessa",
    login_required: "Sinun täytyy olla kirjautunut sisään"
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
    project_breakdown: 'Projektierittely',
    no_data_available: 'Ingen data tillgänglig för den valda perioden',
    clients_and_projects: 'Kunder & Projekt',
    calendar: 'Kalender',
    inspired_by: 'Reportronic',
    login: "Logga in",
    register: "Registrera",
    email: "E-post",
    password: "Lösenord",
    logging_in: "Loggar in...",
    registering: "Registrerar...",
    login_successful: "Inloggning lyckades",
    registration_successful: "Registrering lyckades",
    login_error: "Inloggning misslyckades",
    registration_error: "Registrering misslyckades",
    enter_credentials: "Ange dina inloggningsuppgifter",
    create_account: "Skapa ett nytt konto",
    two_factor_authentication: "Tvåfaktorsautentisering",
    enter_2fa_code: "Ange verifieringskoden",
    verification_code: "Verifieringskod",
    demo_use_code: "För demonstrationsändamål, använd kod:",
    verify: "Verifiera",
    verifying: "Verifierar...",
    "2fa_verified": "Kod verifierad framgångsrikt",
    invalid_2fa_code: "Ogiltig verifieringskod",
    "2fa_error": "Fel vid verifiering av kod",
    login_required: "Du måste vara inloggad"
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
      setLanguage(storedLanguage);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang && translations[browserLang]) {
        setLanguage(browserLang);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
