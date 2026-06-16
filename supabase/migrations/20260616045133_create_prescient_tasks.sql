-- prescient_tasks: system/user-flagged tasks surfaced on the CIC Intelligence Tab.
-- Written to the OpenBrain Supabase project so it lives alongside
-- the wiki knowledge base rather than in CIC's local SQLite. The nightly kanban check
-- (server/kanbanCheck.js) upserts system-flagged rows here.

CREATE TABLE IF NOT EXISTS prescient_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  detail text,
  area text,                           -- e.g. 'github', 'projects', 'finance'
  status text NOT NULL DEFAULT 'open', -- open | in_progress | stalled | done
  priority text NOT NULL DEFAULT 'P3', -- P1 | P2 | P3
  source_ids text[] DEFAULT '{}',
  kanban_stage text,                   -- where it currently sits on the board
  expected_stage text,                 -- where it SHOULD be
  flagged_by text DEFAULT 'system',    -- 'system' or 'user'
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prescient_tasks_status_idx ON prescient_tasks(status);
CREATE INDEX IF NOT EXISTS prescient_tasks_priority_idx ON prescient_tasks(priority);

-- Keep updated_at fresh on every UPDATE (reuses the shared trigger helper).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prescient_tasks_set_updated_at ON prescient_tasks;
CREATE TRIGGER prescient_tasks_set_updated_at
  BEFORE UPDATE ON prescient_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS on with no policies: only the service/secret key (server-side) can read or write,
-- matching the other OpenBrain tables. CIC talks to this table with the secret key.
ALTER TABLE prescient_tasks ENABLE ROW LEVEL SECURITY;
