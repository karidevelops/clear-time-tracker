
import React, { createContext, useContext, useState, useEffect } from 'react';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export type AvailableLanguages = 'en' | 'fi' | 'sv';

interface Translation {
  [key: string]: {
    [lang in AvailableLanguages]: string;
  };
}

export type TranslationsType = {
  [key: string]: {
    en: string;
    fi: string;
    sv: string;
  };
};

interface LanguageContextProps {
  language: AvailableLanguages;
  setLanguage: (lang: AvailableLanguages) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<AvailableLanguages>(((localStorage.getItem('i18nextLng') || 'en').substring(0, 2)) as AvailableLanguages);

  useEffect(() => {
    i18next
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources: {
          en: { translation: translations.en },
          fi: { translation: translations.fi },
          sv: { translation: translations.sv },
        },
        lng: language,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        detection: {
          order: ['localStorage', 'navigator'],
          lookupLocalStorage: 'i18nextLng',
          caches: ['localStorage'],
        },
      });
  }, [language]);

  useEffect(() => {
    i18next.changeLanguage(language);
  }, [language]);

  const t = (key: string) => {
    return i18next.t(key);
  };

  const handleSetLanguage = (lang: AvailableLanguages) => {
    setLanguage(lang);
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const translations: TranslationsType = {
  en: {
    en: 'English',
    fi: 'Englanti',
    sv: 'Engelska',
  },
  fi: {
    en: 'Finnish',
    fi: 'Suomi',
    sv: 'Finska',
  },
  sv: {
    en: 'Swedish',
    fi: 'Ruotsi',
    sv: 'Svenska',
  },
  dashboard: {
    en: 'Dashboard',
    fi: 'Työnäkymä',
    sv: 'Dashboard',
  },
  weekly: {
    en: 'Weekly',
    fi: 'Viikoittain',
    sv: 'Veckovis',
  },
  reports: {
    en: 'Reports',
    fi: 'Raportit',
    sv: 'Rapporter',
  },
  settings: {
    en: 'Settings',
    fi: 'Asetukset',
    sv: 'Inställningar',
  },
  logout: {
    en: 'Logout',
    fi: 'Kirjaudu ulos',
    sv: 'Logga ut',
  },
  login: {
    en: 'Login',
    fi: 'Kirjaudu sisään',
    sv: 'Logga in',
  },
  register: {
    en: 'Register',
    fi: 'Rekisteröidy',
    sv: 'Registrera',
  },
  email: {
    en: 'Email',
    fi: 'Sähköposti',
    sv: 'E-post',
  },
  password: {
    en: 'Password',
    fi: 'Salasana',
    sv: 'Lösenord',
  },
  confirm_password: {
    en: 'Confirm Password',
    fi: 'Vahvista salasana',
    sv: 'Bekräfta lösenord',
  },
  name: {
    en: 'Name',
    fi: 'Nimi',
    sv: 'Namn',
  },
  required_field: {
    en: 'This field is required',
    fi: 'Tämä kenttä on pakollinen',
    sv: 'Detta fält är obligatoriskt',
  },
  password_length: {
    en: 'Password must be at least 6 characters',
    fi: 'Salasanan on oltava vähintään 6 merkkiä pitkä',
    sv: 'Lösenordet måste vara minst 6 tecken långt',
  },
  passwords_dont_match: {
    en: 'Passwords do not match',
    fi: 'Salasanat eivät täsmää',
    sv: 'Lösenorden matchar inte',
  },
  invalid_email: {
    en: 'Invalid email',
    fi: 'Virheellinen sähköposti',
    sv: 'Ogiltig e-post',
  },
  error: {
    en: 'Error',
    fi: 'Virhe',
    sv: 'Fel',
  },
  success: {
    en: 'Success',
    fi: 'Onnistui',
    sv: 'Lyckades',
  },
  something_went_wrong: {
    en: 'Something went wrong',
    fi: 'Jokin meni pieleen',
    sv: 'Något gick fel',
  },
  time_tracker: {
    en: 'Time Tracker',
    fi: 'Ajastin',
    sv: 'Tidtagare',
  },
  date: {
    en: 'Date',
    fi: 'Päivämäärä',
    sv: 'Datum',
  },
  project: {
    en: 'Project',
    fi: 'Projekti',
    sv: 'Projekt',
  },
  description: {
    en: 'Description',
    fi: 'Kuvaus',
    sv: 'Beskrivning',
  },
  hours: {
    en: 'Hours',
    fi: 'Tunnit',
    sv: 'Timmar',
  },
  add_entry: {
    en: 'Add Entry',
    fi: 'Lisää merkintä',
    sv: 'Lägg till post',
  },
  edit_entry: {
    en: 'Edit Entry',
    fi: 'Muokkaa merkintää',
    sv: 'Redigera post',
  },
  update_entry: {
    en: 'Update Entry',
    fi: 'Päivitä merkintä',
    sv: 'Uppdatera post',
  },
  delete_entry: {
    en: 'Delete Entry',
    fi: 'Poista merkintä',
    sv: 'Ta bort post',
  },
  cancel: {
    en: 'Cancel',
    fi: 'Peruuta',
    sv: 'Avbryt',
  },
  save: {
    en: 'Save',
    fi: 'Tallenna',
    sv: 'Spara',
  },
  client: {
    en: 'Client',
    fi: 'Asiakas',
    sv: 'Klient',
  },
  no_projects_found: {
    en: 'No projects found',
    fi: 'Projekteja ei löytynyt',
    sv: 'Inga projekt hittades',
  },
  no_clients_found: {
    en: 'No clients found',
    fi: 'Asiakkaita ei löytynyt',
    sv: 'Inga klienter hittades',
  },
  loading_projects: {
    en: 'Loading projects...',
    fi: 'Ladataan projekteja...',
    sv: 'Laddar projekt...',
  },
  loading_clients: {
    en: 'Loading clients...',
    fi: 'Ladataan asiakkaita...',
    sv: 'Laddar klienter...',
  },
  time_entries: {
    en: 'Time Entries',
    fi: 'Aikamerkinnät',
    sv: 'Tidsregistreringar',
  },
  no_time_entries_found: {
    en: 'No time entries found',
    fi: 'Aikamerkintöjä ei löytynyt',
    sv: 'Inga tidsregistreringar hittades',
  },
  loading_time_entries: {
    en: 'Loading time entries...',
    fi: 'Ladataan aikamerkintöjä...',
    sv: 'Laddar tidsregistreringar...',
  },
  total_entries: {
    en: 'Total Entries',
    fi: 'Merkintöjä yhteensä',
    sv: 'Totalt antal poster',
  },
  total_hours: {
    en: 'Total Hours',
    fi: 'Tunteja yhteensä',
    sv: 'Totalt antal timmar',
  },
   avg_hours_per_day: {
    en: 'Avg. Hours per Day',
    fi: 'Keskim. tunteja per päivä',
    sv: 'Genomsnittligt antal timmar per dag',
  },
  generate_report: {
    en: 'Generate Report',
    fi: 'Luo raportti',
    sv: 'Generera rapport',
  },
  filter_reports: {
    en: 'Filter Reports',
    fi: 'Suodata raportteja',
    sv: 'Filtrera rapporter',
  },
  export_to_csv: {
    en: 'Export to CSV',
    fi: 'Vie CSV-muotoon',
    sv: 'Exportera till CSV',
  },
  export_to_excel: {
    en: 'Export to Excel',
    fi: 'Vie Exceliin',
    sv: 'Exportera till Excel',
  },
  export_to_pdf: {
    en: 'Export to PDF',
    fi: 'Vie PDF-muotoon',
    sv: 'Exportera till PDF',
  },
  this_week: {
    en: 'This Week',
    fi: 'Tämä viikko',
    sv: 'Denna vecka',
  },
  this_month: {
    en: 'This Month',
    fi: 'Tämä kuukausi',
    sv: 'Denna månad',
  },
  last_month: {
    en: 'Last Month',
    fi: 'Viime kuukausi',
    sv: 'Förra månaden',
  },
  all_time: {
    en: 'All Time',
    fi: 'Kaikki',
    sv: 'All tid',
  },
  quick_filters: {
    en: 'Quick Filters',
    fi: 'Pikasuodattimet',
    sv: 'Snabbfilter',
  },
  select_date_range: {
    en: 'Select Date Range',
    fi: 'Valitse päivämääräväli',
    sv: 'Välj datumintervall',
  },
  calendar: {
    en: 'Calendar',
    fi: 'Kalenteri',
    sv: 'Kalender',
  },
  entry_saved: {
    en: 'Entry saved!',
    fi: 'Merkintä tallennettu!',
    sv: 'Posten sparad!',
  },
  entry_updated: {
    en: 'Entry updated!',
    fi: 'Merkintä päivitetty!',
    sv: 'Posten uppdaterad!',
  },
  entry_deleted: {
    en: 'Entry deleted!',
    fi: 'Merkintä poistettu!',
    sv: 'Posten raderad!',
  },
  error_saving_entry: {
    en: 'Error saving entry',
    fi: 'Virhe tallentaessa merkintää',
    sv: 'Fel vid sparande av post',
  },
  error_updating_entry: {
    en: 'Error updating entry',
    fi: 'Virhe päivitettäessä merkintää',
    sv: 'Fel vid uppdatering av post',
  },
  error_deleting_entry: {
    en: 'Error deleting entry',
    fi: 'Virhe poistaessa merkintää',
    sv: 'Fel vid radering av post',
  },
  confirm_delete: {
    en: 'Are you sure you want to delete this entry?',
    fi: 'Haluatko varmasti poistaa tämän merkinnän?',
    sv: 'Är du säker på att du vill ta bort den här posten?',
  },
  delete: {
    en: 'Delete',
    fi: 'Poista',
    sv: 'Ta bort',
  },
  close: {
    en: 'Close',
    fi: 'Sulje',
    sv: 'Stäng',
  },
  no_description: {
    en: 'No description',
    fi: 'Ei kuvausta',
    sv: 'Ingen beskrivning',
  },
  edit: {
    en: 'Edit',
    fi: 'Muokkaa',
    sv: 'Redigera',
  },
  new_project: {
    en: 'New Project',
    fi: 'Uusi projekti',
    sv: 'Nytt projekt',
  },
  project_name: {
    en: 'Project Name',
    fi: 'Projektin nimi',
    sv: 'Projektnamn',
  },
  select_client: {
    en: 'Select Client',
    fi: 'Valitse asiakas',
    sv: 'Välj klient',
  },
  create_project: {
    en: 'Create Project',
    fi: 'Luo projekti',
    sv: 'Skapa projekt',
  },
  new_client: {
    en: 'New Client',
    fi: 'Uusi asiakas',
    sv: 'Ny klient',
  },
  client_name: {
    en: 'Client Name',
    fi: 'Asiakkaan nimi',
    sv: 'Klientnamn',
  },
  create_client: {
    en: 'Create Client',
    fi: 'Luo asiakas',
    sv: 'Skapa klient',
  },
  unnamed_project: {
    en: 'Unnamed Project',
    fi: 'Nimetön projekti',
    sv: 'Namnlöst projekt',
  },
  unnamed_client: {
    en: 'Unnamed Client',
    fi: 'Nimetön asiakas',
    sv: 'Namnlös klient',
  },
  confirm: {
    en: 'Confirm',
    fi: 'Vahvista',
    sv: 'Bekräfta',
  },
  admin: {
    en: 'Admin',
    fi: 'Ylläpitäjä',
    sv: 'Admin',
  },
  users: {
    en: 'Users',
    fi: 'Käyttäjät',
    sv: 'Användare',
  },
  manage_users: {
    en: 'Manage Users',
    fi: 'Hallitse käyttäjiä',
    sv: 'Hantera användare',
  },
  full_name: {
    en: 'Full Name',
    fi: 'Koko nimi',
    sv: 'Fullständigt namn',
  },
  role: {
    en: 'Role',
    fi: 'Rooli',
    sv: 'Roll',
  },
  change_password: {
    en: 'Change Password',
    fi: 'Vaihda salasana',
    sv: 'Ändra lösenord',
  },
  save_changes: {
    en: 'Save Changes',
    fi: 'Tallenna muutokset',
    sv: 'Spara ändringar',
  },
  user_updated: {
    en: 'User updated!',
    fi: 'Käyttäjä päivitetty!',
    sv: 'Användaren uppdaterad!',
  },
  error_updating_user: {
    en: 'Error updating user',
    fi: 'Virhe käyttäjän päivityksessä',
    sv: 'Fel vid uppdatering av användare',
  },
  are_you_sure: {
    en: 'Are you sure?',
    fi: 'Oletko varma?',
    sv: 'Är du säker?',
  },
  make_admin_confirmation: {
    en: 'Are you sure you want to make this user an admin?',
    fi: 'Haluatko varmasti tehdä tästä käyttäjästä ylläpitäjän?',
    sv: 'Är du säker på att du vill göra den här användaren till admin?',
  },
  remove_admin_confirmation: {
    en: 'Are you sure you want to remove admin rights from this user?',
    fi: 'Haluatko varmasti poistaa ylläpito-oikeudet tältä käyttäjältä?',
    sv: 'Är du säker på att du vill ta bort adminrättigheterna från den här användaren?',
  },
  make_admin: {
    en: 'Make Admin',
    fi: 'Tee ylläpitäjäksi',
    sv: 'Gör till admin',
  },
  remove_admin: {
    en: 'Remove Admin',
    fi: 'Poista ylläpito-oikeudet',
    sv: 'Ta bort admin',
  },
  unnamed_user: {
    en: 'Unnamed User',
    fi: 'Nimetön käyttäjä',
    sv: 'Namnlös användare',
  },
  pending_entries: {
    en: 'Pending Entries',
    fi: 'Odottaa hyväksyntää',
    sv: 'Väntande poster',
  },
  approve_all_entries: {
    en: 'Approve All Entries',
    fi: 'Hyväksy kaikki merkinnät',
    sv: 'Godkänn alla poster',
  },
  filter_pending_entries: {
    en: 'Filter Pending Entries',
    fi: 'Suodata odottavat merkinnät',
    sv: 'Filtrera väntande poster',
  },
  user: {
    en: 'User',
    fi: 'Käyttäjä',
    sv: 'Användare',
  },
  all_users: {
    en: 'All Users',
    fi: 'Kaikki käyttäjät',
    sv: 'Alla användare',
  },
  entries: {
    en: 'entries',
    fi: 'merkinnät',
    sv: 'poster',
  },
  approve_all_user_entries: {
    en: 'Approve All User Entries',
    fi: 'Hyväksy kaikki käyttäjän merkinnät',
    sv: 'Godkänn alla användares poster',
  },
  no_pending_entries: {
    en: 'No pending entries',
    fi: 'Ei odottavia merkintöjä',
    sv: 'Inga väntande poster',
  },
  approve_time_entry: {
    en: 'Approve Time Entry',
    fi: 'Hyväksy aikamerkintä',
    sv: 'Godkänn tidsregistrering',
  },
  approve_time_entry_confirmation: {
    en: 'Are you sure you want to approve this time entry?',
    fi: 'Haluatko varmasti hyväksyä tämän aikamerkinnän?',
    sv: 'Är du säker på att du vill godkänna den här tidsregistreringen?',
  },
  approve: {
    en: 'Approve',
    fi: 'Hyväksy',
    sv: 'Godkänn',
  },
  entry_approved: {
    en: 'Entry approved!',
    fi: 'Merkintä hyväksytty!',
    sv: 'Posten godkänd!',
  },
  entries_approved: {
    en: 'Entries approved!',
    fi: 'Merkinnät hyväksytty!',
    sv: 'Poster godkända!',
  },
  all_entries_approved: {
    en: 'All entries approved!',
    fi: 'Kaikki merkinnät hyväksytty!',
    sv: 'Alla poster godkända!',
  },
  error_approving_entry: {
    en: 'Error approving entry',
    fi: 'Virhe merkinnän hyväksynnässä',
    sv: 'Fel vid godkännande av post',
  },
  error_approving_entries: {
    en: 'Error approving entries',
    fi: 'Virhe merkintöjen hyväksynnässä',
    sv: 'Fel vid godkännande av poster',
  },
  error_approving_all_entries: {
    en: 'Error approving all entries',
    fi: 'Virhe kaikkien merkintöjen hyväksynnässä',
    sv: 'Fel vid godkännande av alla poster',
  },
  error_fetching_time_entries: {
    en: "Error fetching time entries",
    fi: "Virhe hakiessa aikamerkintöjä",
    sv: "Fel vid hämtning av tidsregistreringar"
  },
  inspired_by: {
    en: "Inspired by Lovable",
    fi: "Lovable inspiroima",
    sv: "Inspirerad av Lovable"
  },
  all_projects: {
    en: "All Projects",
    fi: "Kaikki projektit",
    sv: "Alla projekt"
  },
  error_fetching_clients: {
    en: "Error fetching clients",
    fi: "Virhe haettaessa asiakkaita",
    sv: "Fel vid hämtning av klienter"
  },
  error_fetching_projects: {
    en: "Error fetching projects",
    fi: "Virhe haettaessa projekteja",
    sv: "Fel vid hämtning av projekt"
  },
  error_fetching_project_details: {
    en: "Error fetching project details",
    fi: "Virhe haettaessa projektin tietoja",
    sv: "Fel vid hämtning av projektinformation"
  },
};
