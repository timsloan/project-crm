import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Building2, CheckSquare, FileText, Plus, Eye, Lock, LogIn, UserPlus, LogOut } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  Project, 
  Company, 
  User, 
  Task, 
  Note, 
  CreateProjectInput, 
  CreateTaskInput, 
  CreateNoteInput,
  SignupInput,
  LoginInput,
  AuthResponse
} from '../../server/src/schema';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectTasks, setSelectedProjectTasks] = useState<Task[]>([]);
  const [selectedProjectNotes, setSelectedProjectNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  // Auth form states
  const [loginForm, setLoginForm] = useState<LoginInput>({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState<SignupInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });

  // Form states
  const [projectForm, setProjectForm] = useState<CreateProjectInput>({
    name: '',
    description: null,
    status: 'planning',
    estimated_value: null,
    start_date: null,
    end_date: null,
    company_id: 0
  });

  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    title: '',
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    project_id: 0,
    assigned_to: null
  });

  const [noteForm, setNoteForm] = useState<CreateNoteInput>({
    content: '',
    is_private: false,
    project_id: 0
  });

  // Check for existing auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setLoggedInUser(user);
      setIsLoggedIn(true);
    }
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const [projectsData, companiesData, usersData] = await Promise.all([
        trpc.getProjects.query(),
        trpc.getCompanies.query(),
        trpc.getUsers.query()
      ]);
      setProjects(projectsData);
      setCompanies(companiesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load project details when selected
  const loadProjectDetails = useCallback(async (projectId: number) => {
    try {
      const [tasks, notes] = await Promise.all([
        trpc.getProjectTasks.query({ project_id: projectId }),
        trpc.getProjectNotes.query({ project_id: projectId })
      ]);
      setSelectedProjectTasks(tasks);
      setSelectedProjectNotes(notes);
    } catch (error) {
      console.error('Failed to load project details:', error);
    }
  }, []);

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    loadProjectDetails(project.id);
    setActiveTab('overview');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response: AuthResponse = await trpc.login.mutate(loginForm);
      setLoggedInUser(response.user);
      setIsLoggedIn(true);
      localStorage.setItem('loggedInUser', JSON.stringify(response.user));
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      console.error('Failed to login:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response: AuthResponse = await trpc.signup.mutate(signupForm);
      setLoggedInUser(response.user);
      setIsLoggedIn(true);
      localStorage.setItem('loggedInUser', JSON.stringify(response.user));
      setSignupForm({ email: '', password: '', first_name: '', last_name: '' });
    } catch (error) {
      console.error('Failed to signup:', error);
      alert('Signup failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('loggedInUser');
    setProjects([]);
    setCompanies([]);
    setUsers([]);
    setSelectedProject(null);
    setSelectedProjectTasks([]);
    setSelectedProjectNotes([]);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.company_id) return;
    
    setIsLoading(true);
    try {
      const newProject = await trpc.createProject.mutate(projectForm);
      setProjects((prev: Project[]) => [...prev, newProject]);
      setProjectForm({
        name: '',
        description: null,
        status: 'planning',
        estimated_value: null,
        start_date: null,
        end_date: null,
        company_id: 0
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const taskData = { ...taskForm, project_id: selectedProject.id };
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(taskData);
      setSelectedProjectTasks((prev: Task[]) => [...prev, newTask]);
      setTaskForm({
        title: '',
        description: null,
        status: 'todo',
        priority: 'medium',
        due_date: null,
        project_id: 0,
        assigned_to: null
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const noteData = { ...noteForm, project_id: selectedProject.id };
    setIsLoading(true);
    try {
      const newNote = await trpc.createNote.mutate(noteData);
      setSelectedProjectNotes((prev: Note[]) => [...prev, newNote]);
      setNoteForm({
        content: '',
        is_private: false,
        project_id: 0
      });
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      case 'in_progress': return 'bg-orange-500';
      case 'todo': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getCompanyName = (companyId: number) => {
    const company = companies.find((c: Company) => c.id === companyId);
    return company?.name || 'Unknown Company';
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Unassigned';
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  // Render login/signup forms if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">🏗️ Construction CRM</h1>
            </div>
            <CardTitle className="text-center">Welcome to Construction CRM</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center space-x-1">
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center space-x-1">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                    }
                    required
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <Input
                    placeholder="First Name"
                    value={signupForm.first_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSignupForm((prev: SignupInput) => ({ ...prev, first_name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    placeholder="Last Name"
                    value={signupForm.last_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSignupForm((prev: SignupInput) => ({ ...prev, last_name: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={signupForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSignupForm((prev: SignupInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password (min 6 characters)"
                    value={signupForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSignupForm((prev: SignupInput) => ({ ...prev, password: e.target.value }))
                    }
                    required
                    minLength={6}
                  />
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Signing up...' : 'Sign Up'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">🏗️ Construction CRM</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="px-3 py-1">
              Sales Team Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Welcome, {loggedInUser?.first_name}!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Projects List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Projects</span>
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <Input
                        placeholder="Project name"
                        value={projectForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProjectForm((prev: CreateProjectInput) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                      <Textarea
                        placeholder="Project description"
                        value={projectForm.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setProjectForm((prev: CreateProjectInput) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                      />
                      <Select 
                        value={projectForm.status} 
                        onValueChange={(value: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled') =>
                          setProjectForm((prev: CreateProjectInput) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Project status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select 
                        value={projectForm.company_id.toString()} 
                        onValueChange={(value: string) =>
                          setProjectForm((prev: CreateProjectInput) => ({ ...prev, company_id: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company: Company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Estimated value ($)"
                        value={projectForm.estimated_value || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProjectForm((prev: CreateProjectInput) => ({
                            ...prev,
                            estimated_value: parseFloat(e.target.value) || null
                          }))
                        }
                        step="0.01"
                        min="0"
                      />
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Creating...' : 'Create Project'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {projects.map((project: Project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedProject?.id === project.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                      <Badge className={`text-xs ${getStatusBadgeColor(project.status)} text-white`}>
                        {project.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{getCompanyName(project.company_id)}</p>
                    {project.estimated_value && (
                      <p className="text-xs font-medium text-green-600">
                        ${project.estimated_value.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No projects yet. Create one to get started! 🚧</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedProject.name}</CardTitle>
                      <p className="text-gray-600 mt-1">{getCompanyName(selectedProject.company_id)}</p>
                    </div>
                    <Badge className={`${getStatusBadgeColor(selectedProject.status)} text-white`}>
                      {selectedProject.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview" className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>Overview</span>
                      </TabsTrigger>
                      <TabsTrigger value="tasks" className="flex items-center space-x-1">
                        <CheckSquare className="h-4 w-4" />
                        <span>Tasks</span>
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Notes</span>
                      </TabsTrigger>
                      <TabsTrigger value="wiki" className="flex items-center space-x-1">
                        <FileText className="h-4 w-4" />
                        <span>Wiki</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h3 className="font-semibold">Project Details</h3>
                          {selectedProject.description && (
                            <p className="text-gray-700">{selectedProject.description}</p>
                          )}
                          {selectedProject.estimated_value && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Estimated Value:</span>
                              <span className="font-semibold text-green-600">
                                ${selectedProject.estimated_value.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Created: {selectedProject.created_at.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-semibold">Quick Stats</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {selectedProjectTasks.length}
                              </div>
                              <div className="text-xs text-blue-600">Total Tasks</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {selectedProjectTasks.filter((t: Task) => t.status === 'completed').length}
                              </div>
                              <div className="text-xs text-green-600">Completed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4 mt-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Project Tasks</h3>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Task
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Task</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                              <Input
                                placeholder="Task title"
                                value={taskForm.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setTaskForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                                }
                                required
                              />
                              <Textarea
                                placeholder="Task description"
                                value={taskForm.description || ''}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setTaskForm((prev: CreateTaskInput) => ({
                                    ...prev,
                                    description: e.target.value || null
                                  }))
                                }
                              />
                              <Select 
                                value={taskForm.priority} 
                                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                                  setTaskForm((prev: CreateTaskInput) => ({ ...prev, priority: value }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low Priority</SelectItem>
                                  <SelectItem value="medium">Medium Priority</SelectItem>
                                  <SelectItem value="high">High Priority</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select 
                                value={taskForm.assigned_to?.toString() || ''} 
                                onValueChange={(value: string) =>
                                  setTaskForm((prev: CreateTaskInput) => ({
                                    ...prev,
                                    assigned_to: value ? parseInt(value) : null
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Assign to user" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((user: User) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                      {user.first_name} {user.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Creating...' : 'Create Task'}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedProjectTasks.map((task: Task) => (
                          <div key={task.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium">{task.title}</h4>
                              <div className="flex space-x-2">
                                <Badge className={`text-xs ${getPriorityColor(task.priority)} text-white`}>
                                  {task.priority}
                                </Badge>
                                <Badge className={`text-xs ${getStatusBadgeColor(task.status)} text-white`}>
                                  {task.status}
                                </Badge>
                              </div>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <span>Assigned to: {getUserName(task.assigned_to)}</span>
                              {task.due_date && (
                                <span>Due: {task.due_date.toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedProjectTasks.length === 0 && (
                          <p className="text-gray-500 text-center py-8">No tasks yet. Add one to get started! ✅</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="space-y-4 mt-6">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Project Notes</h3>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Note
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Note</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateNote} className="space-y-4">
                              <Textarea
                                placeholder="Write your note..."
                                value={noteForm.content}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setNoteForm((prev: CreateNoteInput) => ({ ...prev, content: e.target.value }))
                                }
                                rows={4}
                                required
                              />
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="private"
                                  checked={noteForm.is_private}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setNoteForm((prev: CreateNoteInput) => ({ ...prev, is_private: e.target.checked }))
                                  }
                                />
                                <label htmlFor="private" className="text-sm">Make this note private</label>
                              </div>
                              <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? 'Creating...' : 'Create Note'}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedProjectNotes.map((note: Note) => (
                          <div key={note.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {getUserName(note.created_by)}
                                </span>
                                {note.is_private && (
                                  <Badge variant="outline" className="text-xs">
                                    <Lock className="h-3 w-3 mr-1" />
                                    Private
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {note.created_at.toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{note.content}</p>
                          </div>
                        ))}
                        {selectedProjectNotes.length === 0 && (
                          <p className="text-gray-500 text-center py-8">No notes yet. Add one to start documenting! 📝</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="wiki" className="space-y-4 mt-6">
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Project Wiki</h3>
                        <p className="text-gray-500 mb-4">
                          Document project scope, changes, and contacts with full version history.
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-1" />
                          Create Wiki Page
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-96">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Welcome to Construction CRM</h3>
                    <p className="text-gray-500">
                      Select a project from the sidebar to view details, tasks, and notes. 🏗️
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;