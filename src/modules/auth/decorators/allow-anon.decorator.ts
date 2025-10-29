import { SetMetadata } from '@nestjs/common'

import { ALLOW_ANON_KEY } from '../auth.constant'

/**
 * Add this decorator when the interface does not need to check user operation permissions
 */
export const AllowAnon = () => SetMetadata(ALLOW_ANON_KEY, true)
