import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import HomePage from "@/features/home/pages/HomePage";
import GameSelectionPage from "@/components/layout/GameSelectionPage";
import { CardsGame } from "@/features/cards-game/components/CardsGame";
import { ImagesGame } from "@/features/images-game/components/ImagesGame";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import UpdateProfilePage from "@/features/profile/pages/UpdateProfilePage";
import StoryPracticePage from "@/features/practice/pages/StoryPracticePage";
import NumbersPracticePage from "@/features/practice/pages/NumbersPracticePage";
import LociPracticePage from "@/features/practice/pages/LociPracticePage";
import StoryGuidePage from "@/features/methods/pages/StoryGuidePage";
import NumberShapeGuidePage from "@/features/methods/pages/NumberShapeGuidePage";
import MemoryPalaceGuidePage from "@/features/methods/pages/MemoryPalaceGuidePage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import MethodsPage from "@/features/methods/pages/MethodsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/games",
    element: <GameSelectionPage />,
  },
  {
    path: "/games/cards",
    element: <CardsGame />,
  },
  {
    path: "/games/images",
    element: <ImagesGame />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/profile/update",
        element: <UpdateProfilePage />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: "/methods",
    element: <MethodsPage />,
  },
  {
    path: "/methods/story-linking",
    element: <StoryGuidePage />,
  },
  {
    path: "/methods/number-shape",
    element: <NumberShapeGuidePage />,
  },
  {
    path: "/methods/memory-palace",
    element: <MemoryPalaceGuidePage />,
  },
  {
    path: "/methods/story-linking/practice",
    element: <StoryPracticePage />,
  },
  {
    path: "/methods/number-shape/practice",
    element: <NumbersPracticePage />,
  },
  {
    path: "/methods/memory-palace/practice",
    element: <LociPracticePage />,
  },
  {
    path: "/practice/story",
    element: <StoryPracticePage />,
  },
  {
    path: "/practice/numbers",
    element: <NumbersPracticePage />,
  },
  {
    path: "/practice/loci",
    element: <LociPracticePage />,
  },
  // Route chỉ dành cho khách chưa login
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
