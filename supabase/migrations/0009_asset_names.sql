-- 0009_asset_names.sql: User-assignable asset display names

-- Every asset now has a stable, human-readable display name. Generated names are
-- kind-prefixed per-project sequences (img_1, vid_1, asset_1, ...). The storage
-- object name stays internal (`original.<ext>`); ``name`` is what users see and
-- can rename in the asset viewer.

-- 1. Add the name column ------------------------------------------------------
alter table public.assets
  add column if not exists name text;

-- 2. Backfill existing assets with distinct, unified names ---------------------
-- Kind prefix per asset kind, then a per-project sequence ordered by creation.
update public.assets as a
set name = s.prefix || '_' || s.seq::text
from (
  select
    id,
    case kind
      when 'image' then 'img'
      when 'video' then 'vid'
      else 'asset'
    end as prefix,
    row_number() over (
      partition by project_id, kind
      order by created_at asc, id asc
    ) as seq
  from public.assets
  where name is null
) as s
where a.id = s.id;

-- 3. Make it mandatory going forward ------------------------------------------
alter table public.assets
  alter column name set not null;

-- 4. Keep names distinct within a project + kind ------------------------------
create unique index if not exists idx_assets_project_kind_name
  on public.assets (project_id, kind, name)
  where deleted_at is null;

-- 5. Editors can rename any asset in their workspace (not just uploads) --------
drop policy if exists asset_update on public.assets;
create policy asset_update on public.assets
  for update
  using (
    is_member(workspace_id, 'editor')
  )
  with check (
    is_member(workspace_id, 'editor')
  );
