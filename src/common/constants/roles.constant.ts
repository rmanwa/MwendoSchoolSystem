export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

export const RoleHierarchy = {
  [Role.SUPER_ADMIN]: 5,
  [Role.ADMIN]: 4,
  [Role.TEACHER]: 3,
  [Role.PARENT]: 2,
  [Role.STUDENT]: 1,
};