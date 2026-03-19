export interface NetworkConnection {
  processName: string
  pid: string
  localAddress: string
  remoteAddress: string
  country?: string
  isSecure?: boolean
}
