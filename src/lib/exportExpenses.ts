import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Expense, ExpenseSplit } from '@/hooks/useExpenses';
import { GroupMember } from '@/hooks/useGroups';
import { formatCurrency } from '@/lib/balanceCalculator';

interface ExportData {
  expenses: Expense[];
  splits: ExpenseSplit[];
  members: GroupMember[];
  groupName: string;
}

const getMemberName = (userId: string, members: GroupMember[]) => {
  const member = members.find(m => m.user_id === userId);
  return member?.profile?.name || member?.profile?.email?.split('@')[0] || 'Unknown';
};

const getExpenseSplitsText = (expenseId: string, splits: ExpenseSplit[], members: GroupMember[]) => {
  const expenseSplits = splits.filter(s => s.expense_id === expenseId);
  return expenseSplits
    .map(s => `${getMemberName(s.user_id, members)}: ${formatCurrency(s.amount)}`)
    .join(', ');
};

export const exportToCSV = ({ expenses, splits, members, groupName }: ExportData) => {
  const headers = ['Date', 'Title', 'Category', 'Amount', 'Paid By', 'Type', 'Split Details'];
  
  const rows = expenses.map(expense => [
    format(new Date(expense.expense_date), 'yyyy-MM-dd'),
    expense.title,
    expense.category || 'general',
    expense.amount.toString(),
    getMemberName(expense.paid_by, members),
    expense.expense_type,
    getExpenseSplitsText(expense.id, splits, members)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${groupName.replace(/\s+/g, '_')}_expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = ({ expenses, splits, members, groupName }: ExportData) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(`${groupName} - Expenses Report`, 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 14, 30);
  
  // Summary
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 14, 42);
  doc.text(`Number of Expenses: ${expenses.length}`, 14, 50);

  // Table
  const tableData = expenses.map(expense => [
    format(new Date(expense.expense_date), 'MMM d, yyyy'),
    expense.title,
    expense.category || 'general',
    formatCurrency(expense.amount),
    getMemberName(expense.paid_by, members),
    expense.expense_type
  ]);

  autoTable(doc, {
    startY: 58,
    head: [['Date', 'Title', 'Category', 'Amount', 'Paid By', 'Type']],
    body: tableData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
    alternateRowStyles: { fillColor: [245, 247, 250] }
  });

  doc.save(`${groupName.replace(/\s+/g, '_')}_expenses_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
