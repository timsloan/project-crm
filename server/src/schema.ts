
import { z } from 'zod';

// Company schema
export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  industry: z.string().nullable(),
  website: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Company = z.infer<typeof companySchema>;

export const createCompanyInputSchema = z.object({
  name: z.string().min(1),
  industry: z.string().nullable(),
  website: z.string().url().nullable()
});

export type CreateCompanyInput = z.infer<typeof createCompanyInputSchema>;

// Team schema
export const teamSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Team = z.infer<typeof teamSchema>;

export const createTeamInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  team_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  team_id: z.number().nullable()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  estimated_value: z.number().nullable(),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  company_id: z.number(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

export const createProjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  estimated_value: z.number().positive().nullable(),
  start_date: z.coerce.date().nullable(),
  end_date: z.coerce.date().nullable(),
  company_id: z.number(),
  created_by: z.number()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  estimated_value: z.number().positive().nullable().optional(),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional(),
  company_id: z.number().optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

// Project Wiki schema
export const projectWikiSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  title: z.string(),
  content: z.string(),
  version: z.number(),
  created_by: z.number(),
  created_at: z.coerce.date()
});

export type ProjectWiki = z.infer<typeof projectWikiSchema>;

export const createProjectWikiInputSchema = z.object({
  project_id: z.number(),
  title: z.string().min(1),
  content: z.string(),
  created_by: z.number()
});

export type CreateProjectWikiInput = z.infer<typeof createProjectWikiInputSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.coerce.date().nullable(),
  project_id: z.number(),
  assigned_to: z.number().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.coerce.date().nullable(),
  project_id: z.number(),
  assigned_to: z.number().nullable(),
  created_by: z.number()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.coerce.date().nullable().optional(),
  assigned_to: z.number().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Note schema (both private and public)
export const noteSchema = z.object({
  id: z.number(),
  content: z.string(),
  is_private: z.boolean(),
  project_id: z.number(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Note = z.infer<typeof noteSchema>;

export const createNoteInputSchema = z.object({
  content: z.string().min(1),
  is_private: z.boolean().default(false),
  project_id: z.number(),
  created_by: z.number()
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z.object({
  id: z.number(),
  content: z.string().min(1)
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

// Get input schemas
export const getProjectInputSchema = z.object({
  id: z.number()
});

export type GetProjectInput = z.infer<typeof getProjectInputSchema>;

export const getProjectNotesInputSchema = z.object({
  project_id: z.number(),
  user_id: z.number() // For filtering private notes
});

export type GetProjectNotesInput = z.infer<typeof getProjectNotesInputSchema>;

export const getProjectWikiHistoryInputSchema = z.object({
  project_id: z.number()
});

export type GetProjectWikiHistoryInput = z.infer<typeof getProjectWikiHistoryInputSchema>;

export const getProjectTasksInputSchema = z.object({
  project_id: z.number()
});

export type GetProjectTasksInput = z.infer<typeof getProjectTasksInputSchema>;
