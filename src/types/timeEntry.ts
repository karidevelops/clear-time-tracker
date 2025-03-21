
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
  rejection_comment?: string | null;
  user_full_name?: string;
  // Make projects optional since it will only be available when joined
  projects?: {
    id: string;
    name: string;
    client_id?: string | null;
  } | null;
}

export interface TimeEntryWithDetails {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  status: string;
  user_id: string;
  user_full_name: string | null;
  project_name: string;
  client_name: string;
}
