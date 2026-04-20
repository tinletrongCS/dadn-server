import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  return children;
}

function Home() {
  const { user, logout } = useAuth();
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <h2>Yolo Farm Dashboard</h2>
        <div className="user-info">
          <span>Welcome, {user?.full_name || user?.username || 'User'}!</span>
          <button onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </header>
      <main className="dashboard-content">
        <div className="card">
          <h3>Farm Status</h3>
          <p>Your connected devices and sensors will appear here.</p>
        </div>
      </main>
    </div>
  );
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
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
