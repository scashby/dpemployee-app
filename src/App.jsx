import React, { useState, useEffect } from 'react';
import { supabase } from './supabase/supabaseClient';
import './App.css';
import './styles/admin.css';

// Import components
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Events from './pages/Events';
import AdminPanel from './components/AdminPanel';

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        // Get user profile
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
      
      // Set up auth state listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
          if (session) {
            fetchUserProfile(session.user.id);
          } else {
            setUser(null);
            setIsAdmin(false);
            setLoading(false);
          }
        }
      );
      
      return () => subscription.unsubscribe();
    };
    
    checkSession();
  }, []);
  
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setUser(data);
        setIsAdmin(data.is_admin || false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('dashboard');
  };
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'schedule':
        return <Schedule user={user} />;
      case 'events':
        return <Events />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <Dashboard user={user} />;
      default:
        return <Dashboard user={user} />;
    }
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="app">
      <Header 
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;