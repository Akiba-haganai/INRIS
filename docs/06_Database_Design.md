# 06 — Database Design

All tables live in the `public` schema of a Supabase Postgres database.
Schema source of truth: `supabase/migrations/001_initial_schema.sql`
and `002_case_analysis_review.sql`.

## `guidance`
Approved guidance entries used by the assistant and the case analyser.

| Column        | Type          | Notes                                    |
|---------------|---------------|------------------------------------------|
| id            | uuid PK       | default gen_random_uuid()                |
| title         | text          | short title                              |
| category      | text          | one of the FR-03 categories              |
| content       | text          | the body of the guidance                 |
| source        | text          | provenance label                         |
| last_verified | timestamptz   | nullable                                 |
| created_at    | timestamptz   | default now()                            |

Indexes: `guidance_category_idx`, `guidance_search_idx` (GIN on tsvector).
RLS: enabled, with a public read policy.

## `cases`
A passport-related case being handled by staff.

| Column       | Type          | Notes                                              |
|--------------|---------------|----------------------------------------------------|
| id           | uuid PK       | gen_random_uuid()                                  |
| case_number  | text UNIQUE   | generated as `INRIS-#####` by trigger              |
| category     | text          | same vocabulary as guidance categories             |
| description  | text          | synthetic text in the MVP                          |
| status       | text          | open / in_review / resolved / closed (CHECK)       |
| priority     | text          | low / normal / high / urgent (CHECK)               |
| created_at   | timestamptz   | default now()                                      |
| updated_at   | timestamptz   | auto-touched by trigger                            |

Indexes: `cases_status_idx`, `cases_category_idx`.
RLS: enabled, **no anon policy** — server-only access.

## `case_analysis`
One row per AI analysis run. A case may have many analyses; the UI shows the
latest.

| Column                  | Type          | Notes                                        |
|-------------------------|---------------|----------------------------------------------|
| id                      | uuid PK       | gen_random_uuid()                            |
| case_id                 | uuid FK       | → cases.id ON DELETE CASCADE                 |
| summary                 | text          |                                              |
| issues                  | text[]        | default '{}'                                 |
| missing_information     | text[]        | default '{}'                                 |
| suggested_action        | text          |                                              |
| confidence              | numeric(3,2)  | CHECK 0 ≤ confidence ≤ 1                     |
| human_review_required   | boolean       | default true                                 |
| created_at              | timestamptz   | default now()                                |

Index: `case_analysis_case_id_idx`, partial `case_analysis_review_idx`.
RLS: enabled, no anon policy.

## `audit_logs`
Append-only record of important AI-assisted actions.

| Column     | Type        | Notes                                            |
|------------|-------------|--------------------------------------------------|
| id         | uuid PK     | gen_random_uuid()                                |
| user_id    | uuid NULL   | reserved for later auth                          |
| case_id    | uuid NULL   | FK → cases.id ON DELETE SET NULL                 |
| action     | text        | `case.create`, `case.analyze`, `case.update`     |
| details    | jsonb       | free-form; contains before/after, model, etc.    |
| created_at | timestamptz | default now()                                    |

Index: `audit_logs_case_id_idx`.
RLS: enabled, no anon policy.

## Triggers
- `trg_set_case_number` — populates `case_number` from `case_number_seq` on
  insert.
- `trg_cases_updated_at` — refreshes `cases.updated_at` on update.

## Not Yet Built (deliberate)
- `users` table — MVP has no auth; the `user_id` column exists for future use.
- Embeddings/pgvector — deferred until after the MVP is validated.
- Case documents — no file upload in MVP.
