export interface GeoInfo {
  country: string
  city: string
  ll?: [number, number]
}

export interface GeoCacheEntry {
  info: GeoInfo & { ll?: [number, number] }
  timestamp: number
}
