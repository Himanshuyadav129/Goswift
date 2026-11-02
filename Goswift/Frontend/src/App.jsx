import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard";
import DriverPanel from "./DriverPanel";
import About from "./About";
import Login from "./Login";
import Register from "./Register";
import Track from "./Track";
import Admin from "./Admin";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import ProtectedRoute, { GuestRoute } from "./ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/track" element={<Track />} />

        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><Register /></GuestRoute>} />

        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/driver"
          element={
            <ProtectedRoute roles={["driver", "admin"]}>
              <DriverPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<h1>404 Page Not Found</h1>} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;