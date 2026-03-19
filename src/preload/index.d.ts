import { ElectronAPI } from '@electron-toolkit/preload'

export interface WindowAPI {
  electron: ElectronAPI
  network: {
    onTrafficUpdate: (callback: (data) => void) => void
  }
  api: unknown
}

declare global {
  interface Window extends WindowAPI {}
}
