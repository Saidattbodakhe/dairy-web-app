import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import LocationIndicator from './LocationIndicator'
import LocationPicker from './LocationPicker'
import { LocationProvider } from '../context/LocationContext'

// <Outlet /> is where React Router renders whichever customer page
// matched the current URL (Home, Products, Cart, etc). Header and
// Footer stay on screen while only the middle part swaps out.
// LocationProvider is scoped here (customer-only — Admin doesn't need
// the 20km service-area check), with a small indicator bar under the
// existing Header rather than changing Header itself.
function CustomerLayout() {
  return (
    <LocationProvider>
      <Header />
      <LocationIndicator />
      <main>
        <Outlet />
      </main>
      <Footer />
      <LocationPicker />
    </LocationProvider>
  )
}

export default CustomerLayout
