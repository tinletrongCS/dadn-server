import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout'
import Home from './pages/Home'
import Activity from './pages/Activity'
import Account from './pages/Account'
import Devices from './pages/Devices'
import Statistics from './pages/Statistics'
import SensorHistory from './pages/SensorHistory'
import Overview from './pages/Overview'
import AddDevice from './pages/AddDevice'
import ThresholdManagement from './pages/ThresholdManagement'
import './App.css'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Loading...</div>;
  
  // role_id = 1 is admin, role_id = 2 is normal user
  const isAdmin = user?.role_id === 1;
  if (!isAdmin) return <Navigate to="/" replace />;
  
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="dashboard" element={<Home />} />
        <Route path="activity" element={<Activity />} />
        <Route path="account" element={<Account />} />
        <Route path="statistics" element={<Statistics />} />
        <Route path="sensor-history" element={<SensorHistory />} />
        <Route path="devices" element={<Devices />} />
        <Route path="threshold-management" element={<ThresholdManagement />} />
        <Route path="devices/add" element={
          <AdminRoute>
            <AddDevice />
          </AdminRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
