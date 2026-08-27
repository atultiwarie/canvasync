import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./features/auth/components/AuthProvider";
import ProtectedRoute from "./features/auth/components/ProtectedRoute";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import BoardsPage from "./features/boards/pages/BoardsPage";
import CanvasPage from "./features/boards/pages/CanvasPage";
import JoinBoardPage from "./features/boards/pages/JoinBoardPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Phase 4: invite link handler — public entry point, handles auth redirect internally */}
          <Route path="/join/:token" element={<JoinBoardPage />} />

          {/* Protected */}
          <Route
            path="/boards"
            element={
              <ProtectedRoute>
                <BoardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:boardId"
            element={
              <ProtectedRoute>
                <CanvasPage />
              </ProtectedRoute>
            }
          />

          {/* Root → boards dashboard */}
          <Route path="/" element={<Navigate to="/boards" replace />} />
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
