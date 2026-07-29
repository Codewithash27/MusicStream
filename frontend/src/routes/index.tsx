import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedRoute } from "../components/layout/protected-route";
import { AppShell } from "../layouts/app-shell";
import { MarketingShell } from "../layouts/marketing-shell";
import { AlbumPage } from "../pages/album-page";
import { AdminPage } from "../pages/admin-page";
import { AdminUserPage } from "../pages/admin-user-page";
import { ArtistPage } from "../pages/artist-page";
import { DashboardPage } from "../pages/dashboard-page";
import { HomePage } from "../pages/home-page";
import { LandingPage } from "../pages/landing-page";
import { LibraryPage } from "../pages/library-page";
import { LoginPage } from "../pages/login-page";
import { NotFoundPage } from "../pages/not-found-page";
import { PlaylistPage } from "../pages/playlist-page";
import { ProfilePage } from "../pages/profile-page";
import { RegisterPage } from "../pages/register-page";
import { SearchPage } from "../pages/search-page";
import { SettingsPage } from "../pages/settings-page";
import { SongDetailPage } from "../pages/song-detail-page";
import { UploadSongPage } from "../pages/upload-song-page";

export const router = createBrowserRouter([
  {
    element: <MarketingShell />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <AppShell />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/home", element: <HomePage /> },
          { path: "/search", element: <SearchPage /> },
          { path: "/library", element: <LibraryPage /> },
          { path: "/playlist/:id", element: <PlaylistPage /> },
          { path: "/album/:id", element: <AlbumPage /> },
          { path: "/artist/:id", element: <ArtistPage /> },
          { path: "/song/:id", element: <SongDetailPage /> },
          { path: "/upload", element: <UploadSongPage /> },
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/admin", element: <AdminPage /> },
          { path: "/admin/users/:id", element: <AdminUserPage /> },
          { path: "/settings", element: <SettingsPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: "/app", element: <Navigate to="/home" replace /> },
  { path: "*", element: <NotFoundPage /> },
]);
