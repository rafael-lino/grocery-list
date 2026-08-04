import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ChatPage from '@/app/page'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

function seedLocalStorage() {
  localStorage.setItem(
    'llm-settings',
    JSON.stringify({ apiKey: 'test-key', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' })
  )
}

function mockStreamReply(reply: string) {
  const encoder = new TextEncoder()
  const chunks = reply.split(' ').map((word, i) => encoder.encode(i === 0 ? word : ' ' + word))
  let index = 0

  const body = {
    getReader: () => ({
      read: async () => {
        if (index < chunks.length) return { done: false, value: chunks[index++] }
        return { done: true, value: undefined }
      },
    }),
  }

  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, body }),
  )
}

beforeEach(() => {
  seedLocalStorage()
  vi.restoreAllMocks()
})

describe('ChatPage — welcome screen', () => {
  it('renders the welcome heading and suggestion chips when no messages exist', () => {
    render(<ChatPage />)
    expect(screen.getByText('Your grocery assistant')).toBeInTheDocument()
    expect(screen.getByText('🛒 What do I need to buy?')).toBeInTheDocument()
    expect(screen.getByText('📦 Show my full inventory')).toBeInTheDocument()
  })
})

describe('ChatPage — plain text response', () => {
  it('renders a plain assistant reply in the message list', async () => {
    mockStreamReply('You have 3 items at home.')
    render(<ChatPage />)

    await userEvent.click(screen.getByText('🛒 What do I need to buy?'))

    await waitFor(() =>
      expect(screen.getByText('You have 3 items at home.')).toBeInTheDocument()
    )
  })
})

describe('ChatPage — markdown table response', () => {
  it('renders a GFM table as a <table> element after streaming completes', async () => {
    const tableMarkdown = `Here is your inventory:\n\n| Name | Quantity | Ideal | Unit |\n|------|----------|-------|------|\n| Rice | 1 | 2 | kg |\n| Milk | 0 | 3 | liter |`

    mockStreamReply(tableMarkdown)
    render(<ChatPage />)

    await userEvent.click(screen.getByText('📦 Show my full inventory'))

    await waitFor(() => {
      expect(document.querySelector('table')).toBeInTheDocument()
      expect(screen.getByText('Rice')).toBeInTheDocument()
      expect(screen.getByText('Milk')).toBeInTheDocument()
    })
  })

  it('renders table headers correctly', async () => {
    const tableMarkdown = `| Name | Quantity | Ideal | Unit |\n|------|----------|-------|------|\n| Rice | 1 | 2 | kg |`

    mockStreamReply(tableMarkdown)
    render(<ChatPage />)

    await userEvent.click(screen.getByText('📦 Show my full inventory'))

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Quantity')).toBeInTheDocument()
      expect(screen.getByText('Ideal')).toBeInTheDocument()
      expect(screen.getByText('Unit')).toBeInTheDocument()
    })
  })
})

describe('ChatPage — markdown list response', () => {
  it('renders a bullet list as <ul> and <li> elements after streaming completes', async () => {
    const listMarkdown = `Items updated:\n\n- Rice: 2 kg\n- Milk: 3 liters`

    mockStreamReply(listMarkdown)
    render(<ChatPage />)

    await userEvent.click(screen.getByText('✅ I just went shopping'))

    await waitFor(() => {
      expect(document.querySelector('ul')).toBeInTheDocument()
      expect(document.querySelectorAll('li').length).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('ChatPage — user messages are plain text', () => {
  it('does not parse markdown in user messages', async () => {
    mockStreamReply('Got it!')
    render(<ChatPage />)

    const textarea = screen.getByPlaceholderText('Ask about your groceries…')
    await userEvent.type(textarea, '**bold text**')
    await userEvent.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.getByText('**bold text**')).toBeInTheDocument()
      expect(document.querySelector('.flex-row-reverse strong')).not.toBeInTheDocument()
    })
  })
})

describe('ChatPage — concurrent send prevention', () => {
  it('blocks a second send via Enter key while streaming is in progress', async () => {
    // Slow stream: never resolves `done` until we release it
    let releaseDone!: () => void
    const donePromise = new Promise<void>((resolve) => { releaseDone = resolve })

    const encoder = new TextEncoder()
    let readCount = 0
    const body = {
      getReader: () => ({
        read: async () => {
          readCount++
          if (readCount === 1) return { done: false, value: encoder.encode('Hello') }
          // Block here until test releases
          await donePromise
          return { done: true, value: undefined }
        },
      }),
    }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, body })
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPage />)

    const textarea = screen.getByPlaceholderText('Ask about your groceries…')
    await userEvent.type(textarea, 'first message')
    await userEvent.keyboard('{Enter}')

    // Wait until streaming has started (first token delivered, loading=false, streamingId set)
    await waitFor(() => expect(screen.getByText(/Hello/)).toBeInTheDocument())

    // Type a second message and press Enter — should be blocked by streamingId guard
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'second message')
    await userEvent.keyboard('{Enter}')

    // Release the stream so the component can settle
    releaseDone()
    await waitFor(() =>
      expect(document.querySelectorAll('[class*="rounded-br-sm"]').length).toBe(1)
    )

    // fetch should only have been called once — the second Enter was blocked
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('ChatPage — stream error recovery', () => {
  it('replaces the ghost empty bubble with an error message when the stream fails', async () => {
    const encoder = new TextEncoder()
    let readCount = 0
    const body = {
      getReader: () => ({
        read: async () => {
          readCount++
          if (readCount === 1) return { done: false, value: encoder.encode('Part') }
          throw new Error('network error')
        },
      }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }))

    render(<ChatPage />)

    await userEvent.click(screen.getByText('🛒 What do I need to buy?'))

    await waitFor(() =>
      expect(screen.getByText('Connection error. Please check your settings.')).toBeInTheDocument()
    )

    // The error message is shown exactly once — no duplicate/orphaned bubbles
    expect(screen.getAllByText('Connection error. Please check your settings.').length).toBe(1)

    // No empty assistant bubble left over: every .prose-assistant div must have text content
    const assistantBubbles = document.querySelectorAll('.prose-assistant')
    assistantBubbles.forEach((el) => {
      expect(el.textContent?.trim()).not.toBe('')
    })
  })
})

describe('ChatPage — TextDecoder flush', () => {
  it('appends the decoder tail after the stream ends', async () => {
    // Simulate a multi-byte character (emoji = 4 bytes) split across two chunks.
    // The first chunk carries the first 3 bytes (incomplete UTF-8 sequence) and
    // the second chunk carries the 4th byte. With { stream: true }, the decoder
    // holds back the incomplete sequence; the tail flush emits the remainder.
    const thumbsUp = '👍' // U+1F44D, encoded as 4 UTF-8 bytes: F0 9F 91 8D
    const fullBytes = new TextEncoder().encode(thumbsUp)
    const firstChunk = fullBytes.slice(0, 3)  // incomplete sequence
    const secondChunk = fullBytes.slice(3)    // final byte

    let readCount = 0
    const body = {
      getReader: () => ({
        read: async () => {
          readCount++
          if (readCount === 1) return { done: false, value: firstChunk }
          if (readCount === 2) return { done: false, value: secondChunk }
          return { done: true, value: undefined }
        },
      }),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body }))

    render(<ChatPage />)

    await userEvent.click(screen.getByText('🛒 What do I need to buy?'))

    await waitFor(() =>
      expect(screen.getByText(thumbsUp)).toBeInTheDocument()
    )
  })
})
