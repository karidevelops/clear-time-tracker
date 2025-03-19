
/**
 * Create the following SQL function in your Supabase SQL editor:
 * 
 * ```sql
 * CREATE OR REPLACE FUNCTION public.get_user_emails()
 * RETURNS TABLE (id uuid, email text) 
 * LANGUAGE plpgsql
 * SECURITY DEFINER
 * SET search_path = public
 * AS $$
 * BEGIN
 *   RETURN QUERY
 *   SELECT au.id, au.email::text
 *   FROM auth.users au;
 * END;
 * $$;
 * ```
 * 
 * This function allows securely retrieving email addresses from auth.users
 * using a security definer function that can be called from the client.
 */
