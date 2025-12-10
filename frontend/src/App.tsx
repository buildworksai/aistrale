import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Logout from './pages/Logout';
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
import Workspaces from './pages/Workspaces';
import Projects from './pages/Projects';
import Permissions from './pages/Permissions';
import Compliance from './pages/Compliance';
import DataResidency from './pages/DataResidency';
import DLP from './pages/DLP';
import Budgets from './pages/Budgets';
import CostForecasting from './pages/CostForecasting';
import OptimizationRecommendations from './pages/OptimizationRecommendations';
import ProviderHealth from './pages/ProviderHealth';
import Failover from './pages/Failover';
import ProviderComparison from './pages/ProviderComparison';
import ABTesting from './pages/ABTesting';
import ModelAbstraction from './pages/ModelAbstraction';
import SmartRouting from './pages/SmartRouting';
import SDKs from './pages/SDKs';
import Webhooks from './pages/Webhooks';
import QueueManagement from './pages/QueueManagement';
import CircuitBreakers from './pages/CircuitBreakers';
import LoadBalancing from './pages/LoadBalancing';
import Evaluation from './pages/Evaluation';
import PromptOptimization from './pages/PromptOptimization';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/tokens" element={<ProtectedRoute><Tokens /></ProtectedRoute>} />
        <Route path="/inference" element={<ProtectedRoute><Inference /></ProtectedRoute>} />
        <Route path="/telemetry" element={<ProtectedRoute><Telemetry /></ProtectedRoute>} />
        <Route path="/prompts" element={<ProtectedRoute><Prompts /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/security-audit" element={<ProtectedRoute><SecurityAudit /></ProtectedRoute>} />
        <Route path="/security-compliance" element={<ProtectedRoute><SecurityDashboard /></ProtectedRoute>} />
        <Route path="/cost-optimization" element={<ProtectedRoute><CostDashboard /></ProtectedRoute>} />
        <Route path="/provider-intelligence" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/reliability" element={<ProtectedRoute><ReliabilityDashboard /></ProtectedRoute>} />
        <Route path="/reliability-dashboard" element={<ProtectedRoute><ReliabilityDashboard /></ProtectedRoute>} />
        <Route path="/developer-settings" element={<ProtectedRoute><DeveloperSettings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/workspaces" element={<ProtectedRoute><Workspaces /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
        <Route path="/data-residency" element={<ProtectedRoute><DataResidency /></ProtectedRoute>} />
        <Route path="/dlp" element={<ProtectedRoute><DLP /></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
        <Route path="/cost-forecasting" element={<ProtectedRoute><CostForecasting /></ProtectedRoute>} />
        <Route path="/optimization-recommendations" element={<ProtectedRoute><OptimizationRecommendations /></ProtectedRoute>} />
        <Route path="/provider-health" element={<ProtectedRoute><ProviderHealth /></ProtectedRoute>} />
        <Route path="/failover" element={<ProtectedRoute><Failover /></ProtectedRoute>} />
        <Route path="/provider-comparison" element={<ProtectedRoute><ProviderComparison /></ProtectedRoute>} />
        <Route path="/ab-testing" element={<ProtectedRoute><ABTesting /></ProtectedRoute>} />
        <Route path="/model-abstraction" element={<ProtectedRoute><ModelAbstraction /></ProtectedRoute>} />
        <Route path="/smart-routing" element={<ProtectedRoute><SmartRouting /></ProtectedRoute>} />
        <Route path="/sdks" element={<ProtectedRoute><SDKs /></ProtectedRoute>} />
        <Route path="/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
        <Route path="/queue-management" element={<ProtectedRoute><QueueManagement /></ProtectedRoute>} />
        <Route path="/circuit-breakers" element={<ProtectedRoute><CircuitBreakers /></ProtectedRoute>} />
        <Route path="/load-balancing" element={<ProtectedRoute><LoadBalancing /></ProtectedRoute>} />
        <Route path="/evaluation" element={<ProtectedRoute><Evaluation /></ProtectedRoute>} />
        <Route path="/prompt-optimization" element={<ProtectedRoute><PromptOptimization /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
