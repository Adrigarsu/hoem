-- Profile photos (FR-ACC-007). A private bucket, read through short-lived signed URLs. The server
-- re-encodes every photo to a small WebP without metadata, so the bucket refuses anything else.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/webp']);

-- Whether the signed-in user shares a household with this user. Takes the folder name as text,
-- because a policy may evaluate it on any object name, and a uuid cast would fail on some of them.
-- Security definer so it reads other people's memberships without going through their policies.
create function private.shares_household_with(other_user text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as mine
    join public.memberships as theirs on theirs.household_id = mine.household_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id::text = other_user
  );
$$;

revoke execute on function private.shares_household_with(text) from public, anon;
grant execute on function private.shares_household_with(text) to authenticated;

-- A file's folder is its owner's id. The owner is named apart from the household check, so a user
-- without any household still sees their own photo.
create policy "avatars_select_own_or_household" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.shares_household_with((storage.foldername(name))[1])
    )
  );

create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Photos are never updated in place: each upload is a new file. The check on the column keeps the
-- pointer inside the user's own folder.
grant update (avatar_path) on public.profiles to authenticated;
