import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider } from "./contexts/ThemeContext";
import CONFIG_ROUTER from "./routers/configRouter";
import PrivateRoute from "./routers/PrivateRoute";
import  SpaceToastify  from "../src/component/SpaceToastify";
export default function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

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
