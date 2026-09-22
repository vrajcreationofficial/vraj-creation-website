
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiLogIn,
  FiUser,
} from "react-icons/fi";

import {
  adminAuthAPI,
  clearAdminSession,
  getAdminToken,
} from "../services/api";

import vrajLogo from "../assets/vraj-logo.jpeg";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const token = getAdminToken();

      if (!token) {
        if (mounted) {
          setCheckingSession(false);
        }
        return;
      }

      try {
        const response = await adminAuthAPI.verify();

        if (mounted && response?.success && response?.admin) {
          navigate("/admin/dashboard", {
            replace: true,
          });
          return;
        }

        clearAdminSession();
      } catch (error) {
        clearAdminSession();
      }

      if (mounted) {
        setCheckingSession(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const username = formData.username.trim();
    const password = formData.password;

    if (!username) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await adminAuthAPI.login({
        username,
        password,
      });

      if (response?.success) {
        setSuccess("Login successful. Redirecting...");

        setTimeout(() => {
          navigate("/admin/dashboard", {
            replace: true,
          });
        }, 300);

        return;
      }

      setError(
        response?.message ||
          "Unable to login. Please check your credentials."
      );
    } catch (err) {
      const responseData = err?.response?.data;
      const code = responseData?.code;

      if (code === "ADMIN_PENDING") {
        setError(
          "Your registration is pending superadmin approval."
        );
      } else if (code === "ADMIN_REJECTED") {
        setError(
          "Your admin registration has been rejected."
        );
      } else if (code === "TOKEN_EXPIRED") {
        clearAdminSession();
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          responseData?.message ||
            err?.message ||
            "Invalid username or password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (loading) {
      return;
    }

    navigate("/admin/register");
  };

  const handleForgotPassword = () => {
    if (loading) {
      return;
    }

    navigate("/admin/forgot-password");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />

          <p className="mt-3 text-sm text-slate-600">
            Checking admin session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center px-4 py-6">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-300/30 rounded-full blur-3xl" />

      <div className="absolute -bottom-28 -right-20 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl" />

      <div className="absolute top-1/3 right-1/4 w-40 h-40 bg-indigo-200/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-lg shadow-indigo-200/60 overflow-hidden border border-slate-200">
            <img
              src={vrajLogo}
              alt="Vraj Creation India"
              className="w-full h-full object-contain p-1.5"
            />
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Vraj Creation
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Admin Dashboard
          </p>

          <p className="mt-0.5 text-xs font-medium text-indigo-600">
            Bringing Art to Life
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-indigo-200/40 border border-white p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Admin Login
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Sign in to access your dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <FiAlertCircle
                className="mt-0.5 shrink-0"
                size={16}
              />

              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="username"
                className="block mb-1.5 text-xs font-semibold text-slate-700"
              >
                Username
              </label>

              <div className="relative">
                <FiUser
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />

                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter username"
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 text-sm pl-9 pr-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1.5 text-xs font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 text-sm pl-9 pr-10 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition disabled:opacity-50"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff size={17} />
                  ) : (
                    <FiEye size={17} />
                  )}
                </button>
              </div>

              <div className="mt-1.5 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs font-semibold text-indigo-600 hover:text-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-sm font-semibold py-2.5 px-4 transition shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  <FiLogIn size={17} />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Don't have an admin account?
            </p>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Register as Admin
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          © {new Date().getFullYear()} Vraj Creation India
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;