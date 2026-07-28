import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  plain_password: text('plain_password'),
  role: text('role').notNull(), // 'ADMIN' | 'WAKASEK' | 'KEPALA_SEKOLAH'
  is_active: boolean('is_active').notNull().default(true),
  is_super_admin: boolean('is_super_admin').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const aspirations = pgTable('aspirations', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  status: text('status').notNull().default('BARU'), // 'BARU' | 'DITINJAU' | 'DITINDAKLANJUTI' | 'SELESAI'
  admin_note: text('admin_note'),
  deleted_at: timestamp('deleted_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const audit_logs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entity_id: text('entity_id').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});
