-- Allow password to be nullable for OAuth users
ALTER TABLE public.users
ALTER COLUMN password DROP NOT NULL;

-- Add oauth_provider and oauth_id columns to track OAuth connections
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS oauth_provider text,
ADD COLUMN IF NOT EXISTS oauth_id text;

-- Create unique constraint for oauth connections
ALTER TABLE public.users
ADD CONSTRAINT oauth_provider_id_unique UNIQUE (oauth_provider, oauth_id);

-- Add index for oauth lookups
CREATE INDEX IF NOT EXISTS idx_users_oauth_provider_id
ON public.users(oauth_provider, oauth_id);
