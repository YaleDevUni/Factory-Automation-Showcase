import { Routes, Route, Link } from 'react-router-dom';
import HMI from './hmi/pages/HMI';
import Dashboard from './dashboard/pages/Dashboard';
import './App.css';

function App() {
  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to="/hmi">HMI</Link>
          </li>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
        </ul>
      </nav>
      <Routes>
        <Route path="/hmi" element={<HMI />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;