/**
 * FIX: previously duplicated inline inside api/cases/analyze/route.ts.
 * Now shared so api/chat/route.ts can use the same tolerant parsing for
 * its new structured { sufficient, answer } output (see prompts.ts /
 * chat/route.ts fix notes).
 */

/** Extract the first JSON object from a model reply, tolerating code fences. */
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
