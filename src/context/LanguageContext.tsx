import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

interface TranslationsType {
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
  back_to_clients: string;
  saving: string;
  error_saving_time_entry: string;
  not_found: string;
  page_not_found: string;
  return_to_home: string;
  client_updated_successfully: string;
  edit: string;
  remove: string;
  no_projects: string;
  add: string;
  save_changes: string;
  project_id: string;
  manage_clients: string;
  enter_client_name: string;
  update: string;
  no_clients: string;
  projects_count: string;
  client_updated: string;
  client_added: string;
  client_deleted: string;
  cannot_delete_client_with_projects: string;
  error_adding_project: string;
  add_project_for: string;
  today_entries: string;
  edit_time_entry: string;
  no_entries_today: string;
  loading: string;
  entry_deleted: string;
  error_deleting_entry: string;
  unknown_client: string;
  submit_for_approval: string;
  update_time_entry: string;
  time_entry_updated: string;
  draft: string;
  pending_approval: string;
  approved: string;
  select_status: string;
  only_admins_can_approve: string;
  approve: string;
  approve_time_entry: string;
  approve_time_entry_confirmation: string;
  all_projects: string;
  error_fetching_clients: string;
  error_fetching_projects: string;
  error_fetching_project_details: string;
  database_policy_error: string;
  duplicate_entry_error: string;
  foreign_key_constraint_error: string;
  
  // Chat Assistant translations
  chat_welcome_message: string;
  chat_error_message: string;
  chat_help_message: string;
  chat_dont_understand: string;
  chat_placeholder: string;
  ai_assistant: string;
  no_entries_yesterday: string;
  entries_exist_today: string;
  copied_entries_success: string;
  error_copying_entries: string;
  today_entries_summary: string;
  yesterday_entries_summary: string;
  error_fetching_entries: string;

