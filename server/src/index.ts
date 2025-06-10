
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createCompanyInputSchema,
  createTeamInputSchema,
  createUserInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  getProjectInputSchema,
  createProjectWikiInputSchema,
  getProjectWikiHistoryInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  getProjectTasksInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema,
  getProjectNotesInputSchema
} from './schema';

// Import handlers
import { createCompany } from './handlers/create_company';
import { getCompanies } from './handlers/get_companies';
import { createTeam } from './handlers/create_team';
import { getTeams } from './handlers/get_teams';
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getProject } from './handlers/get_project';
import { updateProject } from './handlers/update_project';
import { createProjectWiki } from './handlers/create_project_wiki';
import { getProjectWikiHistory } from './handlers/get_project_wiki_history';
import { createTask } from './handlers/create_task';
import { getProjectTasks } from './handlers/get_project_tasks';
import { updateTask } from './handlers/update_task';
import { createNote } from './handlers/create_note';
import { getProjectNotes } from './handlers/get_project_notes';
import { updateNote } from './handlers/update_note';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Company routes
  createCompany: publicProcedure
    .input(createCompanyInputSchema)
    .mutation(({ input }) => createCompany(input)),
  getCompanies: publicProcedure
    .query(() => getCompanies()),

  // Team routes
  createTeam: publicProcedure
    .input(createTeamInputSchema)
    .mutation(({ input }) => createTeam(input)),
  getTeams: publicProcedure
    .query(() => getTeams()),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),

  // Project routes
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),
  getProjects: publicProcedure
    .query(() => getProjects()),
  getProject: publicProcedure
    .input(getProjectInputSchema)
    .query(({ input }) => getProject(input)),
  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),

  // Project Wiki routes
  createProjectWiki: publicProcedure
    .input(createProjectWikiInputSchema)
    .mutation(({ input }) => createProjectWiki(input)),
  getProjectWikiHistory: publicProcedure
    .input(getProjectWikiHistoryInputSchema)
    .query(({ input }) => getProjectWikiHistory(input)),

  // Task routes
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  getProjectTasks: publicProcedure
    .input(getProjectTasksInputSchema)
    .query(({ input }) => getProjectTasks(input)),
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  // Note routes
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),
  getProjectNotes: publicProcedure
    .input(getProjectNotesInputSchema)
    .query(({ input }) => getProjectNotes(input)),
  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input }) => updateNote(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Social CRM TRPC server listening at port: ${port}`);
}

start();
