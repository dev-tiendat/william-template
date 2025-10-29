import { ApiProperty } from '@nestjs/swagger'

export class LoginLogInfo {
  @ApiProperty({ description: 'Log ID' })
  id: number

  @ApiProperty({ description: 'Login IP', example: '1.1.1.1' })
  ip: string

  @ApiProperty({ description: 'Login address' })
  address: string

  @ApiProperty({ description: 'Operating system', example: 'Windows 10' })
  os: string

  @ApiProperty({ description: 'Browser', example: 'Chrome' })
  browser: string

  @ApiProperty({ description: 'User email', example: 'admin@example.com' })
  email: string

  @ApiProperty({ description: 'Login time', example: '2023-12-22 16:46:20.333843' })
  time: string
}

export class TaskLogInfo {
  @ApiProperty({ description: 'Log ID' })
  id: number

  @ApiProperty({ description: 'Task ID' })
  taskId: number

  @ApiProperty({ description: 'Task name' })
  name: string

  @ApiProperty({ description: 'Creation time' })
  createdAt: string

  @ApiProperty({ description: 'Execution time' })
  consumeTime: number

  @ApiProperty({ description: 'Execution information' })
  detail: string

  @ApiProperty({ description: 'Task execution status' })
  status: number
}
