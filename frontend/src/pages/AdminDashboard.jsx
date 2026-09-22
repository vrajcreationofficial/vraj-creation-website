
import React from "react";
import { Link } from "react-router-dom";

import {
  FiPackage,
  FiPlusCircle,
  FiGift,
  FiArrowRight,
  FiShoppingBag,
} from "react-icons/fi";

import AdminLayout from "../components/AdminLayout";
import { getAdminData } from "../services/api";
import vrajLogo from "../assets/vraj-logo.jpeg";

export default function AdminDashboard() {
  const getCurrentAdmin = () => {
    try {
      const adminData = getAdminData();

      if (adminData) {
        return adminData;
      }

      const storedAdmin = localStorage.getItem(
        "vraj_admin_data"
      );

      if (storedAdmin) {
        return JSON.parse(storedAdmin);
      }

      const oldAdmin = localStorage.getItem("admin");

      if (oldAdmin) {
        return JSON.parse(oldAdmin);
      }

      return null;
    } catch (error) {
      console.error(
        "Admin data read error:",
        error
      );

      return null;
    }
  };

  const admin = getCurrentAdmin();

  const adminName =
    admin?.username ||
    admin?.name ||
    admin?.email ||
    "Admin";

  const cards = [
    {
      title: "Products",
      description: "View and manage all products.",
      linkText: "Manage Products",
      path: "/admin/products",
      icon: FiPackage,
      iconBg: "bg-[#f5e3d8]",
      iconColor: "text-[#8f3424]",
      hoverBorder: "hover:border-[#c98268]",
    },
    {
      title: "Add Product",
      description: "Add a new product to your store.",
      linkText: "Add Product",
      path: "/admin/products/add",
      icon: FiPlusCircle,
      iconBg: "bg-[#f0e4d8]",
      iconColor: "text-[#9a5b36]",
      hoverBorder: "hover:border-[#c9936e]",
    },
    {
      title: "Spin & Win",
      description: "Manage your Spin & Win campaign.",
      linkText: "Manage Campaign",
      path: "/admin/spin",
      icon: FiGift,
      iconBg: "bg-[#eee0dc]",
      iconColor: "text-[#93453a]",
      hoverBorder: "hover:border-[#c67b6c]",
    },
  ];

  return (
    <AdminLayout>
      <div
        className="
          relative
          min-h-[calc(100vh-76px)]
          overflow-hidden
          bg-[#f7f3ee]
          p-4
          sm:p-6
          dark:bg-[#15100d]
        "
      >

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            flex
            items-center
            justify-center
            overflow-hidden
          "
        >
          <img
            src={vrajLogo}
            alt=""
            aria-hidden="true"
            className="
              h-[420px]
              w-[420px]
              max-w-[75vw]
              select-none
              object-contain
              grayscale
              opacity-[0.035]
              transition-all
              duration-1000
              dark:opacity-[0.045]
            "
          />
        </div>

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-72
            w-72
            animate-pulse
            rounded-full
            bg-[#c98268]/10
            blur-3xl
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-28
            -left-24
            h-80
            w-80
            rounded-full
            bg-[#d7a17f]/10
            blur-3xl
          "
        />

        <div className="relative z-10">

          <div
            className="
              group
              relative
              mb-7
              overflow-hidden
              rounded-3xl
              bg-gradient-to-r
              from-[#8f3424]
              via-[#a44d32]
              to-[#6f271c]
              p-6
              text-white
              shadow-[0_15px_45px_rgba(111,39,28,0.22)]
              transition-all
              duration-500
              hover:-translate-y-1
              hover:shadow-[0_20px_55px_rgba(111,39,28,0.30)]
              sm:p-8
            "
          >

            <div
              className="
                pointer-events-none
                absolute
                -right-16
                -top-24
                h-64
                w-64
                rounded-full
                bg-white/10
                blur-3xl
                transition-transform
                duration-700
                group-hover:scale-125
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-20
                right-20
                h-40
                w-40
                rounded-full
                bg-orange-300/10
                blur-2xl
              "
            />

            <div
              className="
                relative
                mb-5
                flex
                h-14
                w-14
                items-center
                justify-center
                overflow-hidden
                rounded-2xl
                bg-white/15
                p-1.5
                shadow-lg
                ring-1
                ring-white/20
                backdrop-blur
                transition-all
                duration-500
                group-hover:rotate-2
                group-hover:scale-110
              "
            >
              <img
                src={vrajLogo}
                alt="Vraj Creation"
                className="
                  h-full
                  w-full
                  rounded-xl
                  object-cover
                "
              />
            </div>

            <div className="relative">

              <p
                className="
                  mb-2
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.25em]
                  text-orange-100
                "
              >
                Vraj Creation India
              </p>

              <h1
                className="
                  text-2xl
                  font-extrabold
                  tracking-tight
                  sm:text-3xl
                  lg:text-4xl
                "
              >
                Welcome, {adminName}
              </h1>

              <p
                className="
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-orange-50/90
                  sm:text-base
                "
              >
                Manage your store, products and Spin & Win
                campaign from one place.
              </p>

            </div>

            <FiShoppingBag
              className="
                pointer-events-none
                absolute
                bottom-6
                right-7
                hidden
                text-white/10
                sm:block
              "
              size={105}
            />

          </div>

          <div
            className="
              mb-5
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-[#f0dfd5]
                text-[#8f3424]
                shadow-sm
                dark:bg-[#332019]
                dark:text-[#d99a7c]
              "
            >
              <FiShoppingBag size={19} />
            </div>

            <div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-[#4f2a20]
                  dark:text-[#f1ddd2]
                "
              >
                Store Management
              </h2>

              <p
                className="
                  mt-0.5
                  text-sm
                  text-[#947568]
                  dark:text-[#bda093]
                "
              >
                Quick access to your store features
              </p>

            </div>

          </div>

          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >

            {cards.map((card, index) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.title}
                  to={card.path}
                  style={{
                    animationDelay: `${index * 120}ms`,
                  }}
                  className={`
                    group
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    border-[#e7ddd4]
                    bg-white/90
                    p-6
                    shadow-sm
                    backdrop-blur
                    transition-all
                    duration-500
                    hover:-translate-y-2
                    hover:shadow-[0_18px_40px_rgba(91,52,38,0.13)]
                    ${card.hoverBorder}
                    dark:border-[#3a2922]
                    dark:bg-[#1d1612]/90
                  `}
                >

                  <span
                    className="
                      pointer-events-none
                      absolute
                      -right-16
                      -top-16
                      h-32
                      w-32
                      rounded-full
                      bg-[#c98268]/5
                      blur-2xl
                      transition-all
                      duration-500
                      group-hover:scale-150
                    "
                  />

                  <div
                    className="
                      absolute
                      left-0
                      top-0
                      h-1
                      w-0
                      bg-gradient-to-r
                      from-[#8f3424]
                      to-[#c98268]
                      transition-all
                      duration-500
                      group-hover:w-full
                    "
                  />

                  <div
                    className={`
                      relative
                      mb-5
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      ${card.iconBg}
                      ${card.iconColor}
                      shadow-sm
                      transition-all
                      duration-500
                      group-hover:rotate-3
                      group-hover:scale-110
                      group-hover:shadow-md
                    `}
                  >
                    <Icon
                      size={25}
                      className="
                        transition-transform
                        duration-500
                        group-hover:scale-110
                      "
                    />
                  </div>

                  <h3
                    className="
                      text-lg
                      font-bold
                      text-[#3f2921]
                      transition-colors
                      duration-300
                      group-hover:text-[#8f3424]
                      dark:text-[#f2dfd5]
                      dark:group-hover:text-[#d99a7c]
                    "
                  >
                    {card.title}
                  </h3>

                  <p
                    className="
                      mt-2
                      text-sm
                      leading-6
                      text-[#8c776d]
                      dark:text-[#bba69c]
                    "
                  >
                    {card.description}
                  </p>

                  <div
                    className={`
                      mt-5
                      flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      ${card.iconColor}
                    `}
                  >
                    <span>
                      {card.linkText}
                    </span>

                    <FiArrowRight
                      size={17}
                      className="
                        transition-all
                        duration-300
                        group-hover:translate-x-2
                      "
                    />
                  </div>

                </Link>
              );
            })}

          </div>

          <div
            className="
              relative
              mt-8
              overflow-hidden
              rounded-2xl
              border
              border-[#e7ddd4]
              bg-white/70
              px-5
              py-4
              shadow-sm
              backdrop-blur
              dark:border-[#3a2922]
              dark:bg-[#1d1612]/70
            "
          >

            <div
              className="
                flex
                items-center
                justify-center
                gap-3
              "
            >

              <img
                src={vrajLogo}
                alt="Vraj Creation"
                className="
                  h-8
                  w-8
                  rounded-lg
                  object-cover
                  opacity-70
                  grayscale
                  transition-all
                  duration-500
                  hover:scale-110
                  hover:opacity-100
                  hover:grayscale-0
                "
              />

              <p
                className="
                  text-center
                  text-sm
                  font-medium
                  tracking-wide
                  text-[#9a8176]
                  dark:text-[#b9a097]
                "
              >
                Bringing Art to Life
              </p>

            </div>

          </div>

          <div
            className="
              mt-8
              border-t
              border-[#e5d9ce]
              pt-5
              text-center
              text-sm
              text-[#a38c82]
              dark:border-[#33251f]
              dark:text-[#8f776c]
            "
          >
            <p>
              © {new Date().getFullYear()} VRAJ CREATION INDIA
            </p>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
