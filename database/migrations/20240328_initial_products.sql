-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.products
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Enable update for product owners" ON public.products
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Enable delete for product owners" ON public.products
    FOR DELETE
    TO authenticated
    USING (auth.uid() = seller_id);

-- Grant necessary permissions
GRANT ALL ON public.products TO authenticated; 