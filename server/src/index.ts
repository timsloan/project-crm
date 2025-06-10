
import { initTRPC, TRPCError } from '@trpc/server';
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
  getProjectNotesInputSchema,
  signupInputSchema,
  loginInputSchema
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
import { signup } from './handlers/signup';
import { login } from './handlers/login';

// Context type
interface Context {
  userId?: number;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

// Protected procedure that requires authentication
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // now non-nullable
    },
  });
});

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Auth routes
  signup: publicProcedure
    .input(signupInputSchema)
    .mutation(({ input }) => signup(input)),
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

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

  // Project routes (protected)
  createProject: protectedProcedure
    .input(createProjectInputSchema)
    .mutation(({ input, ctx }) => createProject(input, ctx.userId)),
  getProjects: protectedProcedure
    .query(() => getProjects()),
  getProject: protectedProcedure
    .input(getProjectInputSchema)
    .query(({ input }) => getProject(input)),
  updateProject: protectedProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),

  // Project Wiki routes (protected)
  createProjectWiki: protectedProcedure
    .input(createProjectWikiInputSchema)
    .mutation(({ input, ctx }) => createProjectWiki(input, ctx.userId)),
  getProjectWikiHistory: protectedProcedure
    .input(getProjectWikiHistoryInputSchema)
    .query(({ input }) => getProjectWikiHistory(input)),

  // Task routes (protected)
  createTask: protectedProcedure
    .input(createTaskInputSchema)
    .mutation(({ input, ctx }) => createTask(input, ctx.userId)),
  getProjectTasks: protectedProcedure
    .input(getProjectTasksInputSchema)
    .query(({ input }) => getProjectTasks(input)),
  updateTask: protectedProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  // Note routes (protected)
  createNote: protectedProcedure
    .input(createNoteInputSchema)
    .mutation(({ input, ctx }) => createNote(input, ctx.userId)),
  getProjectNotes: protectedProcedure
    .input(getProjectNotesInputSchema)
    .query(({ input, ctx }) => getProjectNotes(input, ctx.userId)),
  updateNote: protectedProcedure
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
    createContext({ req }): Context {
      // For now, we'll simulate user authentication via headers
      // In a real app, you'd parse JWT tokens or session cookies
      const userId = req.headers['x-user-id'];
      return {
        userId: userId ? parseInt(userId as string) : undefined,
      };
    },
  });
  server.listen(port);
  console.log(`Social CRM TRPC server listening at port: ${port}`);
}

start();
