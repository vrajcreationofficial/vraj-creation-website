import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiKey,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";

import { adminAuthAPI } from "../services/api";

import vrajLogo from "../assets/vraj-logo.jpeg";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetId, setResetId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await adminAuthAPI.forgotPassword({
        email: cleanEmail,
      });

      if (response?.success) {
        setEmail(cleanEmail);
        setOtp("");
        setSuccess(
          "If an approved admin account exists with this email, the OTP has been sent."
        );
        setStep("otp");
      } else {
        setError(response?.message || "Unable to send OTP.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanOtp = otp.trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await adminAuthAPI.verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
      });

      if (response?.success && response?.resetId) {
        setResetId(response.resetId);

        setSuccess("OTP verified successfully.");
        setStep("password");
      } else {
        setError(response?.message || "Unable to verify OTP.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Invalid or expired OTP."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!resetId) {
      setError("Password reset session is invalid. Please request a new OTP.");
      setStep("email");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await adminAuthAPI.resetPassword({
        email: email.trim().toLowerCase(),
        resetId,
        newPassword,
        confirmPassword,
      });

      if (response?.success) {
        setSuccess(
          "Password reset successfully. Redirecting to login..."
        );

        setTimeout(() => {
          navigate("/admin/login", {
            replace: true,
          });
        }, 1200);

        return;
      }

      setError(
        response?.message || "Unable to reset password."
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/admin/login");
  };

  const handleBack = () => {
    setError("");
    setSuccess("");

    if (loading) {
      return;
    }

    if (step === "otp") {
      setStep("email");
      setOtp("");
      return;
    }

    if (step === "password") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
      return;
    }
  };

  const handleChangeEmail = () => {
    if (loading) {
      return;
    }

    setError("");
    setSuccess("");
    setOtp("");
    setResetId("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("email");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-indigo-200/60 dark:shadow-none overflow-hidden border border-slate-200 dark:border-slate-700">
            <img
              src={vrajLogo}
              alt="Vraj Creation India"
              className="w-full h-full object-contain p-2"
            />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">
            Vraj Creation
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Admin Dashboard
          </p>

          <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            Bringing Art to Life
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            {step !== "email" && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiArrowLeft size={19} />
              </button>
            )}

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {step === "email" && "Forgot Password"}
                {step === "otp" && "Verify OTP"}
                {step === "password" && "Create New Password"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {step === "email" &&
                  "Enter your registered admin email"}

                {step === "otp" &&
                  "Enter the OTP sent to your email"}

                {step === "password" &&
                  "Set a new password for your account"}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-300">
              <FiCheckCircle
                className="mt-0.5 shrink-0"
                size={18}
              />

              <span>{success}</span>
            </div>
          )}

          {step === "email" && (
            <form
              onSubmit={handleSendOtp}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Registered Email
                </label>

                <div className="relative">
                  <FiMail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    disabled={loading}
                    placeholder="Enter your registered email"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-10 pr-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold py-3.5 px-4 transition shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <FiArrowRight size={19} />
                    Send OTP
                  </>
                )}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form
              onSubmit={handleVerifyOtp}
              className="space-y-5"
            >
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FiMail
                    className="text-indigo-600 dark:text-indigo-400 shrink-0"
                    size={17}
                  />

                  <p className="text-sm text-indigo-700 dark:text-indigo-300 break-all">
                    {email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleChangeEmail}
                  disabled={loading}
                  className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-purple-600 transition disabled:opacity-50"
                >
                  Change email
                </button>
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  6-Digit OTP
                </label>

                <div className="relative">
                  <FiShield
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />

                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(event) => {
                      const value =
                        event.target.value.replace(
                          /\D/g,
                          ""
                        );

                      setOtp(value);
                      setError("");
                      setSuccess("");
                    }}
                    disabled={loading}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-10 pr-4 py-3 text-center tracking-[0.35em] font-semibold outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  OTP is valid for 10 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  loading || otp.length !== 6
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold py-3.5 px-4 transition shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FiKey size={19} />
                    Verify OTP
                  </>
                )}
              </button>
            </form>
          )}

          {step === "password" && (
            <form
              onSubmit={handleResetPassword}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="newPassword"
                  className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  New Password
                </label>

                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />

                  <input
                    id="newPassword"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(
                        event.target.value
                      );
                      setError("");
                      setSuccess("");
                    }}
                    disabled={loading}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-10 pr-16 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition disabled:opacity-50"
                  >
                    {showNewPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block mb-2 text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <FiLock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={19}
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(
                        event.target.value
                      );
                      setError("");
                      setSuccess("");
                    }}
                    disabled={loading}
                    placeholder="Confirm new password"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white pl-10 pr-16 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition disabled:opacity-50"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Password must be at least 8 characters long.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold py-3.5 px-4 transition shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={19} />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-7 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={handleBackToLogin}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 transition disabled:opacity-50"
            >
              <FiArrowLeft size={17} />
              Back to Login
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
          © {new Date().getFullYear()} Vraj Creation India
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;