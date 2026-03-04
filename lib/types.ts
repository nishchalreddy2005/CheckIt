import { users, tasks, sessions } from './db/schema';

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type TaskStats = {
  completed: number
  total: number
  categories: Record<string, { completed: number; total: number }>
}
