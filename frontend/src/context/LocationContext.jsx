import { createContext, useContext, useState } from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState("Guwahati");
  const [coords, setCoords] = useState({ lat: 26.1445, lon: 91.7362 });
  const [aqi, setAqi] = useState(null);

  return (
    <LocationContext.Provider value={{ location, setLocation, coords, setCoords, aqi, setAqi }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
