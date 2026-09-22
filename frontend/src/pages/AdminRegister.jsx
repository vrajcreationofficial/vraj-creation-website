
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
  FiUserPlus,
} from "react-icons/fi";

import { adminAuthAPI } from "../services/api";
import vrajLogo from "../assets/vraj-logo.jpeg";

const AdminRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const validateForm = () => {
    const username = formData.username.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!username) {
      return "Please enter a username.";
    }

    if (username.length < 3 || username.length > 50) {
      return "Username must be between 3 and 50 characters.";
    }

    if (username.includes(" ")) {
      return "Username should not contain spaces.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    if (!password) {
      return "Please enter a password.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (password.length > 128) {
      return "Password is too long.";
    }

    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await adminAuthAPI.register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response?.success) {
        setSuccess(true);
        return;
      }

      setError(
        response?.message || "Unable to complete registration."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/admin/login", {
      replace: true,
    });
  };

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4 py-6">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 w-72 h-72 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute top-1/3 -right-16 w-36 h-36 rounded-full bg-indigo-200/30 blur-2xl" />

        <div className="relative w-full max-w-sm">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/70 dark:border-slate-800 p-6 sm:p-7 text-center">
            <img
              src={vrajLogo}
              alt="Vraj Creation India"
              className="mx-auto w-16 h-16 rounded-2xl object-cover shadow-md"
            />

            <div className="mx-auto mt-4 flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400">
              <FiCheckCircle size={27} />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Registration Successful
            </h1>

            <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
              Your admin account has been registered successfully.
            </p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-3.5 text-left">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Approval Required
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-400">
                Your account is currently pending superadmin approval.
                You will be able to login after your account is approved.
              </p>
            </div>

            <button
              type="button"
              onClick={goToLogin}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-sm font-semibold py-3 transition shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <FiArrowLeft size={17} />
              Go to Admin Login
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
            © {new Date().getFullYear()} Vraj Creation India
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4 py-5">
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="absolute -bottom-28 -right-24 w-72 h-72 rounded-full bg-purple-300/30 blur-3xl" />
      <div className="absolute top-1/4 -right-16 w-32 h-32 rounded-full bg-indigo-200/30 blur-2xl" />
      <div className="absolute bottom-1/4 -left-12 w-28 h-28 rounded-full bg-purple-200/30 blur-2xl" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-5">
          <img
            src={vrajLogo}
            alt="Vraj Creation India"
            className="mx-auto w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/70 dark:border-slate-700"
          />

          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            Vraj Creation
          </h1>

          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Admin Registration
          </p>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/70 dark:border-slate-800 p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-md">
              <FiUserPlus size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Admin Account
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Superadmin approval is required.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-3 py-2.5 text-xs text-red-700 dark:text-red-300">
              <FiAlertCircle
                className="mt-0.5 shrink-0"
                size={16}
              />

              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="username"
                className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
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
                  maxLength={50}
                  placeholder="Enter username"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>

              <p className="mt-1 text-[11px] text-slate-400">
                Minimum 3 characters, no spaces
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Email Address
              </label>

              <div className="relative">
                <FiMail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Enter email address"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
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
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={128}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-9 pr-10 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                >
                  {showPassword ? (
                    <FiEyeOff size={17} />
                  ) : (
                    <FiEye size={17} />
                  )}
                </button>
              </div>

              <p className="mt-1 text-[11px] text-slate-400">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Confirm Password
              </label>

              <div className="relative">
                <FiLock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={128}
                  placeholder="Confirm password"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-9 pr-10 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={17} />
                  ) : (
                    <FiEye size={17} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-sm font-semibold py-2.5 px-4 transition duration-200 shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <FiUserPlus size={17} />
                  Register Admin
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an admin account?
            </p>

            <button
              type="button"
              onClick={goToLogin}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 transition"
            >
              <FiArrowLeft size={14} />
              Back to Login
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-4">
          © {new Date().getFullYear()} Vraj Creation India
        </p>
      </div>
    </div>
  );
};

export default AdminRegister;