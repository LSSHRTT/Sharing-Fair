-- Migration: create clients table
-- Created: 2026-06-30

CREATE TABLE IF NOT EXISTS clients (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code   TEXT,
  city          TEXT,
  country       TEXT DEFAULT 'France',
  birth_date    TEXT,
  preferences   TEXT,
  tags          TEXT NOT NULL DEFAULT '[]',
  notes         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_last_name  ON clients(last_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_clients_email      ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
