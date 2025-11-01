import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClassMenuProvider } from "./contexts/ClassMenuContext";
import { SyllabusMenuProvider } from "./contexts/SyllabusMenuContext";
import { DailyChallengeMenuProvider } from "./contexts/DailyChallengeMenuContext";
import CONFIG_ROUTER from "./routers/configRouter";
import PrivateRoute from "./routers/PrivateRoute";
import EnhancedPrivateRoute from "./routers/EnhancedPrivateRoute";
import RoleBasedPrivateRoute from "./routers/RoleBasedPrivateRoute";
import SpaceToastify from "../src/component/SpaceToastify";
import CustomCursor from "./component/cursor/CustomCursor";
import TextTranslator from "./component/TextTranslator";
import { useAuthMonitor } from "./utils/useAuthMonitor";

export default function App() {
  // Monitor authentication state across tabs
  useAuthMonitor();
  
  return (
    <ThemeProvider>
      <ClassMenuProvider>
        <SyllabusMenuProvider>
          <DailyChallengeMenuProvider>
            <Router>
            <Routes>
              {/* redirect "/" -> "/login" */}
              <Route path="/" element={<Navigate to="/choose-login" replace />} />

            {CONFIG_ROUTER.map(({ path, component: Component, key, private: isPrivate, role, roleBased }) => {
              // Xác định loại route protection cần sử dụng
              if (!isPrivate) {
                return <Route key={key} path={path} element={<Component />} />;
              }

              // Bất kỳ route private nào có chỉ định role (string hoặc array) đều dùng RoleBasedPrivateRoute
              if (role) {
                return (
                  <Route
                    key={key}
                    path={path}
                    element={
                      <RoleBasedPrivateRoute requiredRoles={Array.isArray(role) ? role : [role]}>
                        <Component />
                      </RoleBasedPrivateRoute>
                    }
                  />
                );
              }

              // Default private routes
              return (
                <Route
                  key={key}
                  path={path}
                  element={
                    <PrivateRoute>
                      <Component />
                    </PrivateRoute>
                  }
                />
              );
            })}
            </Routes>
            <SpaceToastify />
          </Router>
          <CustomCursor />
          <TextTranslator enabled={true} />
          </DailyChallengeMenuProvider>
        </SyllabusMenuProvider>
      </ClassMenuProvider>
    </ThemeProvider>
  );
}
