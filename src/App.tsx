import { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import { Incident } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'https://incidentbackend.onrender.com/api';

type AuthMode = 'login' | 'signup';

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<{ id: number; email: string; fullName: string; role: string } | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchIncidents();
    }
  }, [token]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch incidents';
      setError(msg);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, [token]);

  const handleSignup = useCallback(async (
    fullName: string,
    email: string,
    password: string,
    role: 'admin' | 'user'
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleAdd = async (incident: Incident) => {
    try {
      const res = await fetch(`${API_URL}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(incident),
      });
      if (!res.ok) throw new Error(`Failed to create incident: ${res.statusText}`);
      const newIncident = await res.json();
      setIncidents((prev) => [...prev, newIncident]);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add incident';
      setError(msg);
    }
  };

  const handleUpdate = async (updated: Incident) => {
    try {
      const res = await fetch(`${API_URL}/incidents/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Failed to update incident: ${res.statusText}`);
      const updatedIncident = await res.json();
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updatedIncident : i)));
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update incident';
      setError(msg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/incidents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to delete incident: ${res.statusText}`);
      setIncidents((prev) => prev.filter((i) => i.id !== id));
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete incident';
      setError(msg);
    }
  };

  const handleApprove = async (updated: Incident) => {
    try {
      const res = await fetch(`${API_URL}/incidents/${updated.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`Failed to approve incident: ${res.statusText}`);
      const updatedIncident = await res.json();
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updatedIncident : i)));
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to approve incident';
      setError(msg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIncidents([]);
    setError(null);
  };

  if (!token) {
    if (authMode === 'signup') {
      return <SignupPage onSwitch={() => setAuthMode('login')} onSignup={handleSignup} />;
    }
    return <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setAuthMode('signup')} />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Connection Error</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchIncidents();
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      incidents={incidents}
      userEmail={user?.email ?? ''}
      userRole={user?.role ?? 'user'}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onApprove={handleApprove}
      onLogout={handleLogout}
    />
  );
}
