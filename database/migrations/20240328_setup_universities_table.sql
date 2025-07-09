-- Enable RLS
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Universities are viewable by everyone" ON public.universities;

-- Create policy for viewing universities
CREATE POLICY "Universities are viewable by everyone"
ON public.universities
FOR SELECT
TO authenticated, anon
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON public.universities TO authenticated, anon;

-- Grant permissions to service role
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Verify RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'universities'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS is not enabled on universities table';
    END IF;
END $$;

-- Verify policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'universities'
        AND policyname = 'Universities are viewable by everyone'
    ) THEN
        RAISE EXCEPTION 'Policy does not exist on universities table';
    END IF;
END $$; 