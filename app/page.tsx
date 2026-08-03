'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  content: string
}

const SUGGESTIONS = [
  '🛒 What do I need to buy?',
  '📦 Show my full inventory',
  '➕ Add a new item',
  '✅ I just went shopping',
]

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-sm flex-shrink-0">
        🛒
      </div>
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dot-3" />
        </div>
      </div>
    </div>
  )
}

marked.setOptions({ gfm: true, breaks: true })

function AssistantMarkdown({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = (marked.parse(content) as string)
      .replace(/<table>/g, '<div class="table-wrapper"><table>')
      .replace(/<\/table>/g, '</table></div>')
    return DOMPurify.sanitize(raw, { ADD_ATTR: ['class'] })
  }, [content])

  return (
    <div
      className="prose-assistant"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-sm flex-shrink-0">
          🛒
        </div>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
          isUser
            ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white rounded-br-sm leading-relaxed'
            : 'bg-[#1a1a1a] border border-white/5 text-gray-100 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <AssistantMarkdown content={message.content} />
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const userMessage = text.trim()
    if (!userMessage || loading) return

    const newMessages: Message[] = [
      ...messages,
      { id: crypto.randomUUID(), role: 'user', content: userMessage },
    ]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const settings = JSON.parse(localStorage.getItem('llm-settings') || '{}')

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey && { 'x-api-key': settings.apiKey }),
          ...(settings.baseUrl && { 'x-base-url': settings.baseUrl }),
          ...(settings.model && { 'x-model': settings.model }),
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.reply || data.error || 'Something went wrong.',
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Connection error. Please check your settings.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
            🛒
          </div>
          <div>
            <h1 className="font-semibold text-sm text-white">Grocery List</h1>
            <p className="text-xs text-gray-500">AI Assistant</p>
          </div>
        </div>
        <Link
          href="/settings"
          className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-3xl shadow-lg shadow-purple-900/30">
              🛒
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white mb-1">Your grocery assistant</h2>
              <p className="text-sm text-gray-500">Ask me anything about your groceries</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl px-3 py-3 text-xs text-gray-300 hover:border-purple-500/40 hover:text-white transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-3 border-t border-white/5 bg-[#0f0f0f]">
        <div className="flex items-end gap-2 bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your groceries…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none outline-none max-h-28 leading-relaxed"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 disabled:opacity-30 transition-opacity"
            aria-label="Send"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
