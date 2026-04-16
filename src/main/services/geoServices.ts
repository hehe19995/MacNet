import { isIP } from 'net'
import { lookup } from 'dns'
import geoip from 'geoip-lite'
import { promisify } from 'util'
import { COUNTRY_MAP } from '../../constants/geo'
import { GeoInfo } from '../../types/geo'
import { geoCacheManager } from '../utils/cacheManager' // 引入缓存管理单例

const dnsLookup = promisify(lookup)
const pendingLookups = new Set<string>()
const LOOKUP_CONCURRENCY = 5
const lookupQueue: string[] = []
let activeLookups = 0

// 同步获取地理位置信息（优先从缓存获取）
export function getGeoInfoSync(remoteAddr: string): GeoInfo {
  // 提取 IP/域名
  const hostOrIp = remoteAddr.split(':').slice(0, -1).join(':').replace(/[[\]]/g, '') || remoteAddr

  // 1. 尝试从缓存管理器获取
  const cached = geoCacheManager.get(hostOrIp)
  if (cached) return cached.info

  // 2. 本地回环地址特殊处理
  if (hostOrIp === '127.0.0.1' || hostOrIp === '::1' || hostOrIp === 'localhost') {
    const localResult: GeoInfo = { country: '本地', city: '回环地址' }
    geoCacheManager.set(hostOrIp, { info: localResult, timestamp: Date.now() })
    return localResult
  }

  // 3. 缓存未命中，触发后台异步解析
  startBackgroundLookup(hostOrIp)

  return { country: '解析中……', city: '解析中……' }
}

/**
 * 后台异步解析逻辑
 */
async function startBackgroundLookup(hostOrIp: string): Promise<void> {
  if (pendingLookups.has(hostOrIp)) return
  pendingLookups.add(hostOrIp)
  lookupQueue.push(hostOrIp)

  processQueue()
}

async function processQueue(): Promise<void> {
  if (activeLookups >= LOOKUP_CONCURRENCY || lookupQueue.length === 0) return

  const hostOrIp = lookupQueue.shift()
  activeLookups++

  try {
    await performActualLookup(hostOrIp!)
  } finally {
    activeLookups--
    pendingLookups.delete(hostOrIp!)
    processQueue()
  }
}

async function performActualLookup(hostOrIp: string): Promise<void> {
  const now = Date.now()
  try {
    let targetIp = hostOrIp
    // DNS解析(带超时)
    if (isIP(hostOrIp) === 0) {
      const address = await Promise.race([
        dnsLookup(hostOrIp).then((res) => res.address),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ])
      targetIp = address
    }

    // GeoIP查询
    const geo = geoip.lookup(targetIp)
    if (geo) {
      const result: GeoInfo = {
        country: COUNTRY_MAP[geo.country] || geo.country || '未知',
        city: geo.city || '未知',
        ll: geo.ll
      }
      geoCacheManager.set(hostOrIp, { info: result, timestamp: now })
    }
  } catch (error) {
    console.log(error)
  }
}

/**
 * 批量获取地理位置信息
 */
export function getGeoInfos(remoteAddr: string[]): Record<string, GeoInfo> {
  const results: Record<string, GeoInfo> = {}
  const uniqueHosts = new Set<string>()

  for (const addr of remoteAddr) {
    const hostOrIp = addr.split(':').slice(0, -1).join(':').replace(/[[\]]/g, '')
    results[addr] = getGeoInfoSync(addr)
  }
  return results
}
