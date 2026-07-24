import { useState } from 'react';
import './index.css';
import { Layout } from './components/Layout';
import { LoginScreen } from './components/LoginScreen';
import { EmployeeBalance } from './components/EmployeeBalance';
import { EmployerDashboard } from './components/EmployerDashboard';
import { ApprovalScreen } from './components/ApprovalScreen';

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'employee' | 'employer' | 'approvals'>('login');
  
  // Fake router for prototype
  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginScreen onNavigate={setCurrentView} />;
      case 'employee':
        return <EmployeeBalance onNavigate={setCurrentView} />;
      case 'employer':
        return <EmployerDashboard onNavigate={setCurrentView} />;
      case 'approvals':
        return <ApprovalScreen onNavigate={setCurrentView} />;
      default:
        return <LoginScreen onNavigate={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

export default App;
