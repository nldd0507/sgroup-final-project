ALTER TABLE assignments ADD COLUMN maximum_score INT NOT NULL DEFAULT 10;
ALTER TABLE assignments ADD CONSTRAINT chk_assignment_max_score CHECK (maximum_score > 0);
ALTER TABLE submissions ADD COLUMN score INT NULL;
ALTER TABLE submissions ADD CONSTRAINT chk_submission_score CHECK (score IS NULL OR score >= 0);