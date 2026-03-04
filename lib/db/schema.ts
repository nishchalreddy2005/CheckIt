import { pgTable, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    username: text('username').notNull().default('testuser').unique(),
    name: text('name').notNull(),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    bio: text('bio'),
    theme: text('theme').default('system'),
    language: text('language').default('en'),
    timezone: text('timezone').default('UTC'),
    profilePicture: text('profile_picture'),
    calendarBackground: text('calendar_background'),
    twoFactorEnabled: boolean('two_factor_enabled').default(false),
    twoFactorSecret: text('two_factor_secret'),
    emailVerified: boolean('email_verified').default(false),
    verificationToken: text('verification_token'),
    verificationTokenExpiresAt: timestamp('verification_token_expires_at'),
    pendingNewEmail: text('pending_new_email'),
    otpCode: text('otp_code'),
    otpExpiresAt: timestamp('otp_expires_at'),
    lastLogin: timestamp('last_login'),
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    lockedUntil: timestamp('locked_until'),
    isAdmin: boolean('is_admin').default(false),
    isSuperadmin: boolean('is_superadmin').default(false),
    isSuspended: boolean('is_suspended').default(false),
    pendingAdmin: boolean('pending_admin').default(false),
    preferences: text('preferences'), // JSON string for drag/drop layouts etc
    pushSubscription: text('push_subscription') // JSON string for service worker credentials
});

export const tasks = pgTable('tasks', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: timestamp('due_date'),
    category: text('category').default('General'),
    completed: boolean('completed').default(false),
    priority: text('priority').default('medium'),
    userId: text('user_id').notNull().references(() => users.id),
    sharedWith: text('shared_with').array(),
    parentId: text('parent_id'), // For sub-tasks
    dependsOn: text('depends_on'), // For task blockers
    recurrenceRule: text('recurrence_rule'), // e.g. 'daily', 'weekly'
    nextRecurringDate: timestamp('next_recurring_date'),
    createdAt: timestamp('created_at').defaultNow()
}, (table) => [
    index('tasks_user_id_idx').on(table.userId),
    index('tasks_due_date_idx').on(table.dueDate)
]);

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id),
    createdAt: timestamp('created_at').defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address')
}, (table) => [
    index('sessions_user_id_idx').on(table.userId)
]);

export const systemSettings = pgTable('system_settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow()
});

export const auditLogs = pgTable('audit_logs', {
    id: text('id').primaryKey(),
    adminId: text('admin_id').notNull().references(() => users.id),
    action: text('action').notNull(),
    targetUser: text('target_user'),
    details: text('details'),
    timestamp: timestamp('timestamp').defaultNow(),
    ipAddress: text('ip_address')
});
