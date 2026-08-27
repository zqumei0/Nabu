import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TicketStatus } from '../api/types'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  const cases: { status: TicketStatus; label: string }[] = [
    { status: 'open', label: 'Open' },
    { status: 'in_progress', label: 'In Progress' },
    { status: 'resolved', label: 'Resolved' },
    { status: 'closed', label: 'Closed' },
  ]

  it.each(cases)('renders the correct label for $status', ({ status, label }) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
