import { NetworkConnection } from '../../../types/network'
import { AppProcess } from '../../../types/process'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  //Map存储，O(1)时间复杂度，快速查找
  const processes = ref<Map<string, AppProcess>>(new Map())

  const updateConnections = (data: NetworkConnection[]): void => {
    const now = Date.now()
    const currentBatch = new Map<string, Set<string>>()
    const currentPids = new Map<string, Set<string>>()

    const currentTraffic = new Map<string, { bytesIn: number; bytesOut: number }>()

    //预处理当前批次
    data.forEach((item) => {
      if (!currentBatch.has(item.processName)) {
        currentBatch.set(item.processName, new Set())
        currentPids.set(item.processName, new Set())
        currentTraffic.set(item.processName, { bytesIn: 0, bytesOut: 0 })
      }
      currentBatch.get(item.processName)!.add(item.remoteAddress)
      currentPids.get(item.processName)!.add(item.pid)
      const traffic = currentTraffic.get(item.processName)!
      traffic.bytesIn = item.bytesIn || 0
      traffic.bytesOut = item.bytesOut || 0
    })

    //清理逻辑
    for (const [procName, proc] of processes.value.entries()) {
      //进程消失
      if (!currentBatch.has(procName)) {
        processes.value.delete(procName)
        continue
      }

      //进程还在
      const activeRemotes = currentBatch.get(procName)
      for (const [remoteAddr] of proc.connections.entries()) {
        if (!activeRemotes!.has(remoteAddr)) {
          proc.connections.delete(remoteAddr)
        }
      }

      //更新PID集合
      proc.pids = currentPids.get(procName)!
      proc.lastActive = now

      //更新进程的同时计算速率
      const traffic = currentTraffic.get(procName)!
      proc.rateIn = Math.max(0, traffic.bytesIn - proc.totalBytesIn)
      proc.rateOut = Math.max(0, traffic.bytesOut - proc.totalBytesOut)
      proc.totalBytesIn = traffic.bytesIn
      proc.totalBytesOut = traffic.bytesOut
    }

    //新增
    data.forEach((item) => {
      const process = processes.value.get(item.processName)
      if (!process) {
        const traffic = currentTraffic.get(item.processName)!
        processes.value.set(item.processName, {
          processName: item.processName,
          pids: currentPids.get(item.processName)!,
          connections: new Map(),
          lastActive: now,
          totalBytesIn: traffic.bytesIn,
          totalBytesOut: traffic.bytesOut,
          rateIn: 0,
          rateOut: 0
        })
      }
    })

    data.forEach((item) => {
      const process = processes.value.get(item.processName)
      if (process) {
        process.connections.set(item.remoteAddress, {
          remoteAddress: item.remoteAddress,
          lastSeen: now
        })
      }
    })
  }
})
