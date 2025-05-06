import { useState } from 'react';
import Header from './components/Header';
import AdminPanel from './components/AdminPanel';
import './styles/admin.css';

function App() {
  // Set initial view to 'admin' for testing purposes
  const [currentView, setCurrentView] = useState('admin');
  
  return (
    <div className="app">
      <Header />
      <div className="content">
        {currentView === 'admin' && <AdminPanel />}
      </div>
    </div>
  );
}

export default App;