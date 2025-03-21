
export const timeEntryStatuses = {
  draft: 'draft',
  pending: 'pending',
  approved: 'approved'
};

export const timeEntryStatusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  pending: 'bg-orange-100 text-orange-800 border-orange-300',
  approved: 'bg-green-100 text-green-800 border-green-300'
};

// Add translations for these strings in your language files
export const timeEntryMessages = {
  approve_all_hours: 'Approve All Hours',
  approve_all_hours_description: 'This will approve all pending time entries for the selected month',
  approve_all_hours_warning: 'This action will approve all pending time entries for the selected month and cannot be undone.',
  select_month: 'Select Month',
  approve_all: 'Approve All',
  approving: 'Approving...',
  all_entries_approved_for_month: 'All entries for {{month}} have been approved',
  error_approving_entries: 'Error approving entries',
  approve_time_entry: 'Approve Time Entry',
  return_time_entry: 'Return Time Entry',
  approve_time_entry_confirmation: 'Are you sure you want to approve this time entry?',
  return_time_entry_confirmation: 'Are you sure you want to return this time entry?',
  rejection_comment_placeholder: 'Add a comment about why this entry is being returned',
  entry_approved: 'Entry approved successfully',
  entry_rejected: 'Entry returned for edits',
  error_updating_entry: 'Error updating entry status',
  approve: 'Approve',
  return_for_edit: 'Return for Edit',
  return: 'Return'
};
