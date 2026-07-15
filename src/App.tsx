import React, { useState, useEffect } from 'react';
import { testConnection, seedDatabaseIfEmpty } from './firebase';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function initApp() {
      // 1. Verify Firestore connectivity & Seed data if empty
      await testConnection();
      await seedDatabaseIfEmpty();

      // 2. Load cached user from localStorage to persist sessions
      const cached = localStorage.getItem('ejc_current_user');
      if (cached) {
        try {
          setCurrentUser(JSON.parse(cached));
        } catch (e) {
          console.error("Failed to parse cached user", e);
        }
      }
      setIsInitializing(false);
    }
    initApp();
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('ejc_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ejc_current_user');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-indigo-950 flex flex-col items-center justify-center text-white p-4">
        <div className="h-10 w-10 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold font-display tracking-wider uppercase text-indigo-200">
          Iniciando EJC Regresso...
        </h2>
        <p className="text-xs text-indigo-400/80 mt-1">Verificando conexão com o servidor</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {currentUser ? (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
