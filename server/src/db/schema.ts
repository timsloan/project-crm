
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const projectStatusEnum = pgEnum('project_status', ['planning', 'active', 'on_hold', 'completed', 'cancelled']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'completed', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

// Companies table
export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  industry: text('industry'),
  website: text('website'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Teams table
export const teamsTable = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  team_id: integer('team_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Projects table
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('planning'),
  estimated_value: numeric('estimated_value', { precision: 15, scale: 2 }),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  company_id: integer('company_id').notNull(),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Project Wiki table (for version history)
export const projectWikiTable = pgTable('project_wiki', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  version: integer('version').notNull(),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  due_date: timestamp('due_date'),
  project_id: integer('project_id').notNull(),
  assigned_to: integer('assigned_to'),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Notes table (both private and public)
export const notesTable = pgTable('notes', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  is_private: boolean('is_private').notNull().default(false),
  project_id: integer('project_id').notNull(),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companiesTable, ({ many }) => ({
  projects: many(projectsTable),
}));

export const teamsRelations = relations(teamsTable, ({ many }) => ({
  users: many(usersTable),
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  team: one(teamsTable, {
    fields: [usersTable.team_id],
    references: [teamsTable.id],
  }),
  createdProjects: many(projectsTable, { relationName: 'creator' }),
  assignedTasks: many(tasksTable, { relationName: 'assignee' }),
  createdTasks: many(tasksTable, { relationName: 'taskCreator' }),
  createdNotes: many(notesTable),
  createdWikiEntries: many(projectWikiTable),
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [projectsTable.company_id],
    references: [companiesTable.id],
  }),
  creator: one(usersTable, {
    fields: [projectsTable.created_by],
    references: [usersTable.id],
    relationName: 'creator',
  }),
  tasks: many(tasksTable),
  notes: many(notesTable),
  wikiEntries: many(projectWikiTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [tasksTable.project_id],
    references: [projectsTable.id],
  }),
  assignee: one(usersTable, {
    fields: [tasksTable.assigned_to],
    references: [usersTable.id],
    relationName: 'assignee',
  }),
  creator: one(usersTable, {
    fields: [tasksTable.created_by],
    references: [usersTable.id],
    relationName: 'taskCreator',
  }),
}));

export const notesRelations = relations(notesTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [notesTable.project_id],
    references: [projectsTable.id],
  }),
  creator: one(usersTable, {
    fields: [notesTable.created_by],
    references: [usersTable.id],
  }),
}));

export const projectWikiRelations = relations(projectWikiTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectWikiTable.project_id],
    references: [projectsTable.id],
  }),
  creator: one(usersTable, {
    fields: [projectWikiTable.created_by],
    references: [usersTable.id],
  }),
}));

// Export all tables for proper relation queries
export const tables = {
  companies: companiesTable,
  teams: teamsTable,
  users: usersTable,
  projects: projectsTable,
  projectWiki: projectWikiTable,
  tasks: tasksTable,
  notes: notesTable,
};
