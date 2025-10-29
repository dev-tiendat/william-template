import { SetMetadata } from '@nestjs/common'

export const MISSION_DECORATOR_KEY = 'decorator:mission'

export const Mission = () => SetMetadata(MISSION_DECORATOR_KEY, true)
