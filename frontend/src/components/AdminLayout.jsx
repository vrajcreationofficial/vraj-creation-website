import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FiHome,
  FiPackage,
  FiGift,
  FiUsers,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronRight,
  FiShoppingBag,
} from "react-icons/fi";

import {
  adminAuthAPI,
  getAdminData,
  clearAdminSession,
} from "../services/api";

import vrajLogo from "../assets/vraj-logo.jpeg";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const adminData = getAdminData();
  const adminRole = adminData?.role || "admin";

  const isSuperAdmin = adminRole === "superadmin";

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: FiHome,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: FiPackage,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: FiShoppingBag,
    },
    {
      name: "Spin & Win",
      path: "/admin/spin",
      icon: FiGift,
    },
  ];

  if (isSuperAdmin) {
    menuItems.push({
      name: "Pending Admins",
      path: "/admin/pending-admins",
      icon: FiUsers,
    });
  }

  const isActive = (path) => {
    return location.pathname === path;
  };

  const logout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await adminAuthAPI.logout();
    } catch (error) {
      console.error("Admin logout error:", error);
    } finally {
      clearAdminSession();

      navigate("/admin/login", {
        replace: true,
      });

      setLoggingOut(false);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f1eb] dark:bg-[#15100d]">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="
            fixed inset-0 z-40
            bg-black/50
            backdrop-blur-sm
            transition-opacity duration-300
            lg:hidden
          "
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          h-screen w-64
          overflow-hidden
          bg-gradient-to-b
          from-[#8f3424]
          via-[#9d432d]
          to-[#6f271c]
          text-white
          shadow-[8px_0_35px_rgba(80,25,15,0.25)]
          transition-all duration-500 ease-in-out
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Decorative Background Effects */}

        <div
          className="
            pointer-events-none
            absolute -right-20 -top-20
            h-56 w-56
            rounded-full
            bg-orange-300/10
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute -bottom-24 -left-24
            h-64 w-64
            rounded-full
            bg-yellow-300/10
            blur-3xl
          "
        />

        <div className="relative flex h-full flex-col">

          {/* LOGO HEADER */}

          <div
            className="
              group
              flex items-center justify-between
              border-b border-white/20
              px-5 py-5
            "
          >

            <Link
              to="/admin/dashboard"
              onClick={closeSidebar}
              className="
                flex items-center gap-3
                outline-none
              "
            >

              {/* Logo */}

              <div
                className="
                  relative
                  flex h-12 w-12
                  shrink-0
                  items-center justify-center
                  rounded-xl
                  bg-white/10
                  p-1
                  shadow-lg
                  ring-1 ring-white/20
                  backdrop-blur-sm
                  transition-all duration-500
                  group-hover:scale-110
                  group-hover:rotate-2
                  group-hover:bg-white/20
                  group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]
                "
              >

                <img
                  src={vrajLogo}
                  alt="Vraj Creation"
                  className="
                    h-full w-full
                    rounded-lg
                    object-cover
                    transition-transform duration-500
                    group-hover:scale-105
                  "
                />

                <span
                  className="
                    pointer-events-none
                    absolute inset-0
                    rounded-xl
                    opacity-0
                    ring-2 ring-white/40
                    transition-opacity duration-500
                    group-hover:opacity-100
                  "
                />

              </div>

              {/* Brand Text */}

              <div className="min-w-0">

                <h1
                  className="
                    truncate
                    text-lg
                    font-bold
                    tracking-wide
                    text-white
                    transition-all duration-300
                    group-hover:tracking-wider
                  "
                >
                  Vraj Creation
                </h1>

                <p
                  className="
                    text-xs
                    text-orange-100
                    transition-colors duration-300
                    group-hover:text-white
                  "
                >
                  Admin Panel
                </p>

              </div>

            </Link>

            {/* Mobile Close */}

            <button
              onClick={closeSidebar}
              aria-label="Close sidebar"
              className="
                rounded-lg
                p-2
                text-white/80
                transition-all duration-300
                hover:rotate-90
                hover:bg-white/10
                hover:text-white
                lg:hidden
              "
            >
              <FiX size={22} />
            </button>

          </div>

          {/* NAVIGATION */}

          <nav
            className="
              flex-1
              space-y-2
              overflow-y-auto
              px-4 py-6
            "
          >

            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                  className={`
                    group
                    relative
                    flex items-center justify-between
                    overflow-hidden
                    rounded-xl
                    px-4 py-3.5
                    transition-all duration-300
                    ${
                      active
                        ? `
                          translate-x-1
                          bg-white
                          text-[#8f3424]
                          shadow-[0_8px_25px_rgba(0,0,0,0.18)]
                        `
                        : `
                          text-white/90
                          hover:translate-x-1
                          hover:bg-white/10
                          hover:text-white
                          hover:shadow-lg
                        `
                    }
                  `}
                >

                  {/* Hover Indicator */}

                  {!active && (
                    <span
                      className="
                        absolute inset-y-0 left-0
                        w-1
                        -translate-x-full
                        rounded-r-full
                        bg-white
                        transition-transform duration-300
                        group-hover:translate-x-0
                      "
                    />
                  )}

                  {/* Active Indicator */}

                  {active && (
                    <span
                      className="
                        absolute left-0 top-1/2
                        h-7 w-1
                        -translate-y-1/2
                        rounded-r-full
                        bg-[#8f3424]
                      "
                    />
                  )}

                  <div className="relative flex items-center gap-3">

                    {/* Icon Box */}

                    <span
                      className={`
                        flex h-9 w-9
                        items-center justify-center
                        rounded-lg
                        transition-all duration-300
                        ${
                          active
                            ? "bg-[#f5e3d8]"
                            : "bg-white/5 group-hover:bg-white/15"
                        }
                      `}
                    >
                      <Icon
                        size={19}
                        className="
                          transition-transform duration-300
                          group-hover:scale-110
                          group-hover:rotate-[-3deg]
                        "
                      />
                    </span>

                    <span className="font-medium">
                      {item.name}
                    </span>

                  </div>

                  {/* Arrow */}

                  <FiChevronRight
                    size={18}
                    className={`
                      transition-all duration-300
                      ${
                        active
                          ? "translate-x-0 opacity-100"
                          : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                      }
                    `}
                  />

                </Link>
              );
            })}

          </nav>

          {/* LOGOUT */}

          <div
            className="
              border-t
              border-white/20
              p-4
            "
          >

            <button
              onClick={logout}
              disabled={loggingOut}
              className="
                group
                relative
                flex w-full
                items-center gap-3
                overflow-hidden
                rounded-xl
                px-4 py-3.5
                text-left
                text-white
                transition-all duration-300
                hover:translate-x-1
                hover:bg-white/10
                hover:shadow-lg
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              <span
                className="
                  absolute inset-y-0 left-0
                  w-1
                  -translate-x-full
                  rounded-r-full
                  bg-white
                  transition-transform duration-300
                  group-hover:translate-x-0
                "
              />

              <span
                className="
                  flex h-9 w-9
                  items-center justify-center
                  rounded-lg
                  bg-white/5
                  transition-all duration-300
                  group-hover:bg-white/15
                "
              >
                <FiLogOut
                  size={19}
                  className="
                    transition-transform duration-300
                    group-hover:translate-x-1
                  "
                />
              </span>

              <span className="font-medium">
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </span>

            </button>

          </div>

        </div>
      </aside>

      {/* MAIN AREA */}

      <div className="lg:pl-64">

        {/* HEADER */}

        <header
          className="
            sticky top-0 z-30
            flex h-16
            items-center justify-between
            border-b border-[#e5d9ce]
            bg-white/95
            px-4
            shadow-sm
            backdrop-blur-xl
            transition-all duration-300
            dark:border-[#33251f]
            dark:bg-[#1c1511]/95
            sm:px-6
          "
        >

          {/* Mobile Menu */}

          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="
              group
              rounded-xl
              p-2.5
              text-[#6f271c]
              transition-all duration-300
              hover:scale-105
              hover:bg-[#f5e9df]
              dark:text-[#d89b7d]
              dark:hover:bg-[#2b1d17]
              lg:hidden
            "
          >
            <FiMenu
              size={24}
              className="
                transition-transform duration-300
                group-hover:rotate-180
              "
            />
          </button>

          {/* Header Right */}

          <div className="ml-auto flex items-center gap-3">

            {/* Brand */}

            <div className="hidden text-right sm:block">

              <p
                className="
                  text-sm
                  font-semibold
                  text-[#6f271c]
                  dark:text-[#f1ddd2]
                "
              >
                Vraj Creation
              </p>

              <p
                className="
                  text-xs
                  text-[#9b7766]
                  dark:text-[#bda093]
                "
              >
                Admin Panel
              </p>

            </div>

            {/* Header Logo */}

            <div
              className="
                group
                relative
                flex h-10 w-10
                items-center justify-center
                overflow-hidden
                rounded-full
                bg-[#f5e3d8]
                p-1
                shadow-sm
                ring-1 ring-[#ead6c9]
                transition-all duration-500
                hover:scale-110
                hover:shadow-[0_0_22px_rgba(143,52,36,0.25)]
                dark:bg-[#3a241b]
                dark:ring-[#5a392d]
              "
            >

              <img
                src={vrajLogo}
                alt="Vraj Creation"
                className="
                  h-full w-full
                  rounded-full
                  object-cover
                  transition-transform duration-500
                  group-hover:scale-110
                "
              />

              {/* Online Glow */}

              <span
                className="
                  absolute
                  bottom-0.5
                  right-0.5
                  h-2.5 w-2.5
                  rounded-full
                  border-2
                  border-white
                  bg-green-500
                  shadow-[0_0_8px_rgba(34,197,94,0.7)]
                  dark:border-[#1c1511]
                "
              />

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main
          className="
            min-h-[calc(100vh-4rem)]
            bg-[#f5f1eb]
            p-4
            transition-colors duration-300
            dark:bg-[#15100d]
            sm:p-6
          "
        >
          {children}
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;