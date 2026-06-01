-- Add title column to trainers table
-- Run this in Supabase SQL editor: https://supabase.com/dashboard/project/_/sql
ALTER TABLE trainers ADD COLUMN IF NOT EXISTS title text DEFAULT '';
