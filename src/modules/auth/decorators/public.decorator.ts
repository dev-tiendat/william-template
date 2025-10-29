import { SetMetadata } from '@nestjs/common'

import { PUBLIC_KEY } from '../auth.constant'

/**
 * Add this decorator when the interface does not need to check user login
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true)