  // User management translations
  users: string;
  manage_users: string;
  users_list: string;
  add_user: string;
  add_user_description: string;
  full_name: string;
  role: string;
  select_role: string;
  user: string;
  admin: string;
  name: string;
  no_name: string;
  view_entries: string;
  manage_user_time_entries: string;
  no_entries_found: string;
  return_for_edit: string;
  error_fetching_users: string;
  error_adding_user: string;
  error_setting_role: string;
  user_added_successfully: string;
  unknown_project: string;
  rejection_comment_placeholder: string;
  return_time_entry: string;
  return_time_entry_confirmation: string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

const translations: Record<string, TranslationsType> = {
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
    login_required: "You need to be logged in",
    back_to_clients: "Back to clients",
    saving: "Saving...",
    error_saving_time_entry: "Error saving time entry",
    not_found: "404 Not Found",
    page_not_found: "The page you're looking for doesn't exist.",
    return_to_home: "Return to Home",
    client_updated_successfully: "Client updated successfully",
    edit: "Edit",
    remove: "Remove",
    no_projects: "No projects",
    add: "Add",
    save_changes: "Save Changes",
    project_id: "Project ID",
    manage_clients: "Manage Clients",
    enter_client_name: "Enter client name",
    update: "Update",
    no_clients: "No clients available",
    projects_count: "Projects Count",
    client_updated: "Client updated successfully",
    client_added: "Client added successfully",
    client_deleted: "Client deleted successfully",
    cannot_delete_client_with_projects: "Cannot delete client with projects",
    error_adding_project: "Error adding project",
    add_project_for: 'Add project for',
    today_entries: 'Today Entries',
    edit_time_entry: 'Edit Time Entry',
    no_entries_today: 'No entries for today',
    loading: 'Loading',
    entry_deleted: 'Entry deleted successfully',
    error_deleting_entry: 'Error deleting entry',
    unknown_client: 'Unknown Client',
    submit_for_approval: 'Submit for Approval',
    update_time_entry: 'Update Time Entry',
    time_entry_updated: 'Time entry updated',
    draft: 'Draft',
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    select_status: 'Select Status',
    only_admins_can_approve: 'Only admins can approve',
    approve: 'Approve',
    approve_time_entry: 'Approve Time Entry',
    approve_time_entry_confirmation: 'Are you sure you want to approve this time entry?',
    all_projects: 'All Projects',
    error_fetching_clients: 'Error fetching clients',
    error_fetching_projects: 'Error fetching projects',
    error_fetching_project_details: 'Error fetching project details',
    database_policy_error: 'Database policy error. Please try again or contact support.',
    duplicate_entry_error: 'A duplicate entry already exists.',
    foreign_key_constraint_error: 'Invalid project selection. Please choose another project.',
    
    // Chat Assistant translations - English
    chat_welcome_message: "Hi! I'm your assistant. How can I help you with time tracking today?",
    chat_error_message: "Sorry, an error occurred. Please try again later.",
    chat_help_message: "I can help you with time entries. For example:\n- \"Copy yesterday's hours to today\"\n- \"Show today's entries\"\n- \"Show yesterday's entries\"",
    chat_dont_understand: "I didn't fully understand your request. Could you clarify? For example, you can ask me to copy yesterday's entries or show today's entries.",
    chat_placeholder: "Type a message...",
    ai_assistant: "AI Assistant",
    no_entries_yesterday: "No entries found for yesterday.",
    entries_exist_today: "There are already entries for today. Do you still want to copy yesterday's entries?",
    copied_entries_success: "Copied entries from yesterday to today.",
    error_copying_entries: "Error copying entries. Please try again later.",
    today_entries_summary: "Today has entries, total hours:",
    yesterday_entries_summary: "Yesterday had entries, total hours:",
    error_fetching_entries: "Error fetching entries. Please try again later.",

    // User management translations - English
    users: 'Users',
    manage_users: 'Manage Users',
    users_list: 'Users List',
    add_user: 'Add User',
    add_user_description: 'Create a new user account',
    full_name: 'Full Name',
    role: 'Role',
    select_role: 'Select Role',
    user: 'User',
    admin: 'Admin',
    name: 'Name',
    no_name: 'No Name',
    view_entries: 'View Entries',
    manage_user_time_entries: 'Manage User Time Entries',
    no_entries_found: 'No entries found',
    return_for_edit: 'Return for Edit',
    error_fetching_users: 'Error fetching users',
    error_adding_user: 'Error adding user',
    error_setting_role: 'Error setting user role',
    user_added_successfully: 'User added successfully',
    unknown_project: 'Unknown Project',
    rejection_comment_placeholder: 'Enter a reason for the rejection...',
    return_time_entry: 'Return Time Entry',
    return_time_entry_confirmation: 'Are you sure you want to return this time entry for editing?',
  },
  fi: {
    dashboard: 'Tuntikirjaus',
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
    login_required: "Sinun täytyy olla kirjautunut sisään",
    back_to_clients: "Takaisin asiakkaisiin",
    saving: "Tallennetaan...",
    error_saving_time_entry: "Virhe tallennettaessa aikakirjausta",
    not_found: "404 Not Found",
    page_not_found: "The page you're looking for doesn't exist.",
    return_to_home: "Return to Home",
    client_updated_successfully: "Asiakas päivitetty onnistuneesti",
    edit: "Muokkaa",
    remove: "Poista",
    no_projects: "Ei projekteja",
    add: "Lisää",
    save_changes: "Tallenna muutokset",
    project_id: "Projektin tunnus",
    manage_clients: "Hallinnoi asiakkaita",
    enter_client_name: "Syötä asiakkaan nimi",
    update: "Päivitä",
    no_clients: "Ei asiakkaita saatavilla",
    projects_count: "Projektien määrä",
    client_updated: "Asiakas päivitetty onnistuneesti",
    client_added: "Asiakas lisätty onnistuneesti",
    client_deleted: "Asiakas poistettu onnistuneesti",
    cannot_delete_client_with_projects: "Asiakasta, jolla on projekteja, ei voi poistaa",
    error_adding_project: "Virhe lisättäessä projektia",
    add_project_for: 'Lisää projekti asiakkaalle',
    today_entries: 'Tämän päivän kirjaukset',
    edit_time_entry: 'Muokkaa aikakirjausta',
    no_entries_today: 'Ei kirjauksia tänään',
    loading: 'Ladataan',
    entry_deleted: 'Kirjaus poistettu onnistuneesti',
    error_deleting_entry: 'Virhe poistettaessa kirjausta',
    unknown_client: 'Tuntematon asiakas',
    submit_for_approval: 'Lähetä hyväksyntään',
    update_time_entry: 'Päivitä aikakirjaus',
    time_entry_updated: 'Aikakirjaus päivitetty',
    draft: 'Luonnos',
    pending_approval: 'Odottaa hyväksyntää',
    approved: 'Hyväksytty',
    select_status: 'Valitse tila',
    only_admins_can_approve: 'Vain järjestelmänvalvojat voivat hyväksyä',
    approve: 'Hyväksy',
    approve_time_entry: 'Hyväksy tuntikirjaus',
    approve_time_entry_confirmation: 'Haluatko varmasti hyväksyä tämän tuntikirjauksen?',
    all_projects: 'Kaikki projektit',
    error_fetching_clients: 'Error fetching clients',
    error_fetching_projects: 'Error fetching projects',
    error_fetching_project_details: 'Error fetching project details',
    database_policy_error: 'Database policy error. Please try again or contact support.',
    duplicate_entry_error: 'A duplicate entry already exists.',
    foreign_key_constraint_error: 'Invalid project selection. Please choose another project.',
    
    // Chat Assistant translations - Finnish
    chat_welcome_message: "Hei! Olen avustajasi. Miten voin auttaa sinua tuntikirjauksissa tänään?",
    chat_error_message: "Valitettavasti tapahtui virhe. Yritä uudelleen myöhemmin.",
    chat_help_message: "Voin auttaa sinua tuntikirjausten kanssa. Esimerkiksi:\n- \"Kopioi eilisen tunnit tälle päivälle\"\n- \"Näytä tämän päivän kirjaukset\"\n- \"Näytä eilisen kirjaukset\"",
    chat_dont_understand: "En ymmärtänyt täysin pyyntöäsi. Voisitko tarkentaa? Voit esimerkiksi pyytää kopioimaan eilisen kirjaukset tai näyttämään tämän päivän kirjaukset.",
    chat_placeholder: "Kirjoita viesti...",
    ai_assistant: "AI-Avustaja",
    no_entries_yesterday: "Eiliselle päivälle ei löytynyt kirjauksia.",
    entries_exist_today: "Tälle päivälle on jo kirjauksia. Haluatko silti kopioida eilisen kirjaukset?",
    copied_entries_success: "Kopioitu kirjauksia eiliseltä tälle päivälle.",
    error_copying_entries: "Virhe kirjausten kopioinnissa. Yritä uudelleen myöhemmin.",
    today_entries_summary: "Tänään on kirjauksia, yhteensä tuntia:",
    yesterday_entries_summary: "Eilen oli kirjauksia, yhteensä tuntia:",
    error_fetching_entries: "Error fetching entries. Please try again later.",

    // User management translations - Finnish
    users: 'Käyttäjät',
    manage_users: 'Hallinnoi käyttäjiä',
    users_list: 'Käyttäjälista',
    add_user: 'Lisää käyttäjä',
    add_user_description: 'Luo uusi käyttäjätili',
    full_name: 'Koko nimi',
    role: 'Rooli',
    select_role: 'Valitse rooli',
    user: 'Käyttäjä',
    admin: 'Ylläpitäjä',
    name: 'Nimi',
    no_name: 'Ei nimeä',
    view_entries: 'Näytä kirjaukset',
    manage_user_time_entries: 'Hallinnoi käyttäjän tuntikirjauksia',
    no_entries_found: 'Kirjauksia ei löytynyt',
    return_for_edit: 'Palauta muokattavaksi',
    error_fetching_users: 'Error fetching users',
    error_adding_user: 'Error adding user',
    error_setting_role: 'Error setting user role',
    user_added_successfully: 'Käyttäjä lisätty onnistuneesti',
    unknown_project: 'Tuntematon projekti',
    rejection_comment_placeholder: 'Anna syy hylkäämiselle...',
    return_time_entry: 'Palauta tuntikirjaus',
    return_time_entry_confirmation: 'Haluatko varmasti palauttaa tämän tuntikirjauksen muokattavaksi?',
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
    project_name: 'Projektin namn',
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
    calendar: 'Kalender',
    inspired_by: 'Reportronic',
    login: "Logga in",
    register: "Registrera",
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
    login_required: "Du måste vara inloggad",
    back_to_clients: "Tillbaka till kunder",
    saving: "Sparar...",
    error_saving_time_entry: "Fel vid sparande av tidsinmatning",
    not_found: "404 Sidan hittades inte",
    page_not_found: "Sidan du söker finns inte.",
    return_to_home: "Återgå till startsidan",
    client_updated_successfully: "Kund uppdaterad framgångsrikt",
    edit: "Redigera",
    remove: "Ta bort",
    no_projects: "Inga projekt",
    add: "Lägg till",
    save_changes: "Spara ändringar",
    project_id: "Projekt-ID",
    manage_clients: "Hantera kunder",
    enter_client_name: "Ange kundnamn",
    update: "Uppdatera",
    no_clients: "Inga kunder tillgängliga",
    projects_count: "Antal projekt",
    client_updated: "Kund uppdaterad framgångsrikt",
    client_added: "Kund tillagd framgångsrikt",
    client_deleted: "Kund borttagen framgångsrikt",
    cannot_delete_client_with_projects: "Kan inte ta bort kund med projekt",
    error_adding_project: "Fel vid tilläggning av projekt",
    add_project_for: 'Lägg till projekt för',
    today_entries: 'Dagens inmatningar',
    edit_time_entry: 'Redigera tidsinmatning',
    no_entries_today: 'Inga inmatningar för idag',
    loading: 'Laddar',
    entry_deleted: 'Inmatning borttagen',
    error_deleting_entry: 'Fel vid borttagning av inmatning',
    unknown_client: 'Okänd kund',
    submit_for_approval: 'Skicka för godkännande',
    update_time_entry: 'Uppdatera tidsinmatning',
    time_entry_updated: 'Tidsinmatning uppdaterad',
    draft: 'Utkast',
    pending_approval: 'Väntar på godkännande',
    approved: 'Godkänd',
    select_status: 'Välj status',
    only_admins_can_approve: 'Endast administratörer kan godkänna',
    approve: 'Godkänn',
    approve_time_entry: 'Godkänn tidsinmatning',
    approve_time_entry_confirmation: 'Är du säker på att du vill godkänna denna tidsinmatning?',
    all_projects: 'Alla projekt',
    error_fetching_clients: 'Fel vid hämtning av kunder',
    error_fetching_projects: 'Fel vid hämtning av projekt',
    error_fetching_project_details: 'Fel vid hämtning av projektdetaljer',
    database_policy_error: 'Databasfelspolicy. Försök igen eller kontakta support.',
    duplicate_entry_error: 'En dubblett finns redan.',
    foreign_key_constraint_error: 'Ogiltig projektval. Välj ett annat projekt.',
    
    // Chat Assistant translations - Swedish
    chat_welcome_message: "Hej! Jag är din assistent. Hur kan jag hjälpa dig med tidsregistrering idag?",
    chat_error_message: "Tyvärr, ett fel inträffade. Försök igen senare.",
    chat_help_message: "Jag kan hjälpa dig med tidsinmatningar. Till exempel:\n- \"Kopiera gårdagens timmar till idag\"\n- \"Visa dagens inmatningar\"\n- \"Visa gårdagens inmatningar\"",
    chat_dont_understand: "Jag förstod inte helt din förfrågan. Kan du förtydliga? Du kan till exempel be mig att kopiera gårdagens inmatningar eller visa dagens inmatningar.",
    chat_placeholder: "Skriv ett meddelande...",
    ai_assistant: "AI-Assistent",
    no_entries_yesterday: "Inga inmatningar hittades för igår.",
    entries_exist_today: "Det finns redan inmatningar för idag. Vill du fortfarande kopiera gårdagens inmatningar?",
    copied_entries_success: "Kopierade inmatningar från igår till idag.",
    error_copying_entries: "Fel vid kopiering av inmatningar. Försök igen senare.",
    today_entries_summary: "Idag har inmatningar, totalt timmar:",
    yesterday_entries_summary: "Igår hade inmatningar, totalt timmar:",
    error_fetching_entries: "Fel vid hämtning av inmatningar. Försök igen senare.",

    // User management translations - Swedish
    users: 'Användare',
    manage_users: 'Hantera användare',
    users_list: 'Användarlista',
    add_user: 'Lägg till användare',
    add_user_description: 'Skapa ett nytt användarkonto',
    full_name: 'Fullständigt namn',
    role: 'Roll',
    select_role: 'Välj roll',
    user: 'Användare',
    admin: 'Administratör',
    name: 'Namn',
    no_name: 'Inget namn',
    view_entries: 'Visa inmatningar',
    manage_user_time_entries: 'Hantera användarens tidsinmatningar',
    no_entries_found: 'Inga inmatningar hittades',
    return_for_edit: 'Återlämna för redigering',
    error_fetching_users: 'Fel vid hämtning av användare',
    error_adding_user: 'Fel vid tillägg av användare',
    error_setting_role: 'Fel vid inställning av användarroll',
    user_added_successfully: 'Användare tillagd framgångsrikt',
    unknown_project: 'Okänt projekt',
    rejection_comment_placeholder: 'Ange en anledning för avslag...',
    return_time_entry: 'Återlämna tidsinmatning',
    return_time_entry_confirmation: 'Är du säker på att du vill återlämna denna tidsinmatning för redigering?',
  },
};

const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en');

  const t = (key: string) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const useLanguage = () => {
  return useContext(LanguageContext);
};

export { LanguageContext, useLanguage, LanguageProvider };
