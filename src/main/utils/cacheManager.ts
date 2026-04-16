import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { GeoCacheEntry } from '../../types/geo'

export class GeoCacheManager {
  // 缓存value是符合GeoCacheEntry结构的数据
  private geoCache = new Map<string, GeoCacheEntry>()
  private readonly CACHE_FILE = path.join(app.getPath('userData'), 'geo_cache.json')
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7天
  private readonly MAX_ENTRIES = 5000
  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.loadCache()
    // 每小时清理一次过期缓存
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000)
  }

  public get(key: string): GeoCacheEntry | undefined {
    const entry = this.geoCache.get(key)
    if (entry) {
      this.geoCache.delete(key)
      this.geoCache.set(key, entry)
    }
    return entry
  }

  public set(key: string, entry: GeoCacheEntry): void {
    if (this.geoCache.has(key)) {
      this.geoCache.delete(key)
    } else if (this.geoCache.size >= this.MAX_ENTRIES) {
      const oldestKey = this.geoCache.keys().next().value
      if (oldestKey !== undefined) {
        this.geoCache.delete(oldestKey)
      }
    }

    this.geoCache.set(key, entry)
    this.saveCacheDebounced()
  }

  public has(key: string): boolean {
    return this.geoCache.has(key)
  }

  private cleanupCache(): void {
    const now = Date.now()
    let changed = false
    for (const [key, value] of this.geoCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.geoCache.delete(key)
        changed = true
      }
    }
    if (changed) this.saveCacheDebounced()
  }

  private loadCache(): void {
    try {
      if (fs.existsSync(this.CACHE_FILE)) {
        const now = Date.now()
        const data = JSON.parse(fs.readFileSync(this.CACHE_FILE, 'utf-8'))
        Object.entries(data).forEach(([k, v]) => {
          const entry = v as GeoCacheEntry
          if (now - entry.timestamp < this.CACHE_TTL) {
            this.geoCache.set(k, entry)
          }
        })
      }
    } catch (error) {
      console.error('加载Geo缓存失败:', error)
    }
  }

  public saveCacheNow(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }
    try {
      // Map对象无法直接序列化为JSON,需要先用fromEntries转换为对象
      const data = Object.fromEntries(this.geoCache)
      const tempFile = `${this.CACHE_FILE}.tmp`

      fs.writeFileSync(tempFile, JSON.stringify(data))
      if (fs.existsSync(this.CACHE_FILE)) {
        fs.unlinkSync(this.CACHE_FILE)
      }
      fs.renameSync(tempFile, this.CACHE_FILE)
    } catch (error) {
      console.error('持久化Geo缓存失败:', error)
    }
  }

  private saveCacheDebounced(): void {
    if (this.saveTimeout) {
      this.saveTimeout.refresh()
    } else {
      this.saveTimeout = setTimeout(() => this.saveCacheNow(), 5000)
    }
  }
}

// 导出单例供全局使用
export const geoCacheManager = new GeoCacheManager()
