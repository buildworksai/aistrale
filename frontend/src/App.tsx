import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tokens from './pages/Tokens';
import Inference from './pages/Inference';
import Telemetry from './pages/Telemetry';
import Prompts from './pages/Prompts';
import Users from './pages/Users';
import SecurityAudit from './pages/SecurityAudit';
import SecurityDashboard from './pages/SecurityDashboard';
import CostDashboard from './pages/CostDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import ReliabilityDashboard from './pages/ReliabilityDashboard';
import DeveloperSettings from './pages/DeveloperSettings';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/tokens" element={<Tokens />} />
        <Route path="/inference" element={<Inference />} />
        <Route path="/telemetry" element={<Telemetry />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/users" element={<Users />} />
        <Route path="/security-audit" element={<SecurityAudit />} />
        <Route path="/security-compliance" element={<SecurityDashboard />} />
        <Route path="/cost-optimization" element={<CostDashboard />} />
        <Route path="/provider-intelligence" element={<ProviderDashboard />} />
        <Route path="/reliability" element={<ReliabilityDashboard />} />
        <Route path="/developer-settings" element={<DeveloperSettings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
