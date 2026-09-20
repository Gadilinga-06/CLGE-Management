-- Add degree_type to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS degree_type VARCHAR(50);
