import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext.jsx';
const root = createRoot(document.getElementById("root"));

root.render(
  <Router>

    <AuthProvider>
      <ChatProvider>
          <App />
      </ChatProvider>
    </AuthProvider>
    </Router>

)
