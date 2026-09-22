import { useEffect, useState } from "react";
import {
  FiCheck,
  FiX,
  FiRefreshCw,
  FiUsers,
  FiClock,
  FiUserCheck,
  FiUserX,
  FiAlertCircle,
} from "react-icons/fi";
import AdminLayout from "../components/AdminLayout";
import {
  adminAuthAPI,
  getAdminData,
} from "../services/api";

const PendingAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const adminData = getAdminData();

  const loadAdmins = async () => {
    setLoading(true);
    setError("");

    try {
      if (adminData?.role !== "superadmin") {
        setError("Only superadmin can access this page.");
        return;
      }

      const response = await adminAuthAPI.getPendingAdmins();

      setAdmins(response?.admins || []);
    } catch (err) {
      console.error("Pending admins error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load admin registrations.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleApprove = async (id) => {
    if (!id || actionLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to approve this admin?"
    );

    if (!confirmed) return;

    setActionLoading(id);
    setError("");
    setSuccess("");

    try {
      await adminAuthAPI.approveAdmin(id);

      setAdmins((prev) =>
        prev.filter((admin) => admin._id !== id)
      );

      setSuccess("Admin approved successfully.");
    } catch (err) {
      console.error("Approve admin error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to approve admin."
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async (id) => {
    if (!id || actionLoading) return;

    const confirmed = window.confirm(
      "Are you sure you want to reject this admin registration?"
    );

    if (!confirmed) return;

    setActionLoading(id);
    setError("");
    setSuccess("");

    try {
      await adminAuthAPI.rejectAdmin(id);

      setAdmins((prev) =>
        prev.filter((admin) => admin._id !== id)
      );

      setSuccess("Admin registration rejected.");
    } catch (err) {
      console.error("Reject admin error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reject admin."
      );
    } finally {
      setActionLoading("");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                <FiUsers size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Pending Admins
                </h1>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage new admin registration requests
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={loadAdmins}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <FiAlertCircle className="mt-0.5 shrink-0" size={20} />

            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            <FiCheck className="mt-0.5 shrink-0" size={20} />

            <div>
              <p className="font-semibold">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending Requests
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {admins.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                <FiClock size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your Role
                </p>

                <p className="mt-2 text-xl font-bold capitalize text-gray-900 dark:text-white">
                  {adminData?.role || "Superadmin"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <FiUserCheck size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Access
                </p>

                <p className="mt-2 text-xl font-bold text-green-600">
                  Superadmin
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <FiUsers size={23} />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Registration Requests
            </h2>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <FiRefreshCw
                  size={30}
                  className="animate-spin text-indigo-600"
                />

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading registrations...
                </p>
              </div>
            </div>
          ) : admins.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                <FiUsers size={30} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No Pending Registrations
              </h3>

              <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
                There are currently no new admin accounts waiting
                for approval.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Admin
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Email
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Registered
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {admins.map((admin) => {
                      const isProcessing =
                        actionLoading === admin._id;

                      return (
                        <tr
                          key={admin._id}
                          className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                                {admin.username
                                  ?.charAt(0)
                                  ?.toUpperCase() || "A"}
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {admin.username}
                                </p>

                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Admin
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {admin.email}
                          </td>

                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(admin.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                              <FiClock size={13} />
                              Pending
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() =>
                                  handleApprove(admin._id)
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiCheck size={16} />

                                {isProcessing
                                  ? "Processing..."
                                  : "Approve"}
                              </button>

                              <button
                                onClick={() =>
                                  handleReject(admin._id)
                                }
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiX size={16} />

                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-4 md:hidden">
                {admins.map((admin) => {
                  const isProcessing =
                    actionLoading === admin._id;

                  return (
                    <div
                      key={admin._id}
                      className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                            {admin.username
                              ?.charAt(0)
                              ?.toUpperCase() || "A"}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {admin.username}
                            </p>

                            <p className="break-all text-sm text-gray-500 dark:text-gray-400">
                              {admin.email}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Pending
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <FiClock size={14} />
                        {formatDate(admin.createdAt)}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            handleApprove(admin._id)
                          }
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiCheck size={16} />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleReject(admin._id)
                          }
                          disabled={isProcessing}
                          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <FiUserX size={16} />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PendingAdmins;