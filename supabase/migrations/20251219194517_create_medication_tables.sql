/*
  # Medication Tracking System

  ## Overview
  Creates tables for tracking medications and daily check-ins for users.

  ## New Tables
  
  ### `medications`
  - `id` (uuid, primary key) - Unique identifier for each medication
  - `user_id` (uuid, foreign key) - References auth.users, owner of the medication
  - `name` (text) - Name of the medication
  - `created_at` (timestamptz) - When the medication was added
  - `updated_at` (timestamptz) - When the medication was last updated

  ### `medication_logs`
  - `id` (uuid, primary key) - Unique identifier for each log entry
  - `medication_id` (uuid, foreign key) - References medications table
  - `user_id` (uuid, foreign key) - References auth.users
  - `date` (date) - The date for this tracking entry
  - `taken` (boolean) - Whether the medication was taken on this date
  - `created_at` (timestamptz) - When the log was created
  - `updated_at` (timestamptz) - When the log was last updated

  ## Security
  - Enable RLS on both tables
  - Users can only access their own medications and logs
  - Policies for SELECT, INSERT, UPDATE, and DELETE operations
*/

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create medication_logs table
CREATE TABLE IF NOT EXISTS medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  taken boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(medication_id, date)
);

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Medications policies
CREATE POLICY "Users can view own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications"
  ON medications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Medication logs policies
CREATE POLICY "Users can view own medication logs"
  ON medication_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication logs"
  ON medication_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication logs"
  ON medication_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication logs"
  ON medication_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medications_user_id ON medications(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_medication_id ON medication_logs(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_date ON medication_logs(date);