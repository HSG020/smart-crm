-- Enable Row Level Security on all tables
-- Run this script in Supabase SQL Editor to ensure RLS is properly configured

-- 1. Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

DROP POLICY IF EXISTS "Users can view their own reminders" ON follow_up_reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON follow_up_reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON follow_up_reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON follow_up_reminders;

DROP POLICY IF EXISTS "Users can view their own communications" ON communication_history;
DROP POLICY IF EXISTS "Users can insert their own communications" ON communication_history;
DROP POLICY IF EXISTS "Users can update their own communications" ON communication_history;
DROP POLICY IF EXISTS "Users can delete their own communications" ON communication_history;

DROP POLICY IF EXISTS "Users can view their own opportunities" ON sales_opportunities;
DROP POLICY IF EXISTS "Users can insert their own opportunities" ON sales_opportunities;
DROP POLICY IF EXISTS "Users can update their own opportunities" ON sales_opportunities;
DROP POLICY IF EXISTS "Users can delete their own opportunities" ON sales_opportunities;

DROP POLICY IF EXISTS "All users can view team members" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can manage team members" ON team_members;

-- 3. Create comprehensive policies for customers table
CREATE POLICY "Enable read access for users own customers"
ON customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users own customers"
ON customers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users own customers"
ON customers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users own customers"
ON customers FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create comprehensive policies for follow_up_reminders table
CREATE POLICY "Enable read access for users own reminders"
ON follow_up_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users own reminders"
ON follow_up_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users own reminders"
ON follow_up_reminders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users own reminders"
ON follow_up_reminders FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create comprehensive policies for communication_history table
CREATE POLICY "Enable read access for users own communications"
ON communication_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users own communications"
ON communication_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users own communications"
ON communication_history FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users own communications"
ON communication_history FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create comprehensive policies for sales_opportunities table
CREATE POLICY "Enable read access for users own opportunities"
ON sales_opportunities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users own opportunities"
ON sales_opportunities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users own opportunities"
ON sales_opportunities FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users own opportunities"
ON sales_opportunities FOR DELETE
USING (auth.uid() = user_id);

-- 7. Team members table - allow all authenticated users to view, but restrict modifications
CREATE POLICY "Anyone can view team members"
ON team_members FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert team members"
ON team_members FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update team members"
ON team_members FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete team members"
ON team_members FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 8. Grant necessary permissions to authenticated users
GRANT ALL ON customers TO authenticated;
GRANT ALL ON follow_up_reminders TO authenticated;
GRANT ALL ON communication_history TO authenticated;
GRANT ALL ON sales_opportunities TO authenticated;
GRANT ALL ON team_members TO authenticated;

-- 9. Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'RLS policies have been successfully configured!' as message;