import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator - restricts access to specific user roles
 * 
 * @param roles - Array of allowed roles (e.g., 'admin', 'teacher', 'student')
 * 
 * @example
 * @Roles('admin', 'super_admin')
 * @Get()
 * findAll() {
 *   // Only admins and super_admins can access this
 * }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);