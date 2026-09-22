import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import {
  adminAuthAPI,
  clearAdminSession,
  getAdminToken,
} from "../services/api";

const AdminProtectedRoute = ({ superAdminOnly = false }) => {
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      const token = getAdminToken();

      if (!token) {
        if (mounted) {
          setAuthorized(false);
          setChecking(false);
        }
        return;
      }

      try {
        const response = await adminAuthAPI.verify();

        const admin = response?.admin;

        if (!admin) {
          throw new Error("Invalid admin session");
        }

        if (admin.status !== "approved") {
          throw new Error("Admin is not approved");
        }

        if (
          superAdminOnly &&
          admin.role !== "superadmin"
        ) {
          if (mounted) {
            setForbidden(true);
            setAuthorized(false);
            setChecking(false);
          }

          return;
        }

        if (mounted) {
          setAuthorized(true);
          setForbidden(false);
          setChecking(false);
        }
      } catch (error) {
        console.error(
          "Admin session verification failed:",
          error
        );

        clearAdminSession();

        if (mounted) {
          setAuthorized(false);
          setForbidden(false);
          setChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      mounted = false;
    };
  }, [superAdminOnly]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7efe3] dark:bg-[#15100d]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#8f3424]/20 border-t-[#8f3424] dark:border-[#b66d4d]/20 dark:border-t-[#b66d4d]" />

          <p className="mt-4 text-sm text-[#6f5040] dark:text-[#c9ab97]">
            Verifying admin session...
          </p>
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
        state={{
          from: location,
          message: "Superadmin access required.",
        }}
      />
    );
  }

  if (!authorized) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
};

export default AdminProtectedRoute;