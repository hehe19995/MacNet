import { isIP } from 'net';
import geoip from 'geoip-lite'
import { lookup } from 'dns';
import { COUNTRY_MAP } from '../../constants/geo'
import { promisify } from 'util'


const dnsLookup = promisify(lookup)

const geoCache = new Map<string, any>()
const pendingLookups = new Set<string>()

//拆分为同步获取和后台解析
export function getGeoInfoSync(remoteAddr: string) {
  //提取IP/域名
  const hostOrIp = remoteAddr.split(':').slice(0, -1).join(':').replace(/[\[\]]/g, '') || remoteAddr

  //命中缓存直接返回
  if (geoCache.has(hostOrIp)) return geoCache.get(hostOrIp)

  //本地回环地址判断
  if (hostOrIp === '127.0.0.1' || hostOrIp === '::1' || hostOrIp === 'localhost') {
    const localResult =  { country: '本地', city: '回环地址'}
    geoCache.set(hostOrIp, localResult)
    return localResult
  }

  //缓存未命中,后台异步解析
  startBackgroundLookup(hostOrIp)

  return { country: '解析中……', city: '解析中……'}
}

async function startBackgroundLookup(hostOrIp:string) {
  if (pendingLookups.has(hostOrIp)) return
  pendingLookups.add(hostOrIp)

  try {
    let targetIp = hostOrIp
    //如果是域名则走DNS解析
    if (isIP(hostOrIp) === 0) {
      try {
        const address = await Promise.race([
          dnsLookup(hostOrIp).then(res => res.address),
          new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('DNS解析超时')), 2000)
          )
        ])
        targetIp = address
      } catch (error) {
        geoCache.set(hostOrIp, { country: '未知', city: '未知城市'})
        return
      }
    }

    //查询GeoIP
    const geo = geoip.lookup(targetIp)

    if(geo) {
      const countryName = COUNTRY_MAP[geo.country] || geo.country || '未知'
      const cityName = geo.city || '未知'

      const result = {
        country: countryName,
        city: cityName,
        ll: geo.ll
      }
      geoCache.set(hostOrIp, result)
    } else {
      geoCache.set(hostOrIp, { country: '解析失败', city: '解析失败' })
    }
  } catch (error) {
    geoCache.set(hostOrIp, { country: '解析失败', city: '解析失败' })
  } finally {
    pendingLookups.delete(hostOrIp)
  }
}