
import { isWeekend, getDay } from 'date-fns';

// Finnish holidays for the current and next year
// This is a simplified list - in a production app, you might want to use a more complete solution
export const finnishHolidays: {[key: string]: string} = {
  // 2024 holidays
  '2024-01-01': 'Uudenvuodenpäivä',
  '2024-01-06': 'Loppiainen',
  '2024-03-29': 'Pitkäperjantai',
  '2024-03-31': 'Pääsiäispäivä',
  '2024-04-01': 'Toinen pääsiäispäivä',
  '2024-05-01': 'Vappu',
  '2024-05-09': 'Helatorstai',
  '2024-05-19': 'Helluntaipäivä',
  '2024-06-21': 'Juhannusaatto',
  '2024-06-22': 'Juhannuspäivä',
  '2024-11-02': 'Pyhäinpäivä',
  '2024-12-06': 'Itsenäisyyspäivä',
  '2024-12-24': 'Jouluaatto',
  '2024-12-25': 'Joulupäivä',
  '2024-12-26': 'Tapaninpäivä',
  '2024-12-31': 'Uudenvuodenaatto',
  
  // 2025 holidays
  '2025-01-01': 'Uudenvuodenpäivä',
  '2025-01-06': 'Loppiainen',
  '2025-04-18': 'Pitkäperjantai',
  '2025-04-20': 'Pääsiäispäivä',
  '2025-04-21': 'Toinen pääsiäispäivä',
  '2025-05-01': 'Vappu',
  '2025-05-29': 'Helatorstai',
  '2025-06-08': 'Helluntaipäivä',
  '2025-06-20': 'Juhannusaatto',
  '2025-06-21': 'Juhannuspäivä',
  '2025-11-01': 'Pyhäinpäivä',
  '2025-12-06': 'Itsenäisyyspäivä',
  '2025-12-24': 'Jouluaatto',
  '2025-12-25': 'Joulupäivä',
  '2025-12-26': 'Tapaninpäivä',
  '2025-12-31': 'Uudenvuodenaatto',
};

export const isFinnishHoliday = (date: Date): boolean => {
  const formattedDate = date.toISOString().split('T')[0];
  return formattedDate in finnishHolidays;
};

export const isHolidayOrWeekend = (date: Date): boolean => {
  return isWeekend(date) || isFinnishHoliday(date);
};

export const getHolidayName = (date: Date): string | null => {
  const formattedDate = date.toISOString().split('T')[0];
  return finnishHolidays[formattedDate] || null;
};
