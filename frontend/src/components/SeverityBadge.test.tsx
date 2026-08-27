import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Severity } from '../api/types'
import { SeverityBadge } from './SeverityBadge'

describe('SeverityBadge', () => {
  const cases: { severity: Severity; label: string }[] = [
    { severity: 'low', label: 'Low' },
    { severity: 'medium', label: 'Medium' },
    { severity: 'high', label: 'High' },
    { severity: 'critical', label: 'Critical' },
  ]

  it.each(cases)('renders the correct label for $severity', ({ severity, label }) => {
    render(<SeverityBadge severity={severity} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
