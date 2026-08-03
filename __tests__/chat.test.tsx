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

function mockFetchReply(reply: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ reply }),
    })
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
    mockFetchReply('You have 3 items at home.')
    render(<ChatPage />)

    await userEvent.click(screen.getByText('🛒 What do I need to buy?'))

    await waitFor(() =>
      expect(screen.getByText('You have 3 items at home.')).toBeInTheDocument()
    )
  })
})

describe('ChatPage — markdown table response', () => {
  it('renders a GFM table as a <table> element', async () => {
    const tableMarkdown = `Here is your inventory:

| Name | Quantity | Ideal | Unit |
|------|----------|-------|------|
| Rice | 1 | 2 | kg |
| Milk | 0 | 3 | liter |`

    mockFetchReply(tableMarkdown)
    render(<ChatPage />)

    await userEvent.click(screen.getByText('📦 Show my full inventory'))

    await waitFor(() => {
      expect(document.querySelector('table')).toBeInTheDocument()
      expect(screen.getByText('Rice')).toBeInTheDocument()
      expect(screen.getByText('Milk')).toBeInTheDocument()
    })
  })

  it('renders table headers correctly', async () => {
    const tableMarkdown = `| Name | Quantity | Ideal | Unit |
|------|----------|-------|------|
| Rice | 1 | 2 | kg |`

    mockFetchReply(tableMarkdown)
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
  it('renders a bullet list as <ul> and <li> elements', async () => {
    const listMarkdown = `Items updated:

- Rice: 2 kg
- Milk: 3 liters`

    mockFetchReply(listMarkdown)
    render(<ChatPage />)

    await userEvent.click(screen.getByText('✅ I just went shopping'))

    await waitFor(() => {
      expect(document.querySelector('ul')).toBeInTheDocument()
      expect(document.querySelectorAll('li').length).toBeGreaterThanOrEqual(2)
      expect(screen.getByText('Rice: 2 kg')).toBeInTheDocument()
    })
  })
})

describe('ChatPage — user messages are plain text', () => {
  it('does not parse markdown in user messages', async () => {
    mockFetchReply('Got it!')
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
