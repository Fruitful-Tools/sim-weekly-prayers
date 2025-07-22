-- Create a function to check if email is allowed to register
CREATE OR REPLACE FUNCTION public.is_email_allowed_for_registration(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow these specific email addresses to register
  RETURN email IN ('schwannden@gmail.com', 'taiwansim@gmail.com');
END;
$$;

-- Create a trigger function to prevent unauthorized signups
CREATE OR REPLACE FUNCTION public.restrict_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the email is allowed
  IF NOT public.is_email_allowed_for_registration(NEW.email) THEN
    RAISE EXCEPTION 'Registration is restricted to authorized administrators only';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users to prevent unauthorized registrations
CREATE TRIGGER restrict_registration_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_user_registration();