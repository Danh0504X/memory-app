import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import GameSelectionPage from "@/components/layout/GameSelectionPage";
import { CardsGame } from "@/features/cards-game/components/CardsGame";
import { ImagesGame } from "@/features/images-game/components/ImagesGame";
import { NumbersGame } from "@/features/numbers-game/components/NumbersGame";
import { FaceNameGame } from "@/features/facename-game/components/FaceNameGame";
import { WordsGame } from "@/features/words-game/components/WordsGame";
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
import { RootLayout } from "./RootLayout";
import { HomeRoute } from "./HomeRoute";
import DailyPage from "@/features/daily/pages/DailyPage";

// Mọi trang nằm dưới RootLayout (đưa về đầu trang khi chuyển trang)
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
  {
    path: "/",
    element: <HomeRoute />,
  },
  {
    path: "/games",
    element: <GameSelectionPage />,
  },
  {
    path: "/daily",
    element: <DailyPage />,
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
    path: "/games/facename",
    element: <FaceNameGame />,
  },
  {
    path: "/games/words",
    element: <WordsGame />,
  },
  {
    path: "/games/numbers",
    element: <NumbersGame />,
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
  // Trang mở từ link trong email: công khai, không ép đăng nhập và cũng không đẩy người đã đăng nhập đi nơi khác
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
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
    ],
  },
]);
