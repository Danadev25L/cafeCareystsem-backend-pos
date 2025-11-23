-- Migration script to copy existing name/description to multilingual fields
-- Run this after the schema has been updated with the new fields

-- Copy name to all three language fields
UPDATE "MenuItem" 
SET 
  "nameEn" = "name",
  "nameKu" = "name",
  "nameAr" = "name"
WHERE "nameEn" IS NULL OR "nameKu" IS NULL OR "nameAr" IS NULL;

-- Copy description to all three language fields (if description exists)
UPDATE "MenuItem" 
SET 
  "descriptionEn" = "description",
  "descriptionKu" = "description",
  "descriptionAr" = "description"
WHERE "description" IS NOT NULL 
  AND ("descriptionEn" IS NULL OR "descriptionKu" IS NULL OR "descriptionAr" IS NULL);

