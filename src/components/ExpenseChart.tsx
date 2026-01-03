import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Expense } from '@/hooks/useExpenses';
import { formatCurrency } from '@/lib/balanceCalculator';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface ExpenseChartProps {
  expenses: Expense[];
  type: 'category' | 'monthly';
}

const COLORS = [
  'hsl(162 63% 41%)', // primary
  'hsl(38 92% 50%)',  // accent
  'hsl(220 14% 60%)', // muted
  'hsl(0 84% 60%)',   // destructive
  'hsl(142 76% 36%)', // success
  'hsl(262 63% 55%)', // purple
  'hsl(200 63% 45%)', // blue
  'hsl(15 80% 50%)',  // orange
];

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent',
  electricity: 'Electricity',
  water: 'Water',
  wifi: 'WiFi',
  groceries: 'Groceries',
  food: 'Food',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  general: 'General',
};

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses, type }) => {
  if (expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No expense data to display
      </div>
    );
  }

  if (type === 'category') {
    const categoryData = expenses.reduce((acc, expense) => {
      const category = expense.category || 'general';
      acc[category] = (acc[category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(categoryData)
      .map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value: Math.round(value * 100) / 100
      }))
      .sort((a, b) => b.value - a.value);

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Monthly trend chart
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      month: format(date, 'MMM yyyy'),
      start: startOfMonth(date),
      end: endOfMonth(date),
      total: 0
    };
  });

  expenses.forEach(expense => {
    const expenseDate = new Date(expense.expense_date);
    const monthData = last6Months.find(m => 
      isWithinInterval(expenseDate, { start: m.start, end: m.end })
    );
    if (monthData) {
      monthData.total += Number(expense.amount);
    }
  });

  const data = last6Months.map(m => ({
    name: m.month,
    amount: Math.round(m.total * 100) / 100
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
        />
        <YAxis 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip 
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Bar 
          dataKey="amount" 
          fill="hsl(162 63% 41%)" 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
