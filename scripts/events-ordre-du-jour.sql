-- ============================================================
-- Événements — « Futurs ventes, août à décembre 2026 »
-- (ordre du jour de la réunion du 3 juillet 2026 — retranscription fidèle)
--
-- ⚠️ À exécuter UNE SEULE FOIS par environnement (les doublons ne sont pas
--    dédupliqués) :
--      local      : npm run events:seed:local
--      production : npm run events:seed:prod
--
-- Colonnes : title, start_date, end_date, hours, volunteers_text, contact, notes
-- ============================================================

INSERT INTO events (title, start_date, end_date, hours, volunteers_text, contact, notes, created_at, updated_at) VALUES
  -- ---------- AOÛT 2026 ----------
  ('Béhuard',                        '2026-08-15', '2026-08-15', NULL,             'Marta, Michelle, Geneviève B., Béatrice', 'Marta',  'réserver le véhicule 9 places',                        '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),

  -- ---------- SEPTEMBRE 2026 ----------
  ('Vente du mois',                  '2026-09-12', '2026-09-12', '14h à 17h30',   NULL,                                      NULL,     '2ème samedi du mois',                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Vente du mois',                  '2026-09-26', '2026-09-26', '14h à 17h30',   NULL,                                      NULL,     '4ème samedi du mois',                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),

  -- ---------- OCTOBRE 2026 ----------
  ('Vente du mois',                  '2026-10-10', '2026-10-10', '14h à 17h30',   NULL,                                      NULL,     '2ème samedi du mois',                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Cormelles le Royal (paroisse)',  '2026-10-23', '2026-10-25', NULL,             'MD - BT - MB - GB',                        'Emmanuelle (pers. contact : Emeline Guérard)', 'réserver le véhicule RENAULT 9 PLACES', '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Vente du mois',                  '2026-10-24', '2026-10-24', '14h à 17h30',   'Cathia, Sonia, Jacqueline',                 NULL,     '4ème samedi du mois',                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),

  -- ---------- NOVEMBRE 2026 ----------
  ('Maisons-Alfort (paroisse)',      '2026-11-13', '2026-11-15', NULL,             'MD - BT - GB - MB',                        'Emmanuelle / Sr Christiane Chautard (doit confirmer)', 'réserver le véhicule RENAULT 9 PLACES', '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Vente du mois',                  '2026-11-14', '2026-11-14', '14h à 17h30',   'Sonia, Jacqueline',                         NULL,     '2ème samedi du mois',                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Château Plessis-Bourré',         '2026-11-28', '2026-11-29', NULL,             'MD - BT - MB',                             'Marta',  'Reçu mail de relance, date à confirmer. réserver le véhicule', '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Roubaix',                        '2026-11-28', '2026-11-29', NULL,             'Cathia, Sonia, Jacqueline (départ vendredi soir)', 'Emmanuelle (contact Sr Colette)', 'réserver le véhicule RENAULT 9 places', '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-11-27', '2026-11-29', '14h à 18h',     'MD - BT - MB',                             NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),

  -- ---------- DÉCEMBRE 2026 ----------
  ('EHPAD',                          '2026-12-04', '2026-12-04', 'après-midi',    'Geneviève M., Béatrice',                    'Geneviève M.', 'réserver le véhicule - KANGOO',                '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('EHPAD',                          '2026-12-05', '2026-12-05', 'toute la journée', 'Geneviève M., Béatrice',                 'Geneviève M.', 'réserver le véhicule - KANGOO',                '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Centre St Jean (Noël)',          '2026-12-04', '2026-12-04', 'après-midi',    'Cathia, Michelle, Marta',                   'Marta — confirmation + attente feuille inscription', 'réserver le véhicule RENAULT 9 places', '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Centre St Jean (Noël)',          '2026-12-05', '2026-12-05', 'toute la journée', 'Cathia, Michelle, Marta',                'Marta — confirmation + attente feuille inscription', 'réserver le véhicule RENAULT 9 places', '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-04', '2026-12-04', '14h à 18h',     'Geneviève B., Jacqueline',                  NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-05', '2026-12-05', '14h à 18h',     'Geneviève B., Jacqueline, Sonia',           NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-06', '2026-12-06', '14h à 18h',     'Marta, Cathia',                             NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-11', '2026-12-11', '14h à 18h',     'Cathia, GM - MD',                           NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-12', '2026-12-12', '14h à 18h',     'Sonia',                                     NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Montreuil-Juigné (Noël)',        '2026-12-12', '2026-12-12', NULL,             'Michelle, Cathia, Jacqueline',             'Michelle', 'réserver le véhicule - KANGOO',                   '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-13', '2026-12-13', '14h à 18h',     'Sonia',                                     NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-18', '2026-12-18', '14h à 18h',     'Marta, Cathia',                             NULL,     NULL,                                                  '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),
  ('Crèches de Noël',                '2026-12-19', '2026-12-20', '14h à 18h',     NULL,                                      NULL,     'Bénévoles à confirmer',                                '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z'),

  -- ---------- MAI 2027 ----------
  ('Chevilly-Larue (paroisse)',      '2027-05-21', '2027-05-23', NULL,             'MD - BT - GB - MB',                        'Emmanuelle - Sr Gloria (informer des dates retenues)', 'réserver le véhicule RENAULT 9 places', '2026-08-20T19:00:00Z', '2026-08-20T19:00:00Z');
