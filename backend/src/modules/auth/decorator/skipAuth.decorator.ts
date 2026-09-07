import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public (skip authentication)
 * Use: @SkipAuth() above the controller method
 */
export const SkipAuth = () => SetMetadata(IS_PUBLIC_KEY, true);