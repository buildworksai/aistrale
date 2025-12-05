import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tokens from './pages/Tokens';
import Inference from './pages/Inference';
import Telemetry from './pages/Telemetry';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/tokens" element={<Tokens />} />
        <Route path="/inference" element={<Inference />} />
        <Route path="/telemetry" element={<Telemetry />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
