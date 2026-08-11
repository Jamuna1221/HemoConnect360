-- HemoConnect360 - Admin Verification of Blood Banks
-- Run this in the Supabase SQL Editor.
--
-- Creates a SECURITY DEFINER function that allows the admin backend process
-- (using the service-role client) to verify a blood bank by temporarily
-- disabling the verification-state guard trigger.

CREATE OR REPLACE FUNCTION public.admin_verify_blood_bank(
  p_bank_id uuid,
  p_status text,
  p_notes text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disable the verify guard trigger temporarily
  ALTER TABLE public.blood_banks DISABLE TRIGGER blood_banks_verify_guard;
  
  -- Update the verification details
  UPDATE public.blood_banks
  SET 
    verification_status = p_status,
    verification_notes = p_notes,
    verified_at = now()
  WHERE id = p_bank_id;
  
  -- Re-enable the verify guard trigger
  ALTER TABLE public.blood_banks ENABLE TRIGGER blood_banks_verify_guard;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_blood_bank(uuid, text, text) TO service_role;
