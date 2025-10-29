import { ApiProperty } from '@nestjs/swagger'

export class Runtime {
  @ApiProperty({ description: 'System' })
  os?: string

  @ApiProperty({ description: 'Server architecture' })
  arch?: string

  @ApiProperty({ description: 'Node version' })
  nodeVersion?: string

  @ApiProperty({ description: 'Npm version' })
  npmVersion?: string
}

export class CoreLoad {
  @ApiProperty({ description: 'Current CPU resource consumption' })
  rawLoad?: number

  @ApiProperty({ description: 'Current idle CPU resource' })
  rawLoadIdle?: number
}

// Intel(R) Xeon(R) Platinum 8163 CPU @ 2.50GHz
export class Cpu {
  @ApiProperty({ description: 'Manufacturer' })
  manufacturer?: string

  @ApiProperty({ description: 'Brand' })
  brand?: string

  @ApiProperty({ description: 'Physical cores' })
  physicalCores?: number

  @ApiProperty({ description: 'Model' })
  model?: string

  @ApiProperty({ description: 'Speed in GHz' })
  speed?: number

  @ApiProperty({ description: 'CPU resource consumption raw ticks' })
  rawCurrentLoad?: number

  @ApiProperty({ description: 'Idle CPU resource raw ticks' })
  rawCurrentLoadIdle?: number

  @ApiProperty({ description: 'CPU resource consumption', type: [CoreLoad] })
  coresLoad?: CoreLoad[]
}

export class Disk {
  @ApiProperty({ description: 'Disk space size (bytes)' })
  size?: number

  @ApiProperty({ description: 'Used disk space (bytes)' })
  used?: number

  @ApiProperty({ description: 'Available disk space (bytes)' })
  available?: number
}

export class Memory {
  @ApiProperty({ description: 'total memory in bytes' })
  total?: number

  @ApiProperty({ description: 'Available memory' })
  available?: number
}

export class ServeStatInfo {
  @ApiProperty({ description: 'Running environment', type: Runtime })
  runtime?: Runtime

  @ApiProperty({ description: 'CPU information', type: Cpu })
  cpu?: Cpu

  @ApiProperty({ description: 'Disk information', type: Disk })
  disk?: Disk

  @ApiProperty({ description: 'Memory information', type: Memory })
  memory?: Memory
}
