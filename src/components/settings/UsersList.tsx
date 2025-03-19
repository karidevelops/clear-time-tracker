
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, Check, Edit, RotateCcw } from "lucide-react";
import { timeEntryStatuses, timeEntryStatusColors } from "@/utils/statusUtils";
import { toast } from "sonner";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { fi, sv, enUS } from 'date-fns/locale';
import ApprovalDialog from "@/components/reports/ApprovalDialog";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface TimeEntryWithDetails {
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

const addUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "user"]),
});

export const UsersList = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntryWithDetails[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | null>(null);

  const form = useForm<z.infer<typeof addUserSchema>>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "user",
    },
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Instead of using admin.listUsers(), get users from profiles and user_roles tables
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

      // Get emails from auth.users, but don't use them directly
      // Instead, get data from profiles and user_roles tables
      
      // Map roles to users
      const roleMap = new Map();
      userRoles?.forEach(role => roleMap.set(role.user_id, role.role));

      // Convert profiles to user objects
      const combinedUsers: User[] = profiles?.map(profile => ({
        id: profile.id,
        email: profile.id, // We don't have direct access to emails, using id as placeholder
        full_name: profile.full_name,
        role: roleMap.get(profile.id) || 'user',
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
    setEntriesLoading(true);
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

      setTimeEntries(formattedEntries);
    } catch (error) {
      console.error("Error in fetchUserTimeEntries:", error);
      toast.error(t('error_fetching_entries'));
    } finally {
      setEntriesLoading(false);
    }
  };

  const handleUserSelect = (userId: string, userName: string | null) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName || userId);
    fetchUserTimeEntries(userId);
  };

  const onSubmit = async (values: z.infer<typeof addUserSchema>) => {
    try {
      // First, create the user in auth.users using signup
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: values.email,
        password: generateRandomPassword(), // Generate a random password
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

      // If role is admin, update the user_roles table
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
      form.reset();
      fetchUsers(); // Refresh the user list
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

  const handleApprovalComplete = async (entryId: string, isApproved: boolean, comment?: string) => {
    try {
      if (isApproved) {
        const { error } = await supabase
          .from('time_entries')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: await supabase.auth.getUser().then(res => res.data.user?.id)
          })
          .eq('id', entryId);

        if (error) throw error;
        toast.success(t('entry_approved'));
      } else {
        const { error } = await supabase
          .from('time_entries')
          .update({
            status: 'draft',
          })
          .eq('id', entryId);

        if (error) throw error;
        toast.success(t('entry_rejected'));
      }

      if (selectedUserId) {
        fetchUserTimeEntries(selectedUserId);
      }
    } catch (error) {
      console.error("Error updating entry status:", error);
      toast.error(t('error_updating_entry'));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    let locale = enUS;
    
    if (language === 'fi') locale = fi;
    else if (language === 'sv') locale = sv;
    
    return format(date, 'PPP', { locale });
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
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">{t('users_list')}</TabsTrigger>
            {selectedUserId && (
              <TabsTrigger value="timeEntries">{selectedUserName} - {t('time_entries')}</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="users" className="mt-4">
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
                      <TableHead>{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>{user.full_name || t('no_name')}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={user.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300' : ''}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUserSelect(user.id, user.full_name)}
                            >
                              {t('view_entries')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {selectedUserId && (
            <TabsContent value="timeEntries" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedUserName} - {t('time_entries')}</CardTitle>
                  <CardDescription>{t('manage_user_time_entries')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {entriesLoading ? (
                    <div className="flex justify-center py-4">
                      <p>{t('loading')}...</p>
                    </div>
                  ) : timeEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <p>{t('no_entries_found')}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('date')}</TableHead>
                          <TableHead>{t('hours')}</TableHead>
                          <TableHead>{t('project')}</TableHead>
                          <TableHead>{t('description')}</TableHead>
                          <TableHead>{t('status')}</TableHead>
                          <TableHead>{t('actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeEntries.map(entry => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.hours}</TableCell>
                            <TableCell>{entry.project_name} ({entry.client_name})</TableCell>
                            <TableCell className="max-w-xs truncate">{entry.description || '-'}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`
                                  ${entry.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' : 
                                    entry.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-300' : 
                                    'bg-gray-100 text-gray-800 border-gray-300'}
                                `}
                              >
                                {t(entry.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {entry.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                      onClick={() => handleEntryAction(entry.id, 'approve')}
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      {t('approve')}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                      onClick={() => handleEntryAction(entry.id, 'reject')}
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      {t('return_for_edit')}
                                    </Button>
                                  </>
                                )}
                                {entry.status === 'approved' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                                    onClick={() => handleEntryAction(entry.id, 'reject')}
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    {t('return_for_edit')}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add_user')}</DialogTitle>
            <DialogDescription>{t('add_user_description')}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('full_name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('role')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('select_role')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">{t('user')}</SelectItem>
                        <SelectItem value="admin">{t('admin')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">{t('add_user')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {selectedEntry && (
        <ApprovalDialog
          open={approvalDialogOpen}
          onOpenChange={setApprovalDialogOpen}
          isApproving={selectedAction === 'approve'}
          onConfirm={(comment) => {
            if (selectedEntry) {
              handleApprovalComplete(
                selectedEntry, 
                selectedAction === 'approve',
                comment
              );
            }
            setApprovalDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};
