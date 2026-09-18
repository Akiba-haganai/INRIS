import { z } from 'zod'

export const CASE_CATEGORIES = [
  'New Application',
  'Renewal',
  'Lost Passport',
  'Damaged Passport',
  'Replacement',
  'Supporting Documents',
  'Application Procedures',
  'Collection',
  'Other',
] as const

export const CASE_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export const CASE_STATUSES = ['open', 'in_review', 'resolved', 'closed'] as const

export const caseCreateSchema = z.object({
  category: z.enum([CASE_CATEGORIES[0], ...CASE_CATEGORIES.slice(1)]),
  description: z.string().min(10),
  priority: z.enum([CASE_PRIORITIES[0], ...CASE_PRIORITIES.slice(1)]).optional().default('normal'),
})

export const caseUpdateSchema = z.object({
  status: z.enum([CASE_STATUSES[0], ...CASE_STATUSES.slice(1)]),
})

export const caseAnalysisOutputSchema = z.object({
  case_type: z.string(),
  summary: z.string(),
  key_issues: z.array(z.string()),
  missing_information: z.array(z.string()),
  relevant_guidance: z.array(z.string()),
  suggested_next_step: z.string(),
  human_review_required: z.boolean(),
  confidence: z.number().min(0).max(1),
})

export type CaseAnalysisOutput = z.infer<typeof caseAnalysisOutputSchema>

export const chatRequestSchema = z.object({
  question: z.string(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional().default([]),
})
