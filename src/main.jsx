import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CustomerCartProvider } from './context/CustomerCartContext'
import { SocketProvider } from './context/SocketContext'
import { RealtimeSyncProvider } from './context/RealtimeSyncProvider'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <RealtimeSyncProvider>
              <CartProvider>
                <CustomerCartProvider>
                  <App />
                <Toaster
                  position="top-right"
                  containerClassName="!top-4 !right-4"
                  toastOptions={{
                    duration: 3800,
                    className: "",
                    style: {
                      background: "rgba(255, 252, 241, 0.92)",
                      color: "#391000",
                      borderRadius: "1rem",
                      border: "1px solid rgba(122, 34, 0, 0.12)",
                      boxShadow:
                        "0 18px 40px rgba(57, 16, 0, 0.12), 0 0 0 1px rgba(255,255,255,0.6) inset",
                      backdropFilter: "blur(12px)",
                      padding: "14px 18px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      maxWidth: "min(92vw, 380px)",
                      whiteSpace: "pre-line",
                    },
                    success: {
                      iconTheme: { primary: "#7a2200", secondary: "#fffcf1" },
                      style: {
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                      },
                    },
                    error: {
                      iconTheme: { primary: "#b91c1c", secondary: "#fff1f2" },
                      style: {
                        border: "1px solid rgba(185, 28, 28, 0.35)",
                      },
                    },
                  }}
                />
                </CustomerCartProvider>
              </CartProvider>
              </RealtimeSyncProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  
)
