export interface Connection {
  remoteAddress: string
  lastSeen: number
}

export interface AppProcess {
  processName: string
  pids: Set<string>
  connections: Map<string, Connection>
  lastActive: number
  totalBytesIn: number
  totalBytesOut: number
  rateIn: number
  rateOut: number
}
