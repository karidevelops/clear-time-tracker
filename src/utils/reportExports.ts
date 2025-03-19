
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TimeEntry } from '@/types/timeEntry';
import { toast } from 'sonner';

export const exportToCsv = (
  filteredEntries: TimeEntry[], 
  getClientName: (projectId: string) => string,
  getProjectName: (projectId: string) => string,
  t: (key: string) => string
) => {
  if (filteredEntries.length === 0) return;
  
  let csvContent = "data:text/csv;charset=utf-8;";
  
  csvContent += "Date,Client,Project,Description,Hours,Status\n";
  
  filteredEntries.forEach(entry => {
    const row = [
      format(new Date(entry.date), 'yyyy-MM-dd'),
      getClientName(entry.project_id),
      getProjectName(entry.project_id),
      entry.description || '',
      entry.hours,
      entry.status
    ];
    
    const formattedRow = row.map(cell => {
      const cellStr = String(cell);
      return cellStr.includes(',') || cellStr.includes('"') 
        ? `"${cellStr.replace(/"/g, '""')}"` 
        : cellStr;
    });
    
    csvContent += formattedRow.join(',') + "\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `time-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (
  filteredEntries: TimeEntry[], 
  getClientName: (projectId: string) => string,
  getProjectName: (projectId: string) => string,
  t: (key: string) => string
) => {
  if (filteredEntries.length === 0) return;
  
  const worksheet = XLSX.utils.json_to_sheet(
    filteredEntries.map(entry => ({
      Date: format(new Date(entry.date), 'yyyy-MM-dd'),
      Client: getClientName(entry.project_id),
      Project: getProjectName(entry.project_id),
      Description: entry.description || '',
      Hours: entry.hours,
      Status: entry.status,
      User: entry.user_full_name
    }))
  );
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Time Entries");
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `time-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  link.click();
  
  URL.revokeObjectURL(url);
};

export const exportToPdf = (
  filteredEntries: TimeEntry[], 
  totalHours: number,
  getClientName: (projectId: string) => string,
  getProjectName: (projectId: string) => string,
  dateRange: { from: Date, to: Date },
  t: (key: string) => string
) => {
  if (filteredEntries.length === 0) return;
  
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text("Time Report", 14, 22);
  
  doc.setFontSize(11);
  doc.text(
    `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`,
    14, 32
  );
  
  doc.text(`Total Hours: ${totalHours.toFixed(1)}`, 14, 42);
  
  const tableData = filteredEntries.map(entry => [
    format(new Date(entry.date), 'yyyy-MM-dd'),
    getClientName(entry.project_id),
    getProjectName(entry.project_id),
    entry.description || '',
    entry.hours.toString(),
    entry.status,
    entry.user_full_name
  ]);
  
  autoTable(doc, {
    head: [['Date', 'Client', 'Project', 'Description', 'Hours', 'Status', 'User']],
    body: tableData,
    startY: 50,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [100, 100, 100] }
  });
  
  doc.save(`time-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
