import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './store/AuthContext/AuthContext.tsx'
import { CustomerProvider } from './store/MasterContext/CustomerContext.tsx'
import { TicketProvider } from './store/MasterContext/TicketContext.tsx'
import { AdminProvider } from './store/MasterContext/AdminContext.tsx'
import { RequestProvider } from './store/MasterContext/RequestContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CustomerProvider>
         <TicketProvider>
          <AdminProvider>
            <RequestProvider>
    <App />
            </RequestProvider>
    </AdminProvider>
    </TicketProvider>
    </CustomerProvider>
    </AuthProvider>
  </StrictMode>,
)
