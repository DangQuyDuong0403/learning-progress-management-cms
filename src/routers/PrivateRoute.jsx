// src/routes/PrivateRoute.jsx
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authState = useSelector((state) => state.auth);
  
  console.log('PrivateRoute - isAuthenticated:', isAuthenticated);
  console.log('PrivateRoute - authState:', authState);
  
  return isAuthenticated ? children : <Navigate to="/choose-login" replace />;
};

export default PrivateRoute;
