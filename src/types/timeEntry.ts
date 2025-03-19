
export type TimeEntryStatus = "draft" | "pending" | "approved";

export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project_id: string;
  description: string | null;
  user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  status: TimeEntryStatus;
  user_full_name?: string;
  profiles?: {
    full_name: string | null;
  } | null | any; // Add 'any' to handle error cases
}
