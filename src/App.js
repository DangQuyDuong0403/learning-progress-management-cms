import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import CONFIG_ROUTER from "./routers/configRouter";
import PrivateRoute from "./routers/PrivateRoute";
import SpaceToastify from "../src/component/SpaceToastify";
import { useAuthMonitor } from "./utils/useAuthMonitor";

export default function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const authState = useSelector((state) => state.auth);
  
  // Monitor authentication state across tabs
  useAuthMonitor();
  
  console.log('App.js - isAuthenticated:', isAuthenticated);
  console.log('App.js - authState:', authState);
  console.log('App.js - process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* redirect "/" -> "/login" */}
          <Route path="/" element={<Navigate to="/choose-login" replace />} />

          {CONFIG_ROUTER.map(({ path, component: Component, key, private: isPrivate }) =>
            isPrivate ? (
              <Route
                key={key}
                path={path}
                element={
                  <PrivateRoute>
                    <Component />
                  </PrivateRoute>
                }
              />
            ) : (
              <Route key={key} path={path} element={<Component />} />
            )
          )}
        </Routes>
      </Router>
      <SpaceToastify />
    </ThemeProvider>
  );
}
