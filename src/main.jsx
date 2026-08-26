import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext.jsx'
import { ProductProvider } from './context/ProductContext.jsx'

// BrowserRouter turns on URL-based navigation for the whole app.
// AuthProvider/AdminAuthProvider/CartProvider/ProductProvider make the
// customer login, admin login, cart, and product catalog available to
// every page via their hooks, without passing them down as props
// through every component. ProductProvider is the one source of truth
// for product data — both customer pages and Admin Products read and
// write through it.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/dairy-web-app/">
      <AuthProvider>
        <AdminAuthProvider>
          <ProductProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ProductProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
