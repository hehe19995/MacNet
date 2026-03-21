import { exec } from 'child_process'
import { promisify } from 'util'
import { NetworkConnection } from '../types/network'

const execAsync = promisify(exec)

async function getTrafficStats(): Promise<Map<string, { bytesIn: number; bytesOut: number }>> {
  try {
    const { stdout } = await execAsync('nettop -P -L 1 -J bytes_in,bytes_out -m tcp')
    const trafficMap = new Map<string, { bytesIn: number; bytesOut: number }>()

    //nettop out: process.PID,bytesIn,bytesOut
    const lines = stdout.trim().split('\n').slice(1)
    lines.forEach((line) => {
      const parts = line.split(',')
      if (parts.length >= 3) {
        const processInfo = parts[0]
        const processName = processInfo.split('.')[0]
        const bytesIn = parseInt(parts[1]) || 0
        const bytesOut = parseInt(parts[2]) || 0

        //同一进程可能有多个PID，把流量累加起来
        const existing = trafficMap.get(processName) || { bytesIn: 0, bytesOut: 0 }
        trafficMap.set(processName, {
          bytesIn: existing.bytesIn + bytesIn,
          bytesOut: existing.bytesOut + bytesOut
        })
      }
    })
    return trafficMap
  } catch (error) {
    console.log(error)
    return new Map()
  }
}

export async function getNetwork(): Promise<NetworkConnection[]> {
  try {
    // 并行获取两个数据源
    const [lsofResult, trafficMap] = await Promise.all([
      execAsync('lsof -iTCP -sTCP:ESTABLISHED -n -P'),
      getTrafficStats()
    ])
    // 按行切分，并且跳过表头
    const lines = lsofResult.stdout.trim().split('\n').slice(1)

    return lines.map((line) => {
      // 按照空格切分
      const parts = line.split(/\s+/)
      //正则划分local和remote
      const cleanAddress = parts[8].replace(/\s*\(.*\)$/, '')
      const [localAddress, remoteAddress] = cleanAddress.split('->')

      const processName = parts[0]
      const traffic = trafficMap.get(processName) || { bytesIn: 0, bytesOut: 0 }
      return {
        processName: parts[0],
        pid: parts[1],
        localAddress,
        remoteAddress,
        bytesIn: traffic.bytesIn,
        bytesOut: traffic.bytesOut
      }
    })
  } catch (error) {
    console.log(error)
    return []
  }
}
