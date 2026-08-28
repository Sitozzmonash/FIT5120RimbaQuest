-- Apply once to the production Supabase PostgreSQL database before or with the
-- matching backend deployment. It is idempotent and preserves user history.
BEGIN;

ALTER TABLE species ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- A child may have unlocked both duplicate and canonical cards. Preserve the
-- canonical card and discard only the redundant duplicate card.
DELETE FROM collection_entries AS retired
USING collection_entries AS canonical
WHERE retired.child_id = canonical.child_id
  AND (
    (retired.species_id = 'sp_collared_mongoose_2' AND canonical.species_id = 'sp_collared_mongoose')
    OR (retired.species_id = 'sp_short_tailed_mongoose_2' AND canonical.species_id = 'sp_short_tailed_mongoose')
  );

UPDATE collection_entries
SET species_id = CASE species_id
    WHEN 'sp_collared_mongoose_2' THEN 'sp_collared_mongoose'
    WHEN 'sp_short_tailed_mongoose_2' THEN 'sp_short_tailed_mongoose'
END
WHERE species_id IN ('sp_collared_mongoose_2', 'sp_short_tailed_mongoose_2');

UPDATE sightings
SET species_id = CASE species_id
    WHEN 'sp_collared_mongoose_2' THEN 'sp_collared_mongoose'
    WHEN 'sp_short_tailed_mongoose_2' THEN 'sp_short_tailed_mongoose'
END
WHERE species_id IN ('sp_collared_mongoose_2', 'sp_short_tailed_mongoose_2');

-- Related quiz and reference-image rows cascade. At this point no child data
-- can reference these two duplicate catalogue IDs.
DELETE FROM species
WHERE id IN ('sp_collared_mongoose_2', 'sp_short_tailed_mongoose_2');

-- Preserve any existing historical discovery of this invalid catalogue record,
-- but never make it available for new discovery or progress calculations.
UPDATE species SET is_active = FALSE WHERE id = 'sp_black_crowned_pitta_2';

COMMIT;
