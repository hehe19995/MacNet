declare module 'geoip-lite' {
  interface GeoIpResult {
    range?: [number, number]
    country: string
    city?: string
    ll?: [number, number]
    metro?: number
    timezone?: string
  }

  export function lookup(ip: string): GeoIpResult | null
}
