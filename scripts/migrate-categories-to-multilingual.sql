-- Migration script to copy existing title to multilingual fields
-- Run this after the schema has been updated with the new fields

-- Copy title to all three language fields
UPDATE "MenuCategory" 
SET 
  "titleEn" = "title",
  "titleKu" = "title",
  "titleAr" = "title"
WHERE "titleEn" IS NULL OR "titleKu" IS NULL OR "titleAr" IS NULL;

