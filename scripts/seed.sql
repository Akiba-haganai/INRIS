-- =========================================================
-- seed.sql
--
-- FIX: this file was present in the repo but EMPTY. README.md and
-- DEBUG_CHECKLIST.md both instruct running it to populate the
-- `guidance` table -- there was nothing to run. This is synthetic,
-- clearly-labelled demo material only (see docs/01, C-01, C-04),
-- pending authoritative INRIS content. Run after 001 and 002.
-- =========================================================

insert into public.guidance (title, category, content, source, last_verified) values
(
  'New Passport — Required Documents',
  'New Application',
  'A first-time applicant for a Zambian passport should generally provide: (1) a completed application form, (2) a certified copy of their National Registration Card (NRC), (3) two recent passport-sized photographs meeting the standard specification, and (4) proof of payment of the applicable fee. Minors require the additional consent of a parent or guardian and a birth certificate. Applicants should bring original documents for verification alongside copies.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'New Passport — Where to Apply',
  'New Application',
  'New passport applications are lodged in person at an INRIS registration office. Appointments may be required depending on the office. Applicants should confirm current opening hours and any appointment requirements with their nearest office before travelling.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Passport Renewal — Eligibility and Documents',
  'Renewal',
  'A passport nearing expiry, or recently expired, can generally be renewed by submitting a completed renewal form together with the existing passport, a valid NRC, two recent passport photographs, and payment of the renewal fee. Renewal is typically not available if the existing passport was reported lost, stolen or damaged — those situations are handled as a replacement instead.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Passport Renewal — Processing Expectations',
  'Renewal',
  'Renewal applications are processed in the order received. Applicants should retain their acknowledgement/receipt slip, which is required to track or collect the completed passport. Processing times vary by office and season; applicants are encouraged to apply well ahead of planned travel.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Lost Passport — What To Do',
  'Lost Passport',
  'If a passport is lost, the holder should first report the loss to the nearest police station and obtain a police report/reference number. This report should then be presented to INRIS along with a completed loss-report form, a valid NRC, two recent photographs, and payment of the applicable replacement fee. A previously reported lost passport that is later found should also be reported and surrendered to INRIS, as it may have been cancelled.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Damaged Passport — What To Do',
  'Damaged Passport',
  'A passport that is torn, water-damaged, or otherwise significantly deteriorated should be brought to an INRIS office along with a completed replacement form, a valid NRC, two recent photographs, and payment of the applicable fee. The damaged passport itself should be surrendered as part of the application.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Passport Replacement — General Process',
  'Replacement',
  'Replacement of a lost, stolen or damaged passport follows a broadly similar process to a new application, but requires the relevant loss/damage documentation in addition to the standard requirements (form, NRC, photographs, fee). Applicants should expect replacement processing to take at least as long as a standard new application.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Supporting Documents — Photographs',
  'Supporting Documents',
  'Passport photographs should be recent (normally within the last six months), taken against a plain light-coloured background, showing a full front view of the face with a neutral expression and no head covering (except for religious purposes, subject to the face remaining fully visible). Photographs that do not meet the specification may delay processing.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Supporting Documents — Proof of Identity',
  'Supporting Documents',
  'A valid National Registration Card (NRC) is the primary form of identity document required for most passport transactions. Where an applicant does not currently hold an NRC, they should first resolve that with the relevant registration office before applying for a passport, as the passport application generally cannot proceed without it.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Application Procedures — Fees and Payment',
  'Application Procedures',
  'Passport fees vary depending on the type of application (new, renewal, replacement) and any expedited processing option selected. Payment is typically made at the point of application or via an approved payment channel, and applicants should retain their proof of payment as it may be required at collection.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Application Procedures — Tracking an Application',
  'Application Procedures',
  'Applicants can generally track the status of their application using the reference number issued on their acknowledgement/receipt slip at the time of submission. This reference should be kept safe, as it may also be needed to query delays or resolve issues with an office.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
),
(
  'Collection — Collecting a Completed Passport',
  'Collection',
  'A completed passport is normally collected in person from the office where the application was submitted, by presenting the acknowledgement/receipt slip and a valid form of identification. Collection by a third party on the applicant''s behalf may require additional authorisation — applicants should confirm this with their local office in advance.',
  'DEMO — synthetic guidance pending authoritative INRIS material',
  now()
);
