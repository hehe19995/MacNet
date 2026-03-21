export interface NetworkConnection {
  processName: string
  pid: string
  localAddress: string
  remoteAddress: string
  bytesIn?: number
  bytesOut?: number
  country?: string
  isSecure?: boolean
}