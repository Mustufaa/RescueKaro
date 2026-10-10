ALTER TABLE emergency_profiles
  ADD COLUMN age_years SMALLINT CHECK (age_years BETWEEN 0 AND 120);
