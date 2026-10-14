-- roles
CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- state settings (singleton)
CREATE TABLE public.state_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_number integer NOT NULL DEFAULT 3496,
  display_name text NOT NULL DEFAULT 'State 3496',
  tagline text,
  discord_url text,
  launch_date date,
  transfer_group text,
  eligibility_range text,
  recruiting_status text,
  transfer_spots integer,
  power_cap_note text,
  current_event text,
  next_event_date timestamptz,
  timezone text NOT NULL DEFAULT 'UTC',
  hero_generation text,
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  disclaimer text NOT NULL DEFAULT 'Unofficial fan community. Not affiliated with the game publisher.',
  hero_image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.state_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.state_settings TO authenticated;
GRANT ALL ON public.state_settings TO service_role;
ALTER TABLE public.state_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.state_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins write settings" ON public.state_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER state_settings_touch BEFORE UPDATE ON public.state_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.state_settings (tagline, recruiting_status) VALUES ('Placeholder tagline — not yet supplied', 'Unknown');

-- announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  pinned boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- alliances
CREATE TABLE public.alliances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  tag text NOT NULL,
  name text NOT NULL,
  power bigint NOT NULL DEFAULT 0,
  open_spots integer NOT NULL DEFAULT 0,
  recruiting_status text NOT NULL DEFAULT 'Unknown',
  playstyle text,
  timezone_label text,
  short_description text,
  description text,
  banner_url text,
  discord_url text,
  hq_coordinates text,
  svs_contribution text,
  sort_rank integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.alliance_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id uuid NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  name text NOT NULL,
  rank_title text NOT NULL DEFAULT 'R4',
  discord_handle text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.alliance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alliance_id uuid NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  name text NOT NULL,
  utc_time text,
  days text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0
);

-- governance
CREATE TABLE public.governance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'State Governance',
  version text NOT NULL DEFAULT '0.1',
  effective_date date,
  revised_date date,
  status text NOT NULL DEFAULT 'draft',
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.governance_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.governance_documents(id) ON DELETE CASCADE,
  anchor text NOT NULL,
  title text NOT NULL,
  body text,
  sort_order integer NOT NULL DEFAULT 0
);

-- transfers
CREATE TABLE public.transfer_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  phase text,
  starts_at timestamptz,
  ends_at timestamptz,
  eligibility_range text,
  open_spots integer,
  power_cap_note text,
  notes text,
  transfer_type text NOT NULL DEFAULT 'ordinary',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transfer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  states integer[] NOT NULL DEFAULT '{}',
  window_label text,
  notes text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transfer_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  action_kind text NOT NULL DEFAULT 'reversible',
  risk_note text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- timeline
CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Events',
  event_date date,
  server_day integer,
  source_url text,
  image_url text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- svs
CREATE TABLE public.svs_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  opponent text NOT NULL,
  event_date date,
  prep_result text,
  battle_result text,
  prep_score bigint,
  opponent_prep_score bigint,
  battle_score bigint,
  opponent_battle_score bigint,
  story_title text,
  story_intro text,
  story_body text,
  image_url text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.svs_story_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.svs_cycles(id) ON DELETE CASCADE,
  label text NOT NULL,
  our_value numeric,
  opponent_value numeric,
  metric_kind text NOT NULL DEFAULT 'timeline',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.state_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text,
  body text,
  image_url text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.operations_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL DEFAULT 'roles',
  title text NOT NULL,
  body text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text,
  handle text,
  content_type text,
  url text,
  avatar_url text,
  bio text,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  storage_path text,
  kind text NOT NULL DEFAULT 'image',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- grants + RLS for content tables
DO $$
DECLARE t text;
DECLARE pubtables text[] := ARRAY['announcements','alliances','transfer_windows','transfer_groups','transfer_guides','timeline_events','svs_cycles','state_stories','operations_content','creators'];
DECLARE childtables text[] := ARRAY['alliance_leaders','alliance_events','governance_sections','svs_story_metrics','media_assets','governance_documents'];
BEGIN
  FOREACH t IN ARRAY pubtables || childtables LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "staff read all" ON public.%I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "staff insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "staff update" ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
    EXECUTE format('CREATE POLICY "admin delete" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(),''admin''))', t);
  END LOOP;

  FOREACH t IN ARRAY pubtables LOOP
    EXECUTE format('CREATE POLICY "public read published" ON public.%I FOR SELECT TO anon, authenticated USING (published = true)', t);
  END LOOP;
END $$;

CREATE POLICY "public read published docs" ON public.governance_documents FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "public read published sections" ON public.governance_sections FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.governance_documents d WHERE d.id = document_id AND d.status = 'published'));
CREATE POLICY "public read alliance leaders" ON public.alliance_leaders FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.alliances a WHERE a.id = alliance_id AND a.published));
CREATE POLICY "public read alliance events" ON public.alliance_events FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.alliances a WHERE a.id = alliance_id AND a.published));
CREATE POLICY "public read svs metrics" ON public.svs_story_metrics FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.svs_cycles c WHERE c.id = cycle_id AND c.published));
CREATE POLICY "public read media" ON public.media_assets FOR SELECT TO anon, authenticated USING (true);

-- updated_at triggers
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['announcements','alliances','governance_documents','transfer_windows','transfer_groups','transfer_guides','timeline_events','svs_cycles','state_stories','operations_content','creators'] LOOP
    EXECUTE format('CREATE TRIGGER %I_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

-- new users get a profile; first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();