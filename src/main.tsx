import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { printEnvStatus } from './utils/checkEnv'

// 开发环境下检查环境变量配置
if (import.meta.env.DEV) {
  printEnvStatus()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

