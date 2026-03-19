import { exec } from 'child_process'
import { promisify } from 'util'
import { NetworkConnection } from '../renderer/src/types'

const execAsync = promisify(exec)

export async function getNetwork(): Promise<NetworkConnection[]> {
  try {
    // 异步执行命令
    const { stdout } = await execAsync('lsof -iTCP -sTCP:ESTABLISHED -n -P')
    // 按行切分，并且跳过表头
    const lines = stdout.trim().split('\n').slice(1)

    return lines.map((line) => {
      // 按照空格切分
      const parts = line.split(/\s+/)
      return {
        processName: parts[0],
        pid: parts[1],
        //正则划分local和remote
        localAddress: parts[8],
        remoteAddress: parts[8]
      }
    })
  } catch (error) {
    console.log(error)
    return []
  }
}
