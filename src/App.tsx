import { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import IncidentManagementPage from './components/IncidentManagementPage';
import { Incident, IncidentManagement } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'https://incidentbackend.onrender.com/api';
const MODE_KEY = 'app_mode';

type PageMode = 'incidents' | 'incident-management';
type UserRole = 'admin' | 'risk' | 'incident' | 'user';
type User = { id: number; email: string; fullName: string; role: UserRole };

const modeFromPath = (): PageMode => (
  window.location.pathname.toLowerCase().includes('risk') ? 'incidents' : 'incident-management'
);

const modeConfig = {
  incidents: {
    appName: 'Risk Management',
    subtitle: 'Risk assessment and scoring',
    defaultEmail: 'risk@company.com',
    demoPassword: 'risk123',
    expectedRole: 'risk' as UserRole,
    tokenKey: 'risk_token',
    userKey: 'risk_user',
  },
  'incident-management': {
    appName: 'Incident Management',
    subtitle: 'Incident tracking and resolution',
    defaultEmail: 'incident@company.com',
    demoPassword: 'incident123',
    expectedRole: 'incident' as UserRole,
    tokenKey: 'incident_token',
    userKey: 'incident_user',
  },
};

export default function App() {
  const [showSignup, setShowSignup] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>(() => modeFromPath());
  const activeMode = modeConfig[pageMode];
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(modeConfig[modeFromPath()].tokenKey));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(modeConfig[modeFromPath()].userKey);
    return stored ? JSON.parse(stored) : null;
  });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentManagements, setIncidentManagements] = useState<IncidentManagement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mode = modeFromPath();
    setPageMode(mode);
    localStorage.setItem(MODE_KEY, mode);
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(true);
      if (pageMode === 'incident-management') {
        fetchIncidentManagements();
      } else {
        fetchIncidents();
      }
    }
  }, [token, pageMode]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/incidents`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidentManagements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/incident-management`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setIncidentManagements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
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

      if (data.user.role !== activeMode.expectedRole && data.user.role !== 'admin') {
        return false;
      }

      localStorage.setItem(activeMode.tokenKey, data.token);
      localStorage.setItem(activeMode.userKey, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, [activeMode]);

  const handleSignup = useCallback(async (fullName: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role }),
      });
      if (!res.ok) return false;
      const data = await res.json();

      if (data.user.role !== activeMode.expectedRole && data.user.role !== 'admin') {
        return false;
      }

      localStorage.setItem(activeMode.tokenKey, data.token);
      localStorage.setItem(activeMode.userKey, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }, [activeMode]);

  const handleAdd = async (incident: Incident) => {
    try {
      const res = await fetch(`${API_URL}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(incident),
      });
      if (!res.ok) throw new Error('Failed');
      const newIncident = await res.json();
      setIncidents((prev) => [...prev, newIncident]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleUpdate = async (updated: Incident) => {
    try {
      const res = await fetch(`${API_URL}/incidents/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed');
      const updatedIncident = await res.json();
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updatedIncident : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/incidents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      setIncidents((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(activeMode.tokenKey);
    localStorage.removeItem(activeMode.userKey);
    setToken(null);
    setUser(null);
    setIncidents([]);
    setIncidentManagements([]);
    setError(null);
  };

  const handleAddIM = async (incident: IncidentManagement) => {
    try {
      const res = await fetch(`${API_URL}/incident-management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(incident),
      });
      if (!res.ok) throw new Error('Failed');
      const newIncident = await res.json();
      setIncidentManagements((prev) => [...prev, newIncident]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleUpdateIM = async (updated: IncidentManagement) => {
    try {
      const res = await fetch(`${API_URL}/incident-management/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed');
      const updatedIncident = await res.json();
      setIncidentManagements((prev) => prev.map((i) => (i.id === updated.id ? updatedIncident : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDeleteIM = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/incident-management/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      setIncidentManagements((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (!token) {
    return showSignup
      ? <SignupPage onSwitch={() => setShowSignup(false)} onSignup={handleSignup} />
      : (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToSignup={() => setShowSignup(true)}
          appName={activeMode.appName}
          subtitle={activeMode.subtitle}
          defaultEmail={activeMode.defaultEmail}
          demoPassword={activeMode.demoPassword}
        />
      );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading…</div>;

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="text-red-600 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-slate-600 mb-6">{error}</p>
        <button onClick={() => setError(null)} className="px-6 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
      </div>
    </div>
  );

  return (
    <div>
      {pageMode === 'incidents' ? (
        <Dashboard
          incidents={incidents}
          userEmail={user?.email ?? ''}
          userRole={user?.role ?? 'user'}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onLogout={handleLogout}
        />
      ) : (
        <IncidentManagementPage
          incidents={incidentManagements}
          userEmail={user?.email ?? ''}
          userRole={user?.role ?? 'user'}
          onAdd={handleAddIM}
          onUpdate={handleUpdateIM}
          onDelete={handleDeleteIM}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
