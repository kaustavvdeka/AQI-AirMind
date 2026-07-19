import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MapPage from "./pages/MapPage.jsx";
import SatellitePage from "./pages/SatellitePage.jsx";
import Prediction from "./pages/Prediction.jsx";
import CitizenPortal from "./pages/CitizenPortal.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MultiCityPage from "./pages/MultiCityPage.jsx";
import SimulatorPage from "./pages/SimulatorPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/satellite" element={<SatellitePage />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/multi-city" element={<MultiCityPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/citizen" element={<CitizenPortal />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </LocationProvider>
    </AuthProvider>
  );
}
