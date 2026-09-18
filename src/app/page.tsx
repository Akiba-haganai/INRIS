import { ChatBox } from '@/components/chat/ChatBox'

export default function HomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-display font-semibold tracking-tight">
          Passport guidance
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask a question about passport procedures. Answers are grounded in
          approved guidance — the assistant will not invent procedures.
        </p>
      </div>
      <ChatBox />
    </div>
  )
}