
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { UserItem } from "./UserItem";
import { UserForm } from "./UserForm";
import { BulkApprovalDialog } from "./BulkApprovalDialog";
import { ApprovalDialog } from "@/components/reports/ApprovalDialog";
import { User } from "@/types/user";
import { TimeEntryWithDetails } from "@/types/timeEntry";
import * as z from "zod";

export const UsersList = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [userTimeEntries, setUserTimeEntries] = useState<Record<string, TimeEntryWithDetails[]>>({});
  const [entriesLoading, setEntriesLoading] = useState<Record<string, boolean>>({});
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkApprovalDialogOpen, setBulkApprovalDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // Current month in YYYY-MM format
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');
      
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast.error(t('error_fetching_users'));
        return;
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error("Error fetching user roles:", rolesError);
      }

      let authUsers = [];
      let authError = null;
      
      try {
        const response = await supabase.functions.invoke('get-user-emails', {
          method: 'GET'
        });
        
        if (response.error) {
          authError = response.error;
        } else {
          authUsers = response.data || [];
        }
      } catch (error) {
        authError = error;
        console.error("Error fetching user emails:", error);
      }
      
      if (authError) {
        console.error("Error fetching user emails:", authError);
      }

      const roleMap = new Map();
      userRoles?.forEach(role => roleMap.set(role.user_id, role.role));
      
      const emailMap = new Map();
      if (authUsers && Array.isArray(authUsers)) {
        authUsers.forEach((user: {id: string, email: string}) => emailMap.set(user.id, user.email));
      }

      const combinedUsers: User[] = profiles?.map(profile => ({
        id: profile.id,
        email: emailMap.get(profile.id) || profile.id,
        full_name: profile.full_name,
        role: roleMap.get(profile.id) || 'user'
      })) || [];

      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      toast.error(t('error_fetching_users'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTimeEntries = async (userId: string) => {
    if (userTimeEntries[userId] && userTimeEntries[userId].length > 0) {
      return; // Data already loaded
    }
    
    setEntriesLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          id, date, hours, description, status, user_id,
          projects (
            name,
            clients (
              name
            )
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching time entries:", error);
        toast.error(t('error_fetching_entries'));
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const formattedEntries = data.map(entry => ({
        id: entry.id,
        date: entry.date,
        hours: entry.hours,
        description: entry.description,
        status: entry.status,
        user_id: entry.user_id,
        user_full_name: profile?.full_name || null,
        project_name: entry.projects?.name || t('unknown_project'),
        client_name: entry.projects?.clients?.name || t('unknown_client'),
      }));

      setUserTimeEntries(prev => ({
        ...prev,
        [userId]: formattedEntries
      }));
    } catch (error) {
      console.error("Error in fetchUserTimeEntries:", error);
      toast.error(t('error_fetching_entries'));
    } finally {
      setEntriesLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleAddUser = async (values: z.infer<typeof addUserSchema>) => {
    try {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: values.email,
        password: generateRandomPassword(),
        options: {
          data: {
            full_name: values.full_name
          }
        }
      });

      if (signupError) {
        console.error("Error signing up user:", signupError);
        toast.error(t('error_adding_user'));
        return;
      }

      const newUserId = signupData.user?.id;
      
      if (!newUserId) {
        toast.error(t('error_adding_user'));
        return;
      }

      if (values.role === 'admin') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'admin' })
          .eq('user_id', newUserId);
        
        if (roleError) {
          console.error("Error updating user role:", roleError);
          toast.error(t('error_setting_role'));
        }
      }

      toast.success(t('user_added_successfully'));
      setAddUserDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(t('error_adding_user'));
    }
  };

  const generateRandomPassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
  };

  const handleEntryAction = (entryId: string, action: 'approve' | 'reject') => {
    setSelectedEntry(entryId);
    setSelectedAction(action);
    setApprovalDialogOpen(true);
  };

  const handleApprovalConfirm = (comment: string) => {
    if (!selectedEntry || selectedAction === null) return;
    
    const isApproved = selectedAction === 'approve';
    handleApprovalUpdate(isApproved, comment);
    setApprovalDialogOpen(false);
  };

  const handleApprovalUpdate = async (isApproved: boolean, comment: string) => {
    try {
      if (!selectedEntry) return;
      
      if (isApproved) {
        const { error } = await supabase
          .from('time_entries')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: await supabase.auth.getUser().then(res => res.data.user?.id)
          })
          .eq('id', selectedEntry);

        if (error) throw error;
        toast.success(t('entry_approved'));
      } else {
        const { error } = await supabase
          .from('time_entries')
          .update({
            status: 'draft',
            rejection_comment: comment
          })
          .eq('id', selectedEntry);

        if (error) throw error;
        toast.success(t('entry_rejected'));
      }

      const entryUserId = Object.keys(userTimeEntries).find(userId => 
        userTimeEntries[userId].some(entry => entry.id === selectedEntry)
      );
      
      if (entryUserId) {
        setUserTimeEntries(prev => ({
          ...prev,
          [entryUserId]: prev[entryUserId].map(entry => 
            entry.id === selectedEntry 
              ? { ...entry, status: isApproved ? 'approved' : 'draft' } 
              : entry
          )
        }));
      }
    } catch (error) {
      console.error("Error updating entry status:", error);
      toast.error(t('error_updating_entry'));
    }
  };

  const handleBulkApprove = (userId: string) => {
    setSelectedUserId(userId);
    setBulkApprovalDialogOpen(true);
  };

  const approvePendingEntriesForMonth = async () => {
    if (!selectedUserId || !selectedMonth) return;
    
    setLoading(true);
    try {
      const year = parseInt(selectedMonth.split('-')[0]);
      const month = parseInt(selectedMonth.split('-')[1]) - 1; // JS months are 0-indexed
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of month
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('user_id', selectedUserId)
        .eq('status', 'pending')
        .gte('date', startDateStr)
        .lte('date', endDateStr);
      
      if (error) throw error;
      
      await fetchUserTimeEntries(selectedUserId);
      
      const monthName = new Date(year, month).toLocaleString(language === 'fi' ? 'fi-FI' : language === 'sv' ? 'sv-SE' : 'en-US', { month: 'long' });
      toast.success(t('all_entries_approved_for_month', { month: monthName }));
      
      setBulkApprovalDialogOpen(false);
    } catch (error) {
      console.error("Error approving entries:", error);
      toast.error(t('error_approving_entries'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('users')}</h2>
        <Button onClick={() => setAddUserDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('add_user')}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex justify-center">
              <p>{t('loading')}...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('users')}</CardTitle>
            <CardDescription>{t('manage_users')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('email')}</TableHead>
                  <TableHead>{t('role')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <UserItem
                    key={user.id}
                    user={user}
                    onBulkApprove={handleBulkApprove}
                    fetchUserTimeEntries={fetchUserTimeEntries}
                    entriesLoading={entriesLoading}
                    userTimeEntries={userTimeEntries}
                    handleEntryAction={handleEntryAction}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <UserForm
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onSubmit={handleAddUser}
      />

      {selectedEntry && (
        <ApprovalDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          isApproving={selectedAction === 'approve'}
          onConfirm={handleApprovalConfirm}
        />
      )}

      <BulkApprovalDialog
        open={bulkApprovalDialogOpen}
        onOpenChange={setBulkApprovalDialogOpen}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onConfirm={approvePendingEntriesForMonth}
        loading={loading}
      />
    </div>
  );
};
