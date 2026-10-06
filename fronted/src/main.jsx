// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Portfolio from './Portfolio'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {import.meta.env.VITE_NETWORK === 'sepolia' || new URLSearchParams(window.location.search).has('showcase') ? <Portfolio /> : <App />}
  </React.StrictMode>
)
