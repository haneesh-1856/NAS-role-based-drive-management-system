/*
  # Remove Sharing Functionality and Restrict Starred Items

  ## Changes
  1. Remove all shared-related policies from files and folders
  2. Drop shared_items table entirely
  3. Update starred items to be user-specific only
  4. Files starred column can only be set by owner
  5. Folders starred column can only be set by owner

  ## Security
  - Starred items are now strictly per-user (can't see others' starred status)
  - No more sharing between users
  - Cleaner permission model
*/

-- ============================================================================
-- STEP 1: Remove shared-related policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view shared files" ON files;
DROP POLICY IF EXISTS "Users can view shared folders" ON folders;
DROP POLICY IF EXISTS "Shared editors can update files" ON files;
DROP POLICY IF EXISTS "Shared editors can update folders" ON folders;

-- ============================================================================
-- STEP 2: Drop shared_items table
-- ============================================================================

DROP TABLE IF EXISTS shared_items CASCADE;

-- ============================================================================
-- STEP 3: Update files policies - starred is owner-specific
-- ============================================================================

-- Ensure owners can update their starred status
-- (Already exists as "Owners can update own files" policy)

-- ============================================================================
-- STEP 4: Update folders policies - starred is owner-specific
-- ============================================================================

-- Ensure owners can update their starred status
-- (Already exists as "Owners can update own folders" policy)

-- ============================================================================
-- STEP 5: Remove "shared" view from Drive since sharing is removed
-- ============================================================================

-- Note: Frontend will need to hide/remove "Shared with me" option
-- This is handled in the frontend code
