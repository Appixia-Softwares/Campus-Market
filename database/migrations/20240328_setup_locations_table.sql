-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT,
    country TEXT DEFAULT 'Zimbabwe'::text,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    description TEXT,
    is_university_area BOOLEAN DEFAULT false,
    university_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT locations_pkey PRIMARY KEY (id),
    CONSTRAINT locations_name_city_key UNIQUE (name, city),
    CONSTRAINT locations_university_id_fkey FOREIGN KEY (university_id) 
        REFERENCES universities(id)
);

-- Disable RLS
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Locations are viewable by everyone" ON public.locations;

-- Grant permissions to all roles
GRANT ALL ON public.locations TO authenticated, anon, service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Verify table structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'locations'
    ) THEN
        RAISE EXCEPTION 'Locations table was not created successfully';
    END IF;
END $$; 