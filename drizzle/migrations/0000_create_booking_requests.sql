CREATE TABLE public.booking_requests (
 id uuid PRIMARY KEY,
 submission_key uuid NOT NULL UNIQUE,
 experience_id text NOT NULL CHECK (length(experience_id) BETWEEN 1 AND 100),
 customer_name text NOT NULL CHECK (length(customer_name) BETWEEN 2 AND 100),
 contact_number text NOT NULL CHECK (contact_number ~ '^\+[0-9 ()-]{7,24}$'),
 email text CHECK (email IS NULL OR length(email) <= 255),
 preferred_date date NOT NULL,
 participant_count integer NOT NULL CHECK (participant_count BETWEEN 1 AND 200),
 preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','ar')),
 special_requirements text CHECK (special_requirements IS NULL OR length(special_requirements) <= 2000),
 additional_notes text CHECK (additional_notes IS NULL OR length(additional_notes) <= 2000),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','confirmed','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT (id, submission_key, experience_id, customer_name, contact_number, email, preferred_date, participant_count, preferred_language, special_requirements, additional_notes) ON public.booking_requests TO anon, authenticated;
GRANT ALL ON public.booking_requests TO service_role;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors submit pending inquiries only" ON public.booking_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE FUNCTION public.validate_booking_date() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN IF NEW.preferred_date < (now() AT TIME ZONE 'Asia/Muscat')::date THEN RAISE EXCEPTION 'Preferred date must not be in the past'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER booking_date_validation BEFORE INSERT ON public.booking_requests FOR EACH ROW EXECUTE FUNCTION public.validate_booking_date();
CREATE INDEX booking_requests_status_created_idx ON public.booking_requests (status, created_at DESC);