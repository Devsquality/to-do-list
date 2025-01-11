import React, { useEffect, useState } from 'react';
import { Loader2, LogIn, LogOut, Plus, Trash2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTodos();
    }
  }, [session]);

  async function fetchTodos() {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error fetching todos');
    } else {
      setTodos(data || []);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed up successfully!');
      // Auto sign in after sign up since email confirmation is disabled
      await handleSignIn(e);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully!');
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    }
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { error } = await supabase
      .from('todos')
      .insert([{ title: newTodo, user_id: session.user.id }]);

    if (error) {
      toast.error('Error adding todo');
    } else {
      setNewTodo('');
      fetchTodos();
    }
  }

  async function toggleTodo(id: string, completed: boolean) {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      toast.error('Error updating todo');
    } else {
      fetchTodos();
    }
  }

  async function deleteTodo(id: string) {
    const { error } = await supabase.from('todos').delete().eq('id', id);

    if (error) {
      toast.error('Error deleting todo');
    } else {
      fetchTodos();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6 text-center">Todo List App</h1>
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-500 hover:text-blue-600"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Todo List</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          <form onSubmit={addTodo} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new todo..."
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </form>

          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-md"
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id, todo.completed)}
                  className="h-4 w-4 text-blue-500 rounded focus:ring-blue-400"
                />
                <span
                  className={`flex-1 ${
                    todo.completed ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {todo.title}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;