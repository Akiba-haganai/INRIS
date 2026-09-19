'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardBody } from '@/components/ui/Card'
import { ChatMessage, type ChatTurn } from './ChatMessage'
import { ArrowUp, Loader2 } from 'lucide-react'

const SUGGESTIONS = [
  { label: 'New Passport', q: 'What documents do I need for a new passport application?' },
  { label: 'Renewal', q: 'How do I renew my passport?' },
  { label: 'Lost Passport', q: 'I lost my passport. What should I do?' },
  { label: 'Replacement', q: 'My passport is damaged. How do I get a replacement?' },
  { label: 'Documents', q: 'What supporting documents are commonly required?' },
]

export function ChatBox() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, loading])

  async function send(question: string) {
    const q = question.trim()
    if (!q || loading) return

    const history = turns
      .slice(-6)
      .map((t) => ({ role: t.role, content: t.content }))

    setTurns((prev) => [...prev, { role: 'user', content: q }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history }),
      })
      const data = await res.json()

      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || 'The assistant could not generate a response. Please try again.',
          grounded: data.grounded,
          sources: data.sources,
          reason: data.reason,
        },
      ])
    } catch {
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'The assistant is temporarily unavailable. Please try again, or consult INRIS or an authorised officer.',
          grounded: false,
          sources: [],
          reason: 'GENERATION_FAILED',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col md:h-[calc(100vh-11rem)]">
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {turns.length === 0 && !loading ? (
          <div className="mx-auto max-w-xl py-10 text-center md:py-16">
            <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              Ask about passport procedures
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Answers are grounded in approved guidance. If the system cannot
              verify an answer, it will say so.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s.label}
                  variant="secondary"
                  size="sm"
                  onClick={() => send(s.q)}
                  className="rounded-full"
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4 py-2">
            {turns.map((t, i) => (
              <ChatMessage key={i} turn={t} />
            ))}

            {loading && <AssistantThinking />}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={onSubmit}
        className="sticky bottom-20 z-10 mx-auto flex w-full max-w-3xl items-end gap-2 rounded-xl border border-border bg-white p-2 shadow-sm md:bottom-0 md:mt-4 md:rounded-xl"
      >
        <Textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Ask a passport question…"
          disabled={loading}
          className="resize-none border-0 shadow-none focus:ring-0 md:text-sm"
        />
        <Button
          type="submit"
          size="md"
          disabled={loading || !input.trim()}
          aria-label="Send"
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}

function AssistantThinking() {
  return (
    <div className="max-w-[95%] md:max-w-[85%]">
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Retrieving guidance
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3.5 w-4/5" />
            <div className="skeleton h-3.5 w-3/5" />
            <div className="skeleton h-3.5 w-2/3" />
          </div>
        </CardBody>
      </Card>
    </div>
  )
}