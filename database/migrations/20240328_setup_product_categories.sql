-- Create product categories table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    parent_id UUID,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_categories_pkey PRIMARY KEY (id),
    CONSTRAINT product_categories_name_key UNIQUE (name),
    CONSTRAINT product_categories_parent_id_fkey FOREIGN KEY (parent_id) 
        REFERENCES product_categories(id)
);

-- Disable RLS
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Product categories are viewable by everyone" ON public.product_categories;

-- Grant permissions to all roles
GRANT ALL ON public.product_categories TO authenticated, anon, service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Verify table structure
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'product_categories'
    ) THEN
        RAISE EXCEPTION 'Product categories table was not created successfully';
    END IF;
END $$; 