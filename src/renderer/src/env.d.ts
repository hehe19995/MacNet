/// <reference types="vite/client" />

import type { WindowAPI } from '../../preload/index.d.ts'

declare global {
  interface Window extends WindowAPI {}
}
