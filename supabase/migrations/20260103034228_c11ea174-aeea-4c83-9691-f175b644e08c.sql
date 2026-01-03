
-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'hostel' CHECK (type IN ('hostel', 'pg', 'flat', 'room')),
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  paid_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  expense_type TEXT NOT NULL DEFAULT 'one-time' CHECK (expense_type IN ('one-time', 'monthly')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_recurrence_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create expense_splits table
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expense_id, user_id)
);

-- Enable RLS on expense_splits
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Groups policies (members can view/modify their groups)
CREATE POLICY "Members can view groups" ON public.groups 
FOR SELECT USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create groups" ON public.groups 
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update groups" ON public.groups 
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete groups" ON public.groups 
FOR DELETE USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Members can view group members" ON public.group_members 
FOR SELECT USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Authenticated users can join groups" ON public.group_members 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave groups" ON public.group_members 
FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
CREATE POLICY "Members can view group expenses" ON public.expenses 
FOR SELECT USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Members can create expenses" ON public.expenses 
FOR INSERT WITH CHECK (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Payer can update expenses" ON public.expenses 
FOR UPDATE USING (auth.uid() = paid_by);

CREATE POLICY "Payer can delete expenses" ON public.expenses 
FOR DELETE USING (auth.uid() = paid_by);

-- Expense splits policies
CREATE POLICY "Members can view expense splits" ON public.expense_splits 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_id AND public.is_group_member(auth.uid(), e.group_id)
  )
);

CREATE POLICY "Members can create expense splits" ON public.expense_splits 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_id AND public.is_group_member(auth.uid(), e.group_id)
  )
);

CREATE POLICY "Members can update expense splits" ON public.expense_splits 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_id AND public.is_group_member(auth.uid(), e.group_id)
  )
);

CREATE POLICY "Members can delete expense splits" ON public.expense_splits 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.expenses e 
    WHERE e.id = expense_id AND public.is_group_member(auth.uid(), e.group_id)
  )
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-add creator as group member
CREATE OR REPLACE FUNCTION public.add_creator_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.add_creator_as_member();

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_splits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
