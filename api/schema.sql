DROP TABLE IF EXISTS activities;

CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  cards TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_name, updated_at DESC);
