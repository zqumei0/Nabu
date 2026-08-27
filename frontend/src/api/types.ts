// PROVISIONAL — docs/architecture/data-model.md has no fields defined yet.
// These shapes are invented for scaffolding purposes and will need
// reconciling once the real data model is fleshed out.

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface User {
  id: string
  name: string
  email: string
  orgId: string
}

export interface Organization {
  id: string
  name: string
}

export interface Vulnerability {
  id: string
  orgId: string
  title: string
  description: string
  severity: Severity
  cve?: string
  discoveredAt: string // ISO date
}

export interface Ticket {
  id: string
  orgId: string
  title: string
  status: TicketStatus
  severity: Severity // denormalized from the linked vulnerability, for filtering
  vulnerabilityId?: string
  assigneeId?: string
  createdAt: string
  updatedAt: string
}

export interface TicketFilters {
  orgId?: string
  status?: TicketStatus
  minSeverity?: Severity
  assigneeId?: string
}
