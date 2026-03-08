import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard";
import DriverPanel from "./DriverPanel";
import About from "./About";
import Login from "./Login";
import Register from "./Register";
import Track from "./Track";
import Admin from "./Admin";
import ProtectedRoute from "./ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/track" element={<Track />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />

        <Route
          path="/driver"
          element={
            <ProtectedRoute>
              <DriverPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
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