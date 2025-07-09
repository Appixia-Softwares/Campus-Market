-- Enable RLS on universities table
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Universities are viewable by everyone" ON universities;

-- Create new policy that allows both authenticated and anonymous users to view universities
CREATE POLICY "Universities are viewable by everyone"
ON universities FOR SELECT
TO authenticated, anon
USING (true);

-- Grant necessary permissions
GRANT SELECT ON universities TO authenticated;
GRANT SELECT ON universities TO anon; 