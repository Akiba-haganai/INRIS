'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody } from '@/components/ui/Card'
import { InlineAlert } from '@/components/ui/InlineAlert'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/staff'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    const supabase = createClient()
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(next)
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setNotice(
          'Account created. If email confirmation is enabled in Supabase, confirm before signing in.'
        )
        setMode('signin')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-display font-semibold tracking-tight">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Staff access to case intelligence and knowledge-base management.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Email
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Password
              </label>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
              />
            </div>

            {error && (
              <InlineAlert tone="error">{error}</InlineAlert>
            )}
            {notice && (
              <InlineAlert tone="success">{notice}</InlineAlert>
            )}

            <Button type="submit" disabled={loading} fullWidthOnMobile>
              {loading
                ? 'Please wait…'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError(null)
              setNotice(null)
            }}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
          >
            {mode === 'signin'
              ? "Don't have an account? Create one"
              : 'Already have an account? Sign in'}
          </button>
        </CardBody>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-400">
        Access is restricted. Roles are assigned by an administrator after
        sign-up.
      </p>
    </div>
  )
}
