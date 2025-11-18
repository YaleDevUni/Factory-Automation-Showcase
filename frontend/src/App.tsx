import { Routes, Route, Link, Navigate } from 'react-router-dom';
import HMI from './hmi/pages/HMI';
import Dashboard from './dashboard/pages/Dashboard';

function App() {
  return (
    <>
      <nav className="bg-gray-800 p-4 shadow-lg">
        <ul className="flex space-x-4 justify-center">
          <li>
            <Link to="/hmi" className="text-white hover:text-blue-400 text-lg font-semibold px-3 py-2 rounded-md transition-colors duration-200">HMI</Link>
          </li>
          <li>
            <Link to="/dashboard" className="text-white hover:text-blue-400 text-lg font-semibold px-3 py-2 rounded-md transition-colors duration-200">Dashboard</Link>
          </li>
        </ul>
      </nav>  
      <Routes>
        <Route path="/" element={<Navigate to="/hmi" />} />
        <Route path="/hmi" element={<HMI />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;