export interface NetworkConnection {
  processName: string
  pid: string
  localAddress: string
  remoteAddress: string
  bytesIn?: number
  bytesOut?: number
  isSecure?: boolean
  country?: string
  city?: string
  ll?: [number, number]
}