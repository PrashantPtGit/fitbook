-- hikvision_commands: queue for device validity updates (used by Chakkar gym sync.js)
CREATE TABLE IF NOT EXISTS hikvision_commands (
  id uuid default gen_random_uuid() primary key,
  gym_id uuid references gyms(id),
  member_id uuid references members(id),
  command_type text check (command_type in ('update_validity', 'disable_user', 'enable_user')),
  payload jsonb,
  status text default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
  created_at timestamptz default now(),
  executed_at timestamptz,
  error_message text
);

alter table hikvision_commands enable row level security;

create policy "Auth access" on hikvision_commands
  for all using (auth.role() = 'authenticated');

-- connection_type: 'direct' = Airtel gyms (ISAPI direct), 'sync_js' = Jio/Chakkar gym (queued)
alter table fingerprint_devices
  add column if not exists connection_type text default 'direct'
  check (connection_type in ('direct', 'sync_js'));

-- Set Chakkar gym device to sync_js (update device_name to match your actual device name)
-- Run after confirming device names in your dashboard:
-- UPDATE fingerprint_devices SET connection_type = 'sync_js'
--   WHERE gym_id = (SELECT id FROM gyms WHERE name ILIKE '%chakkar%');
