import React, { useState, useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { BalanceCard } from '@/components/BalanceCard';
import { SettlementList } from '@/components/SettlementList';
import { SettlementHistory } from '@/components/SettlementHistory';
import { RecordSettlementDialog } from '@/components/RecordSettlementDialog';
import { ExpenseList } from '@/components/ExpenseList';
import { AddExpenseDialog } from '@/components/AddExpenseDialog';
import { ExpenseChart } from '@/components/ExpenseChart';
import { useGroup, useGroupMembers, useRegenerateInviteCode } from '@/hooks/useGroups';
import { useExpenses, useExpenseSplits, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { useSettlements, useCreateSettlement, useDeleteSettlement } from '@/hooks/useSettlements';
import { calculateNetBalances, calculateSettlements, formatCurrency } from '@/lib/balanceCalculator';
import { exportToCSV, exportToPDF } from '@/lib/exportExpenses';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Plus, ArrowLeft, Copy, Check, Share2, TrendingUp, Wallet, Users, PieChart, BarChart3, Download, FileText, FileSpreadsheet, History, Banknote, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PageTransition, SlideTransition } from '@/components/PageTransition';

const GroupDashboard: React.FC = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  
  const { data: group, isLoading: groupLoading } = useGroup(groupId || '');
  const { data: members, isLoading: membersLoading } = useGroupMembers(groupId || '');
  const { data: expenses, isLoading: expensesLoading } = useExpenses(groupId || '');
  const { data: splits, isLoading: splitsLoading } = useExpenseSplits(groupId || '');
  const { data: settlementRecords, isLoading: settlementsLoading } = useSettlements(groupId || '');
  
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  const createSettlement = useCreateSettlement();
  const deleteSettlement = useDeleteSettlement();
  const regenerateInviteCode = useRegenerateInviteCode();

  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [recordSettlementOpen, setRecordSettlementOpen] = useState(false);
  const [suggestedSettlement, setSuggestedSettlement] = useState<{ toUserId: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // Calculate balances
  const { balances, settlements, memberNames } = useMemo(() => {
    if (!members || !expenses || !splits) {
      return { balances: new Map(), settlements: [], memberNames: new Map() };
    }

    const memberIds = members.map(m => m.user_id);
    const expenseData = expenses.map(e => ({
      id: e.id,
      amount: Number(e.amount),
      paid_by: e.paid_by
    }));
    const splitData = splits.map(s => ({
      expense_id: s.expense_id,
      user_id: s.user_id,
      amount: Number(s.amount)
    }));

    const balances = calculateNetBalances(expenseData, splitData, memberIds);
    const settlements = calculateSettlements(balances);

    const memberNames = new Map<string, string>();
    members.forEach(m => {
      const name = m.profile?.name || m.profile?.email?.split('@')[0] || 'Unknown';
      memberNames.set(m.user_id, name);
    });

    return { balances, settlements, memberNames };
  }, [members, expenses, splits]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!expenses || !balances) {
      return { totalExpenses: 0, mostPaid: null, mostOwed: null };
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    let mostPaid: { name: string; amount: number } | null = null;
    let mostOwed: { name: string; amount: number } | null = null;

    balances.forEach((balance, userId) => {
      const name = memberNames.get(userId) || 'Unknown';
      
      if (!mostPaid || balance.totalPaid > mostPaid.amount) {
        mostPaid = { name, amount: balance.totalPaid };
      }
      
      if (balance.netBalance < 0) {
        if (!mostOwed || Math.abs(balance.netBalance) > mostOwed.amount) {
          mostOwed = { name, amount: Math.abs(balance.netBalance) };
        }
      }
    });

    return { totalExpenses, mostPaid, mostOwed };
  }, [expenses, balances, memberNames]);

  if (authLoading || groupLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </PageTransition>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!group) {
    return <Navigate to="/groups" replace />;
  }

  const handleCreateExpense = (data: {
    title: string;
    amount: number;
    paidBy: string;
    expenseType: 'one-time' | 'monthly';
    expenseDate: string;
    category: string;
    splits: { userId: string; amount: number }[];
  }) => {
    createExpense.mutate({
      groupId: groupId!,
      title: data.title,
      amount: data.amount,
      paidBy: data.paidBy,
      expenseType: data.expenseType,
      expenseDate: data.expenseDate,
      category: data.category,
      splits: data.splits
    }, {
      onSuccess: () => setAddExpenseOpen(false)
    });
  };

  const handleDeleteExpense = (expenseId: string) => {
    deleteExpense.mutate({ expenseId, groupId: groupId! });
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
      toast({ title: 'Invite code copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleExportCSV = () => {
    if (!expenses || !splits || !members || !group) return;
    exportToCSV({ expenses, splits, members, groupName: group.name });
    toast({ title: 'CSV exported successfully!' });
  };

  const handleExportPDF = () => {
    if (!expenses || !splits || !members || !group) return;
    exportToPDF({ expenses, splits, members, groupName: group.name });
    toast({ title: 'PDF exported successfully!' });
  };

  const inviteUrl = `${window.location.origin}/join/${group.invite_code}`;

  const handleRecordSettlement = (data: { toUserId: string; amount: number; notes?: string }) => {
    createSettlement.mutate({
      groupId: groupId!,
      toUserId: data.toUserId,
      amount: data.amount,
      notes: data.notes
    }, {
      onSuccess: () => {
        setRecordSettlementOpen(false);
        setSuggestedSettlement(null);
      }
    });
  };

  const handleSettleClick = (fromUserId: string, toUserId: string, amount: number) => {
    // Only allow current user to record their own payments
    if (fromUserId === user.id) {
      setSuggestedSettlement({ toUserId, amount });
      setRecordSettlementOpen(true);
    }
  };

  const handleDeleteSettlement = (settlementId: string) => {
    deleteSettlement.mutate({ settlementId, groupId: groupId! });
  };

  return (
    <SlideTransition>
      <Layout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/groups" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to groups
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{group.name}</h1>
              <p className="text-muted-foreground mt-1">
                {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''}
                {group.description && ` • ${group.description}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Button size="sm" onClick={() => setAddExpenseOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Payer</p>
                  <p className="text-xl font-bold text-foreground">
                    {stats.mostPaid ? stats.mostPaid.name : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Members</p>
                  <p className="text-xl font-bold text-foreground">{members?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="balances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="balances">Balances</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="settlements">Settle Up</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          {/* Balances Tab */}
          <TabsContent value="balances">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {membersLoading || splitsLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                ))
              ) : (
                Array.from(balances.entries()).map(([userId, balance]) => (
                  <BalanceCard
                    key={userId}
                    userName={memberNames.get(userId) || 'Unknown'}
                    balance={balance.netBalance}
                    totalPaid={balance.totalPaid}
                    totalOwed={balance.totalOwed}
                    isCurrentUser={userId === user.id}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!expenses || expenses.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {expensesLoading || splitsLoading || membersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <ExpenseList
                expenses={expenses || []}
                splits={splits || []}
                members={members || []}
                currentUserId={user.id}
                onDelete={handleDeleteExpense}
                isDeleting={deleteExpense.isPending}
              />
            )}
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg">Who Owes Whom</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setRecordSettlementOpen(true)}>
                  <Banknote className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </CardHeader>
              <CardContent>
                <SettlementList
                  settlements={settlements}
                  memberNames={memberNames}
                  currentUserId={user.id}
                  onSettleClick={handleSettleClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Settlement History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {settlementsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <SettlementHistory
                    settlements={settlementRecords || []}
                    members={members || []}
                    currentUserId={user.id}
                    onDelete={handleDeleteSettlement}
                    isDeleting={deleteSettlement.isPending}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    By Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseChart expenses={expenses || []} type="category" />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Monthly Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExpenseChart expenses={expenses || []} type="monthly" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        members={members || []}
        onSubmit={handleCreateExpense}
        isLoading={createExpense.isPending}
      />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Invite Members</DialogTitle>
            <DialogDescription>
              Share this invite code with your roommates to add them to the group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Invite Code</label>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  value={group.invite_code} 
                  readOnly 
                  className="font-mono text-center text-lg tracking-widest"
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleCopyInviteCode}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Expiration Status */}
            {group.invite_code_expires_at && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                new Date(group.invite_code_expires_at) < new Date() 
                  ? 'bg-destructive/10 text-destructive' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {new Date(group.invite_code_expires_at) < new Date() ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Code expired</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">
                      Expires {new Date(group.invite_code_expires_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Single-use indicator */}
            {group.invite_code_single_use && (
              <p className="text-xs text-muted-foreground text-center">
                🔒 Single-use: Code regenerates after someone joins
              </p>
            )}

            {/* Regenerate button (only for group creator) */}
            {group.created_by === user.id && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => regenerateInviteCode.mutate(group.id)}
                disabled={regenerateInviteCode.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${regenerateInviteCode.isPending ? 'animate-spin' : ''}`} />
                {regenerateInviteCode.isPending ? 'Regenerating...' : 'Generate New Code'}
              </Button>
            )}

            <p className="text-sm text-muted-foreground text-center">
              Members can join using this code in the "Join Group" option
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Settlement Dialog */}
      <RecordSettlementDialog
        open={recordSettlementOpen}
        onOpenChange={(open) => {
          setRecordSettlementOpen(open);
          if (!open) setSuggestedSettlement(null);
        }}
        members={members || []}
        currentUserId={user.id}
        suggestedSettlement={suggestedSettlement}
        onSubmit={handleRecordSettlement}
        isLoading={createSettlement.isPending}
      />
    </Layout>
    </SlideTransition>
  );
};

export default GroupDashboard;
