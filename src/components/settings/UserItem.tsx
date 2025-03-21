
import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, CalendarCheck } from "lucide-react";
import { TimeEntriesList } from "./TimeEntriesList";
import { User } from "@/types/user";
import { TimeEntryWithDetails } from "@/types/timeEntry";

interface UserItemProps {
  user: User;
  onBulkApprove: (userId: string) => void;
  fetchUserTimeEntries: (userId: string) => Promise<void>;
  entriesLoading: Record<string, boolean>;
  userTimeEntries: Record<string, TimeEntryWithDetails[]>;
  handleEntryAction: (entryId: string, action: 'approve' | 'reject') => void;
}

export const UserItem: React.FC<UserItemProps> = ({
  user,
  onBulkApprove,
  fetchUserTimeEntries,
  entriesLoading,
  userTimeEntries,
  handleEntryAction
}) => {
  const { t } = useLanguage();
  const [showEntries, setShowEntries] = useState(false);

  const toggleEntries = () => {
    setShowEntries(!showEntries);
    if (!userTimeEntries[user.id] && !showEntries) {
      fetchUserTimeEntries(user.id);
    }
  };

  return (
    <React.Fragment>
      <TableRow>
        <TableCell>{user.full_name || t('no_name')}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Badge variant="outline" className={user.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' : ''}>
            {user.role}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleEntries}
            >
              {showEntries ? (
                <>
                  {t('hide_entries')}
                  <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  {t('view_entries')}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
              onClick={() => onBulkApprove(user.id)}
            >
              <CalendarCheck className="mr-1 h-4 w-4" />
              {t('approve_all_hours')}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      {showEntries && (
        <TableRow>
          <TableCell colSpan={4} className="p-0 border-t-0">
            <div className="bg-slate-50 p-4 rounded-md">
              <TimeEntriesList 
                userId={user.id}
                loading={entriesLoading[user.id]}
                entries={userTimeEntries[user.id] || []}
                handleEntryAction={handleEntryAction}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};
