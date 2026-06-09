import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { DashboardPage } from "../pages/DashboardPage.jsx";
import { DocumentsPage } from "../pages/DocumentsPage.jsx";
import { ChatPage } from "../pages/ChatPage.jsx";
import { AnalysisPage } from "../pages/AnalysisPage.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <Protected><AppLayout /></Protected>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "documents", element: <DocumentsPage /> },
      { path: "chat", element: <ChatPage /> },
      { path: "analysis", element: <AnalysisPage /> }
    ]
  }
]);
