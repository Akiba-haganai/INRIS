# 01 — Project Context

## Project Name
**INRIS Passport Guidance & Case Intelligence System**

## Programme
The official challenge describes the INRIS problem as either
**"Passport Guidance and Case Intelligence"** or
**"Indexing and Search for Historical National Registration Card Records."**

This project addresses the first strand: a practical, AI-enabled solution to a
real government operational problem, built by a multidisciplinary student team
over a three-month build-and-test programme.

## Problem Statement
People seeking passport services may need to understand requirements,
procedures, supporting documents and the status or nature of specific cases.
At the same time, personnel handling passport-related cases may need to
organise information, identify case types and access relevant guidance
efficiently.

Our proposed system uses AI to assist with passport-related guidance and case
intelligence through a centralised web interface. It combines structured
official guidance with AI-assisted natural-language interaction and case
analysis.

## Scope of the MVP
The MVP proves two things:

1. **Guidance:** a member of the public can ask a passport-related question in
   plain language, the system retrieves relevant approved guidance, and it
   produces a grounded answer with a visible source.
2. **Case intelligence:** an authorised staff user can create and view a case,
   the system produces a structured AI analysis (type, summary, issues, missing
   information, suggested next step, confidence), and the staff member can
   override or act on that suggestion.

## Guiding Principle
**The AI is an assistant, not an autonomous government decision-maker.**
It never approves, rejects, or makes official determinations. Every AI output
is advisory and reviewable by a human officer.

## Explicit Non-Goals for the MVP
- No real citizen data (synthetic only).
- No autonomous decision-making.
- No production deployment.
- No model training or fine-tuning.
- No mobile application, voice assistant, OCR, facial recognition, blockchain,
  or multilingual model in this iteration.
- No integration with external government systems.

## Success Definition
A demonstrable, mobile-first web application in which:
- A user can ask a passport question and receive a grounded answer with a
  source, or an explicit "insufficient information" refusal.
- A staff user can create, view, classify, and update a case, and see an
  AI-generated structured analysis with confidence and a human-review flag.
- Every AI-assisted action is recorded in an audit log.
