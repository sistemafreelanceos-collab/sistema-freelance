-- 1. Create the custom type for roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add 'role' column to 'profiles' table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user';

-- 3. Create a policy so only Admins can update roles
-- First, enable RLS if not enabled (usually it is)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can update any profile (to change roles)
DO $$ 
BEGIN
    CREATE POLICY "Admins can update all profiles" 
    ON public.profiles 
    FOR UPDATE 
    USING (
      auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
      )
    );
EXCEPTION 
    WHEN duplicate_object THEN null;
END $$;

-- Note: Ensure existing "Users can update own profile" policy doesn't conflict or allow users to change their own role to admin on client side. 
-- Best practice: Handle role updates via Service Role (Server Actions) or ensure the 'check' clause prevents setting 'admin'.

-- 4. Initial Bootstrap: Set YOUR user as admin (Replace with your specific email or ID if known, or run this manually)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'tu_email@ejemplo.com';
