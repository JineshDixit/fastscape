import LoginPage from "@/pages/auth/LoginPage";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  }
])