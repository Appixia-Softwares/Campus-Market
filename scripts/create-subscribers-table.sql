-- Create subscribers table for email notifications
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source VARCHAR(50) DEFAULT 'landing_page' CHECK (source IN ('countdown_banner', 'countdown_modal', 'landing_page')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(source);

-- Enable Row Level Security (RLS)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for checking subscriptions
CREATE POLICY "Allow public read access for subscription checks" ON subscribers
  FOR SELECT USING (true);

-- Create policy to allow public insert for new subscriptions
CREATE POLICY "Allow public insert for new subscriptions" ON subscribers
  FOR INSERT WITH CHECK (true);

-- Create policy to allow public update for subscription status changes
CREATE POLICY "Allow public update for subscription status" ON subscribers
  FOR UPDATE USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscribers_updated_at 
  BEFORE UPDATE ON subscribers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
