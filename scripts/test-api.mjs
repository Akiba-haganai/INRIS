// Run with: node scripts/test-api.mjs
// Make sure `npm run dev` is running in another terminal first.

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

let passed = 0
let failed = 0

function ok(label, detail = '') {
  passed++
  console.log(`${green('✓')} ${label}${detail ? ' ' + dim(detail) : ''}`)
}
function fail(label, detail = '') {
  failed++
  console.log(`${red('✗')} ${label}${detail ? ' ' + dim(detail) : ''}`)
}
function section(title) {
  console.log(`\n${yellow('── ' + title + ' ' + '─'.repeat(Math.max(0, 50 - title.length)))}`)
}

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try { json = await res.json() } catch {}
  return { status: res.status, json }
}

async function run() {
  console.log(`Testing INRIS MVP API at ${BASE}`)

  // ---------- 1. chat: grounded answer ----------
  section('1. Chat — grounded question')
  {
    const { status, json } = await call('POST', '/api/chat', {
      question: 'I lost my passport, what should I do?',
      history: [],
    })
    if (status !== 200) fail('POST /api/chat returned non-200', `status=${status}`)
    else if (!json?.answer) fail('No answer field in response')
    else if (!json.grounded) fail('Expected grounded=true', `answer="${json.answer?.slice(0, 80)}"`)
    else if (!Array.isArray(json.sources) || json.sources.length === 0)
      fail('No sources returned for a grounded answer')
    else {
      ok('Grounded chat response', `${json.sources.length} sources`)
      console.log(dim('  → ' + json.answer.split('\n')[0].slice(0, 100)))
      console.log(dim('  → first source: ' + json.sources[0].title))
    }
  }

  // ---------- 2. chat: refusal path ----------
  section('2. Chat — refusal path (must not hallucinate)')
  {
    const { status, json } = await call('POST', '/api/chat', {
      question: 'How do I apply for a diplomatic visa for Mars?',
      history: [],
    })
    if (status !== 200) fail('POST /api/chat returned non-200', `status=${status}`)
    else if (json.grounded !== false) fail('Expected grounded=false', `grounded=${json.grounded}`)
    else if (json.sources?.length) fail('Sources should be empty on refusal')
    else {
      ok('Refusal path works', 'no sources, grounded=false')
      console.log(dim('  → ' + (json.answer || '').slice(0, 100)))
    }
  }

  // ---------- 3. create a case ----------
  section('3. Create case')
  let caseId = null
  {
    const { status, json } = await call('POST', '/api/cases', {
      category: 'Lost Passport',
      description:
        'Applicant reports passport lost while travelling. Has a police report reference but has not yet notified INRIS. Unclear whether previous passport details are required.',
      priority: 'high',
    })
    if (status !== 201) fail('POST /api/cases returned non-201', `status=${status}`)
    else if (!json?.case?.id) fail('No case id returned')
    else if (!/^INRIS-\d{5}$/.test(json.case.case_number || ''))
      fail('Unexpected case_number format', json.case.case_number)
    else {
      caseId = json.case.id
      ok('Case created', `${json.case.case_number} (${caseId.slice(0, 8)}…)`)
    }
  }

  if (!caseId) {
    console.log(red('\nCannot continue without a case id. Stopping.'))
    return summary()
  }

  // ---------- 4. list cases ----------
  section('4. List cases')
  {
    const { status, json } = await call('GET', '/api/cases')
    if (status !== 200) fail('GET /api/cases returned non-200', `status=${status}`)
    else if (!Array.isArray(json?.cases)) fail('cases is not an array')
    else ok('Cases listed', `${json.cases.length} case(s)`)
  }

  // ---------- 5. get single case ----------
  section('5. Get case by id')
  {
    const { status, json } = await call('GET', `/api/cases/${caseId}`)
    if (status !== 200) fail('GET /api/cases/:id returned non-200', `status=${status}`)
    else if (json?.case?.id !== caseId) fail('Returned wrong case')
    else ok('Case fetched', json.case.case_number)
  }

  // ---------- 6. analyze case ----------
  section('6. AI case analysis')
  {
    const { status, json } = await call('POST', '/api/cases/analyze', { case_id: caseId })
    if (status !== 200) {
      fail('POST /api/cases/analyze returned non-200', `status=${status}`)
      if (json?.message) console.log(dim('  → ' + json.message))
    } else if (!json?.analysis) fail('No analysis in response')
    else {
      const a = json.analysis
      ok('Analysis saved', `confidence=${a.confidence}`)
      console.log(dim(`  → summary: ${a.summary?.slice(0, 110)}`))
      console.log(dim(`  → missing info: ${(a.missing_information || []).join('; ') || 'none'}`))
      console.log(dim(`  → suggested: ${a.suggested_action?.slice(0, 110)}`))
      console.log(dim(`  → human_review_required: ${a.human_review_required}`))
      console.log(dim(`  → guidance used: ${(json.guidance || []).map(g => g.title).join(' | ')}`))
    }
  }

  // ---------- 7. update case ----------
  section('7. Update case status')
  {
    const { status, json } = await call('PATCH', `/api/cases/${caseId}`, {
      status: 'in_review',
    })
    if (status !== 200) fail('PATCH /api/cases/:id returned non-200', `status=${status}`)
    else if (json?.case?.status !== 'in_review') fail('Status not updated', json?.case?.status)
    else ok('Status updated → in_review')
  }

  // ---------- 8. stats ----------
  section('8. Case stats')
  {
    const { status, json } = await call('GET', '/api/cases/stats')
    if (status !== 200) fail('GET /api/cases/stats returned non-200', `status=${status}`)
    else {
      ok('Stats loaded',
        `total=${json.total} open=${json.open} resolved=${json.resolved} needs_review=${json.needs_review}`)
      if (json.by_category?.length)
        console.log(dim(`  → top category: ${json.by_category[0].category} (${json.by_category[0].count})`))
    }
  }

  // ---------- 9. validation guards ----------
  section('9. Validation guards (should be rejected)')
  {
    const { status } = await call('POST', '/api/cases', {
      category: 'NotARealCategory',
      description: 'x',
    })
    if (status === 400) ok('Bad category rejected (400)')
    else fail('Bad category should be 400', `got ${status}`)
  }
  {
    const { status } = await call('POST', '/api/cases/analyze', { case_id: 'not-a-uuid' })
    if (status === 400) ok('Bad case_id rejected (400)')
    else fail('Bad case_id should be 400', `got ${status}`)
  }
  {
    const { status } = await call('GET', '/api/cases/00000000-0000-0000-0000-000000000000')
    if (status === 404) ok('Missing case → 404')
    else fail('Missing case should be 404', `got ${status}`)
  }

  summary()
}

function summary() {
  console.log(`\n${'─'.repeat(55)}`)
  if (failed === 0) {
    console.log(green(`ALL TESTS PASSED  (${passed} passed)`))
  } else {
    console.log(yellow(`Results: ${passed} passed, ${failed} failed`))
  }
  console.log(`${'─'.repeat(55)}\n`)
  console.log('Now check the audit trail in Supabase SQL Editor with:')
  console.log(dim('  select action, case_id, details, created_at'))
  console.log(dim('  from public.audit_logs order by created_at desc limit 10;'))
}

run().catch((err) => {
  console.error(red('Test script crashed:'), err)
  process.exit(1)
})