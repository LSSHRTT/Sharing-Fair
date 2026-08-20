-- Migration: abonnements Web Push (notifications sur le téléphone)
-- Created: 2026-08-20
--
-- Chaque ligne = un appareil abonné d'un bénévole (endpoint + clés push
-- du navigateur). Un bénévole peut avoir plusieurs appareils.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  volunteer_id INTEGER NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL UNIQUE, -- URL du service push (FCM, Apple, Mozilla…)
  p256dh       TEXT NOT NULL,        -- clé publique du navigateur (payloads chiffrés ultérieurs)
  auth         TEXT NOT NULL,        -- secret d'authentification du navigateur
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_volunteer ON push_subscriptions(volunteer_id);
