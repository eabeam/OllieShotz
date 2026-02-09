-- Enforce a single child profile per owner
-- IMPORTANT: Remove/merge duplicates first, or this will fail.

-- Find owners with duplicates:
-- SELECT owner_id, COUNT(*) FROM child_profiles GROUP BY owner_id HAVING COUNT(*) > 1;

ALTER TABLE child_profiles
  ADD CONSTRAINT child_profiles_owner_id_unique UNIQUE (owner_id);
