import { useState } from "react";
import "./index.css";
import { Layout } from "./components/Layout";
import { LoginScreen } from "./components/LoginScreen";
import { EmployeeBalance } from "./components/EmployeeBalance";
import { EmployerDashboard } from "./components/EmployerDashboard";
import { ApprovalScreen } from "./components/ApprovalScreen";
import { AdminPanel } from "./components/AdminPanel";
import { GuideAgent } from "./components/GuideAgent";

type View = "login" | "employee" | "employer" | "approvals" | "admin";

function App() {
  const [currentView, setCurrentView] = useState<View>("login");
  const go = (view: string) => setCurrentView(view as View);

  const renderView = () => {
    switch (currentView) {
      case "login":
        return <LoginScreen onNavigate={go} />;
      case "employee":
        return <EmployeeBalance onNavigate={go} />;
      case "employer":
        return <EmployerDashboard onNavigate={go} />;
      case "approvals":
        return <ApprovalScreen onNavigate={go} />;
      case "admin":
        return <AdminPanel onNavigate={go} />;
      default:
        return <LoginScreen onNavigate={go} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={go}>
      {renderView()}
      <GuideAgent />
    </Layout>
  );
}

export default App;
