import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  checkCoordinatesInServiceArea,
  checkPincodeInServiceArea,
  getServiceAreaConfig,
} from '../utils/locationService'

// All the ways the customer's delivery-location decision can sit in
// localStorage. Only one of these is ever the current `status` at rest;
// the flow moves left to right as the customer is resolved through it.
export const LOCATION_STATUS = {
  NOT_CHECKED: 'location_not_checked',
  DENIED: 'location_denied',
  SELECTED: 'location_selected',
  INSIDE: 'inside_service_area',
  OUTSIDE: 'outside_service_area',
}

const LOCATION_STORAGE_KEY = 'dairy_location_state'
const LocationContext = createContext(null)

const defaultState = {
  status: LOCATION_STATUS.NOT_CHECKED,
  areaLabel: null,
  distanceKm: null,
  source: null, // 'geolocation' | 'manual'
}

function loadLocationState() {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (raw) return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    // fall through to defaults below
  }
  return defaultState
}

// Everything about "is this customer inside our 20km delivery area" is
// isolated here — one Context, one localStorage key — so Home, Products,
// Cart, and Checkout all read the same decision instead of each running
// their own geolocation/pincode logic, and a future real backend swap
// only has to change this one file.
export function LocationProvider({ children }) {
  const [state, setState] = useState(loadLocationState)
  const [isLocating, setIsLocating] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const requestBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((current) => ({ ...current, status: LOCATION_STATUS.DENIED }))
      setIsPickerOpen(true)
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { withinRadius, distanceKm } = checkCoordinatesInServiceArea(
          position.coords.latitude,
          position.coords.longitude
        )
        const config = getServiceAreaConfig()

        setState({
          status: withinRadius ? LOCATION_STATUS.INSIDE : LOCATION_STATUS.OUTSIDE,
          // Coarse on purpose — never store/show the precise coordinates
          // or a street address from browser geolocation.
          areaLabel: withinRadius ? config.area : 'Your Area',
          distanceKm,
          source: 'geolocation',
        })
        setIsLocating(false)
        setIsPickerOpen(false)
      },
      () => {
        setState((current) => ({ ...current, status: LOCATION_STATUS.DENIED }))
        setIsLocating(false)
        setIsPickerOpen(true)
      },
      { timeout: 10000 }
    )
  }, [])

  // Manual fallback — no geolocation permission needed. An unrecognized
  // demo pincode defaults to "outside", per locationService.js.
  const selectManualLocation = useCallback(({ area, pincode }) => {
    const { withinRadius, distanceKm, areaLabel } = checkPincodeInServiceArea(pincode)

    setState({
      status: withinRadius ? LOCATION_STATUS.INSIDE : LOCATION_STATUS.OUTSIDE,
      areaLabel: areaLabel || area || 'Your Area',
      distanceKm,
      source: 'manual',
    })
    setIsPickerOpen(false)
  }, [])

  // "Change Location" — reopens the picker without discarding the
  // current decision until the customer actually completes a new one.
  const openLocationPicker = useCallback(() => setIsPickerOpen(true), [])
  const closeLocationPicker = useCallback(() => setIsPickerOpen(false), [])

  // Only auto-request browser geolocation once, ever — after that the
  // resolved decision is persisted and reused on every later page/visit.
  useEffect(() => {
    if (state.status === LOCATION_STATUS.NOT_CHECKED) {
      requestBrowserLocation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = {
    status: state.status,
    areaLabel: state.areaLabel,
    distanceKm: state.distanceKm,
    source: state.source,
    isLocating,
    isPickerOpen,
    isInsideServiceArea: state.status === LOCATION_STATUS.INSIDE,
    isOutsideServiceArea: state.status === LOCATION_STATUS.OUTSIDE,
    isResolved:
      state.status === LOCATION_STATUS.INSIDE || state.status === LOCATION_STATUS.OUTSIDE,
    requestBrowserLocation,
    selectManualLocation,
    openLocationPicker,
    closeLocationPicker,
  }

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useServiceLocation() {
  const context = useContext(LocationContext)
  if (!context) {
    throw new Error('useServiceLocation must be used inside a LocationProvider')
  }
  return context
}
