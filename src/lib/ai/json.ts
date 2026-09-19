/**
 * Extract the first JSON object from a model reply, tolerating code fences
 * and stray prose around the object. Used by /api/chat and /api/cases/analyze.
 */
export function extractJsonObject(text: string): unknown {
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in model reply.')
  }
  return JSON.parse(t.slice(start, end + 1))
}
