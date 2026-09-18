import { Card, CardBody } from '@/components/ui/Card'
import { InlineAlert } from '@/components/ui/InlineAlert'

export interface ChatSource {
  id: string
  title: string
  category: string
  source: string
  last_verified: string | null
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
  grounded?: boolean
  sources?: ChatSource[]
  reason?: string
}

export function ChatMessage({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-700 px-3.5 py-2 text-sm leading-relaxed text-white md:max-w-[75%]">
          {turn.content}
        </div>
      </div>
    )
  }

  const showSources =
    turn.grounded && turn.sources && turn.sources.length > 0

  return (
    <div className="w-full max-w-[95%] animate-in md:max-w-[85%]">
      <Card>
        <CardBody className="space-y-3">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {turn.content}
          </div>

          {showSources && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Sources
              </p>
              <ul className="space-y-1.5">
                {turn.sources!.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-baseline gap-x-1.5 text-xs text-slate-600"
                  >
                    <span className="font-medium text-slate-800">
                      {s.title}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{s.category}</span>
                    {s.last_verified && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-400">
                          verified {s.last_verified.slice(0, 10)}
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {turn.grounded === false && turn.reason && (
            <SourceNotation reason={turn.reason} />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

const SOURCE_NOTES: Record<string, string> = {
  NO_PROVIDER: 'No AI provider is configured.',
  NO_API_KEY: 'No AI provider API key is configured.',
  EMPTY_KB: 'The knowledge base has no approved guidance yet.',
  NO_MATCH: 'No approved guidance matched this question.',
  RETRIEVAL_FAILED: 'The knowledge base could not be searched.',
  GENERATION_FAILED: 'The AI provider did not return a response.',
  MODEL_REFUSED: 'The AI declined to answer from the available guidance.',
}

function SourceNotation({ reason }: { reason: string }) {
  const note = SOURCE_NOTES[reason]
  if (!note) return null

  const tone =
    reason === 'NO_MATCH' || reason === 'MODEL_REFUSED' ? 'warning' : 'info'

  return <InlineAlert tone={tone}>{note}</InlineAlert>
}