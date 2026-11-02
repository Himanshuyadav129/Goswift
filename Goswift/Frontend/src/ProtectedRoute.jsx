import { Navigate } from "react-router-dom";
import { getToken, getUser } from "./api";

// Where each kind of person lands after logging in
export const homeFor = (role) => (role === "admin" ? "/admin" : role === "driver" ? "/driver" : "/");

// roles (optional): e.g. roles={["admin"]}. Without it, any logged-in user can enter.
const ProtectedRoute = ({ children, roles }) => {
  if (!getToken()) return <Navigate to="/login" replace />;

  if (roles) {
    const user = getUser();
    if (!user) return <Navigate to="/login" replace />;
    if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  }

  return children;
};

// For /login and /signup: someone who is already logged in is sent to their own page
// (they stay logged in until they press Logout).
export const GuestRoute = ({ children }) => {
  const user = getUser();
  if (getToken() && user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
};

export default ProtectedRoute;
