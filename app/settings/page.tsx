'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PRESETS = [
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/', model: 'gemini-2.0-flash' },
  { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama3-8b-8192' },
  { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1')
  const [model, setModel] = useState('gpt-4o-mini')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('llm-settings') || '{}')
    if (stored.apiKey) setApiKey(stored.apiKey)
    if (stored.baseUrl) setBaseUrl(stored.baseUrl)
    if (stored.model) setModel(stored.model)
  }, [])

  function save() {
    localStorage.setItem('llm-settings', JSON.stringify({ apiKey, baseUrl, model }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function signOut() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.replace('/login')
  }

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-base-url': baseUrl,
          'x-model': model,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Reply with just: OK' }],
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setTestResult({ ok: true, message: 'Connected successfully!' })
      } else {
        setTestResult({ ok: false, message: data.error || 'Connection failed.' })
      }
    } catch {
      setTestResult({ ok: false, message: 'Network error.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-white/5">
        <Link
          href="/"
          className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 className="font-semibold text-sm text-white">Settings</h1>
          <p className="text-xs text-gray-500">LLM Configuration</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Provider Presets */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Setup</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { setBaseUrl(p.baseUrl); setModel(p.model) }}
                className={`bg-[#1a1a1a] border rounded-xl px-3 py-3 text-sm text-left transition-all ${
                  baseUrl === p.baseUrl
                    ? 'border-purple-500/60 text-white'
                    : 'border-white/5 text-gray-400 hover:border-white/10 hover:text-white'
                }`}
              >
                <span className="font-medium">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            API Key
          </label>
          <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 gap-2 focus-within:border-purple-500/50 transition-colors">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
            <button
              onClick={() => setShowKey((v) => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showKey ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            Base URL
          </label>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 focus-within:border-purple-500/50 transition-colors">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">
            Model
          </label>
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 focus-within:border-purple-500/50 transition-colors">
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div
            className={`rounded-xl px-4 py-3 text-sm border ${
              testResult.ok
                ? 'bg-green-900/20 border-green-500/30 text-green-400'
                : 'bg-red-900/20 border-red-500/30 text-red-400'
            }`}
          >
            {testResult.ok ? '✓ ' : '✗ '}{testResult.message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-10 pt-4 space-y-3 border-t border-white/5">
        <button
          onClick={testConnection}
          disabled={!apiKey || testing}
          className="w-full bg-[#1a1a1a] border border-white/10 text-gray-300 rounded-2xl py-4 text-sm font-medium hover:border-white/20 disabled:opacity-30 transition-all"
        >
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        <button
          onClick={save}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl py-4 text-sm font-medium shadow-lg shadow-purple-900/30 transition-opacity active:opacity-90"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
        <button
          onClick={signOut}
          className="w-full bg-[#1a1a1a] border border-white/10 text-red-400 rounded-2xl py-4 text-sm font-medium hover:border-red-500/30 transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
