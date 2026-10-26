export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE = 'user:manage',

  // Admin permissions
  ADMIN_ACCESS = 'admin:access',
  ADMIN_MANAGE_USERS = 'admin:manage_users',
  ADMIN_MANAGE_ROLES = 'admin:manage_roles',
  ADMIN_VIEW_AUDIT = 'admin:view_audit',
  ADMIN_MANAGE_SETTINGS = 'admin:manage_settings',

  // Material permissions
  MATERIAL_CREATE = 'material:create',
  MATERIAL_PUBLISH = 'material:publish',
  MATERIAL_ARCHIVE = 'material:archive',
  MATERIAL_DELETE = 'material:delete',
  MATERIAL_READ = 'material:read',
  MATERIAL_DOWNLOAD = 'material:download',

  // Teacher permissions
  TEACHER_VERIFY = 'teacher:verify',
  TEACHER_VIEW_PROFILE = 'teacher:view_profile',

  // Discussion permissions
  DISCUSSION_COMMENT = 'discussion:comment',
  DISCUSSION_MODERATE = 'discussion:moderate',
  DISCUSSION_LOCK = 'discussion:lock',

  // Analytics permissions
  ANALYTICS_VIEW_OWN = 'analytics:view_own',
  ANALYTICS_VIEW_ALL = 'analytics:view_all',

  // Other permissions
  NOTIFICATION_SEND = 'notification:send',
  REPORT_RESOLVE = 'report:resolve',
  AUDIT_VIEW = 'audit:view',
}
