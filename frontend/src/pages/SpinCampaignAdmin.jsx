import { useEffect, useMemo, useState } from "react";

import {
  FiCheck,
  FiClock,
  FiGift,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiShield,
  FiPower,
  FiZap,
  FiActivity,
} from "react-icons/fi";

import AdminLayout from "../components/AdminLayout";

import {
  spinCampaignAPI,
} from "../services/api";

const DEFAULT_REWARDS = [
  {
    wheelValue: 3,
    discount: 3,
    couponCode: "VRAJ-SPIN-3",
    code: "VRAJ-SPIN-3",
    name: "3% Discount",
    description: "Get 3% off on your order.",
    minOrderAmount: 0,
    maxDiscount: 0,
    maxUses: 100,
    usedCount: 0,
    active: true,
  },
  {
    wheelValue: 5,
    discount: 5,
    couponCode: "VRAJ-SPIN-5",
    code: "VRAJ-SPIN-5",
    name: "5% Discount",
    description: "Get 5% off on your order.",
    minOrderAmount: 0,
    maxDiscount: 0,
    maxUses: 100,
    usedCount: 0,
    active: true,
  },
  {
    wheelValue: 7,
    discount: 7,
    couponCode: "VRAJ-SPIN-7",
    code: "VRAJ-SPIN-7",
    name: "7% Discount",
    description: "Get 7% off on your order.",
    minOrderAmount: 0,
    maxDiscount: 0,
    maxUses: 100,
    usedCount: 0,
    active: true,
  },
  {
    wheelValue: 10,
    discount: 10,
    couponCode: "VRAJ-SPIN-10",
    code: "VRAJ-SPIN-10",
    name: "10% Discount",
    description: "Get 10% off on your order.",
    minOrderAmount: 0,
    maxDiscount: 0,
    maxUses: 100,
    usedCount: 0,
    active: true,
  },
];

const createDefaultRewards = () =>
  DEFAULT_REWARDS.map((reward) => ({
    ...reward,
  }));

const getResponseData = (response) => {
  return (
    response?.campaign ||
    response?.data?.campaign ||
    response?.data ||
    response ||
    null
  );
};

const normalizeCouponCode = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
};

const toLocalDateTimeInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) =>
    String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const getDateFromInput = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const getInitialStartDate = () => {
  const date = new Date();

  date.setSeconds(0, 0);

  return toLocalDateTimeInput(date);
};

const getInitialExpiryDate = () => {
  const date = new Date();

  date.setDate(date.getDate() + 10);
  date.setSeconds(0, 0);

  return toLocalDateTimeInput(date);
};

export default function SpinCampaignAdmin() {
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deactivating, setDeactivating] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [campaignExists, setCampaignExists] = useState(false);

  const [pageReady, setPageReady] = useState(false);

  const [name, setName] = useState(
    "Vraj Creation Spin & Win"
  );

  const [enabled, setEnabled] = useState(false);

  const [startDate, setStartDate] = useState(
    getInitialStartDate()
  );

  const [expiryDate, setExpiryDate] = useState(
    getInitialExpiryDate()
  );

  const [durationDays, setDurationDays] = useState(10);

  const [sessionMinutes, setSessionMinutes] = useState(5);

  const [oneSpinPerMobile, setOneSpinPerMobile] =
    useState(true);

  const [rewards, setRewards] = useState(
    createDefaultRewards()
  );

  const activeRewards = useMemo(() => {
    return rewards.filter(
      (reward) => reward.active
    );
  }, [rewards]);

  const totalUsed = useMemo(() => {
    return rewards.reduce(
      (total, reward) =>
        total + Number(reward.usedCount || 0),
      0
    );
  }, [rewards]);

  const totalLimit = useMemo(() => {
    return rewards.reduce(
      (total, reward) =>
        total + Number(reward.maxUses || 0),
      0
    );
  }, [rewards]);

  const showMessage = (text) => {
    setMessage(text);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  const showError = (text) => {
    setError(text);
    setMessage("");

    window.setTimeout(() => {
      setError("");
    }, 6000);
  };

  const loadCampaign = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response =
        await spinCampaignAPI.get();

      const campaign =
        getResponseData(response);

      if (!campaign || !campaign._id) {
        setCampaignExists(false);
        setEnabled(false);
        setRewards(
          createDefaultRewards()
        );
        return;
      }

      setCampaignExists(true);

      setName(
        campaign.name ||
          "Vraj Creation Spin & Win"
      );

      setEnabled(
        Boolean(campaign.enabled)
      );

      setStartDate(
        toLocalDateTimeInput(
          campaign.startDate
        ) || getInitialStartDate()
      );

      setExpiryDate(
        toLocalDateTimeInput(
          campaign.expiryDate
        ) || getInitialExpiryDate()
      );

      setDurationDays(
        Number(
          campaign.durationDays || 10
        )
      );

      setSessionMinutes(
        Number(
          campaign.sessionMinutes || 5
        )
      );

      setOneSpinPerMobile(
        campaign.oneSpinPerMobile ===
          undefined
          ? true
          : Boolean(
              campaign.oneSpinPerMobile
            )
      );

      const backendRewards =
        Array.isArray(campaign.rewards)
          ? campaign.rewards
          : [];

      const mergedRewards =
        DEFAULT_REWARDS.map(
          (defaultReward) => {
            const backendReward =
              backendRewards.find(
                (reward) =>
                  Number(
                    reward.wheelValue
                  ) ===
                  Number(
                    defaultReward.wheelValue
                  )
              );

            if (!backendReward) {
              return {
                ...defaultReward,
              };
            }

            const couponCode =
              normalizeCouponCode(
                backendReward.couponCode ||
                  backendReward.code ||
                  defaultReward.couponCode ||
                  defaultReward.code
              );

            return {
              ...defaultReward,
              ...backendReward,

              wheelValue: Number(
                backendReward.wheelValue ??
                  defaultReward.wheelValue
              ),

              discount: Number(
                backendReward.discount ??
                  defaultReward.discount
              ),

              couponCode,

              code: couponCode,

              name: String(
                backendReward.name ||
                  defaultReward.name
              ).trim(),

              description: String(
                backendReward.description ||
                  defaultReward.description
              ).trim(),

              minOrderAmount: Number(
                backendReward.minOrderAmount ??
                  0
              ),

              maxDiscount: Number(
                backendReward.maxDiscount ??
                  0
              ),

              maxUses: Number(
                backendReward.maxUses ??
                  defaultReward.maxUses
              ),

              usedCount: Number(
                backendReward.usedCount ??
                  0
              ),

              active:
                backendReward.active ===
                undefined
                  ? true
                  : Boolean(
                      backendReward.active
                    ),
            };
          }
        );

      setRewards(mergedRewards);
    } catch (err) {
      console.error(
        "Load Spin Campaign Error:",
        err
      );

      showError(
        err?.response?.data?.message ||
          "Spin campaign load nahi ho paaya."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCampaign();

    const timer = window.setTimeout(() => {
      setPageReady(true);
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const updateReward = (
    index,
    field,
    value
  ) => {
    setRewards((current) =>
      current.map((reward, rewardIndex) => {
        if (rewardIndex !== index) {
          return reward;
        }

        const updated = {
          ...reward,
          [field]: value,
        };

        if (field === "couponCode") {
          const code =
            normalizeCouponCode(value);

          updated.couponCode = code;
          updated.code = code;
        }

        return updated;
      })
    );
  };

  const handleDiscountChange = (
    index,
    value
  ) => {
    const numericValue = Number(value);

    updateReward(
      index,
      "discount",
      Number.isFinite(numericValue)
        ? numericValue
        : 0
    );
  };

  const handleNumberChange = (
    index,
    field,
    value
  ) => {
    const numericValue = Number(value);

    updateReward(
      index,
      field,
      Number.isFinite(numericValue) &&
        numericValue >= 0
        ? numericValue
        : 0
    );
  };

  const validateForm = () => {
    if (!name.trim()) {
      return "Campaign name required hai.";
    }

    if (!startDate) {
      return "Start date/time select karo.";
    }

    if (!expiryDate) {
      return "Expiry date/time select karo.";
    }

    const start = new Date(startDate);
    const expiry = new Date(expiryDate);

    if (Number.isNaN(start.getTime())) {
      return "Start date invalid hai.";
    }

    if (Number.isNaN(expiry.getTime())) {
      return "Expiry date invalid hai.";
    }

    if (expiry <= start) {
      return "Expiry date Start date ke baad honi chahiye.";
    }

    if (
      !Number(durationDays) ||
      Number(durationDays) < 1
    ) {
      return "Duration minimum 1 day hona chahiye.";
    }

    if (
      !Number(sessionMinutes) ||
      Number(sessionMinutes) < 1
    ) {
      return "Session time minimum 1 minute hona chahiye.";
    }

    if (activeRewards.length === 0) {
      return "Kam se kam ek reward active hona chahiye.";
    }

    const allowedValues = [
      3,
      5,
      7,
      10,
    ];

    for (const reward of rewards) {
      const wheelValue = Number(
        reward.wheelValue
      );

      if (
        !allowedValues.includes(
          wheelValue
        )
      ) {
        return "Sirf 3%, 5%, 7% aur 10% rewards allowed hain.";
      }

      const couponCode =
        normalizeCouponCode(
          reward.couponCode ||
            reward.code
        );

      if (!couponCode) {
        return `${wheelValue}% reward ka coupon code required hai.`;
      }

      const discount = Number(
        reward.discount
      );

      if (
        !Number.isFinite(discount) ||
        discount <= 0 ||
        discount > 100
      ) {
        return `${wheelValue}% reward ka discount 1-100 ke beech hona chahiye.`;
      }

      const maxUses = Number(
        reward.maxUses
      );

      if (
        !Number.isFinite(maxUses) ||
        maxUses < 0
      ) {
        return `${wheelValue}% reward ka Max Uses invalid hai.`;
      }

      const usedCount = Number(
        reward.usedCount || 0
      );

      if (
        maxUses > 0 &&
        usedCount > maxUses
      ) {
        return `${wheelValue}% reward ka Max Uses used count se kam nahi ho sakta.`;
      }
    }

    const codes = rewards.map(
      (reward) =>
        normalizeCouponCode(
          reward.couponCode ||
            reward.code
        )
    );

    const uniqueCodes =
      new Set(codes);

    if (
      uniqueCodes.size !==
      codes.length
    ) {
      return "Har reward ka coupon code unique hona chahiye.";
    }

    return "";
  };

  const buildPayload = () => {
    return {
      name: name.trim(),

      enabled: true,

      startDate:
        getDateFromInput(startDate),

      expiryDate:
        getDateFromInput(expiryDate),

      durationDays:
        Number(durationDays),

      sessionMinutes:
        Number(sessionMinutes),

      oneSpinPerMobile:
        Boolean(oneSpinPerMobile),

      rewards: rewards.map(
        (reward) => {
          const couponCode =
            normalizeCouponCode(
              reward.couponCode ||
                reward.code
            );

          return {
            wheelValue: Number(
              reward.wheelValue
            ),

            discount: Number(
              reward.discount
            ),

            couponCode,

            code: couponCode,

            name: String(
              reward.name ||
                `${reward.discount}% Discount`
            ).trim(),

            description: String(
              reward.description || ""
            ).trim(),

            minOrderAmount: Number(
              reward.minOrderAmount || 0
            ),

            maxDiscount: Number(
              reward.maxDiscount || 0
            ),

            maxUses: Number(
              reward.maxUses || 0
            ),

            usedCount: Number(
              reward.usedCount || 0
            ),

            active: Boolean(
              reward.active
            ),
          };
        }
      ),
    };
  };

  const handleSave = async () => {
    const validationError =
      validateForm();

    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload =
        buildPayload();

      console.log(
        "Spin Campaign Save Payload:",
        payload
      );

      let response;

      if (campaignExists) {
        response =
          await spinCampaignAPI.update(
            payload
          );
      } else {
        response =
          await spinCampaignAPI.activate(
            payload
          );
      }

      const updatedCampaign =
        getResponseData(response);

      if (updatedCampaign?._id) {
        setCampaignExists(true);
      }

      setEnabled(true);

      showMessage(
        campaignExists
          ? "Spin & Win campaign successfully update aur ACTIVE ho gaya."
          : "Spin & Win campaign successfully activate ho gaya."
      );

      await loadCampaign();
    } catch (err) {
      console.error(
        "Save Spin Campaign Error:",
        err
      );

      const backendMessage =
        err?.response?.data?.message;

      showError(
        backendMessage ||
          "Campaign save nahi ho paaya."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    const confirmed =
      window.confirm(
        "Kya aap Spin & Win campaign ko OFF karna chahte hain?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivating(true);
      setError("");

      await spinCampaignAPI.deactivate();

      setEnabled(false);

      showMessage(
        "Spin & Win campaign OFF kar diya gaya."
      );

      await loadCampaign();
    } catch (err) {
      console.error(
        "Deactivate Campaign Error:",
        err
      );

      showError(
        err?.response?.data?.message ||
          "Campaign deactivate nahi ho paaya."
      );
    } finally {
      setDeactivating(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-300 hover:border-[#8f3424]/40 hover:shadow-sm focus:border-[#8f3424] focus:ring-4 focus:ring-[#8f3424]/10 dark:border-white/10 dark:bg-[#211814] dark:text-white";

  const cardAnimation = pageReady
    ? "translate-y-0 opacity-100"
    : "translate-y-6 opacity-0";

  if (loading) {
    return (
      <AdminLayout>
        <div className="relative flex min-h-[calc(100vh-76px)] items-center justify-center overflow-hidden bg-[#f5f1eb] px-4 dark:bg-[#130e0b]">
          <div className="absolute left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-[#8f3424]/10 blur-3xl" />

          <div
            className="absolute bottom-10 right-10 h-52 w-52 animate-pulse rounded-full bg-[#d39a38]/10 blur-3xl"
            style={{
              animationDelay: "700ms",
            }}
          />

          <div className="relative w-full max-w-md rounded-3xl border border-[#8f3424]/10 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1410]/90">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#8f3424]/10" />

              <div className="absolute inset-1 animate-spin rounded-full border-4 border-[#8f3424]/10 border-t-[#8f3424]" />

              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8f3424] text-white shadow-lg">
                <FiGift
                  size={26}
                  className="animate-pulse"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-[#38271d] dark:text-white">
              Spin & Win
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Campaign settings load ho rahi hain...
            </p>

            <div className="mx-auto mt-6 h-2 w-full overflow-hidden rounded-full bg-[#8f3424]/10">
              <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-[#8f3424]" />
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#8f3424]">
              <FiActivity
                size={14}
                className="animate-pulse"
              />
              Connecting to campaign server
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="relative min-h-screen w-full overflow-hidden bg-[#f5f1eb] px-3 py-4 text-slate-800 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8 dark:bg-[#130e0b] dark:text-slate-100">
        <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#8f3424]/5 blur-3xl" />

        <div className="pointer-events-none absolute right-0 top-80 h-80 w-80 rounded-full bg-[#d39a38]/5 blur-3xl" />

        <div
          className={`relative z-10 transition-all duration-700 ${cardAnimation}`}
        >
          <section className="group mb-5 overflow-hidden rounded-2xl border border-[#8f3424]/10 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl sm:p-6 dark:border-white/10 dark:bg-[#1c1410]">
            <div className="absolute" />

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8f3424] text-white shadow-md transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <div className="absolute inset-0 rounded-xl bg-[#8f3424]/20 blur-md transition-all duration-500 group-hover:scale-125" />

                  <FiGift
                    size={22}
                    className="relative"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-[#38271d] dark:text-white sm:text-2xl">
                      Spin & Win Manager
                    </h1>

                    <FiZap
                      size={18}
                      className="animate-pulse text-[#d39a38]"
                    />
                  </div>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Vraj Creation Spin & Win campaign settings
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadCampaign(true)
                }
                disabled={
                  loading ||
                  refreshing ||
                  saving ||
                  deactivating
                }
                className="group/refresh inline-flex items-center justify-center gap-2 rounded-xl border border-[#8f3424]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#8f3424] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8f3424] hover:text-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#211814]"
              >
                <FiRefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : "transition-transform duration-500 group-hover/refresh:rotate-180"
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          </section>

          {message && (
            <div className="mb-5 flex animate-[pulse_0.4s_ease-out] items-start gap-3 rounded-xl border border-green-500/20 bg-green-50 p-4 text-green-700 shadow-sm dark:bg-green-950/20 dark:text-green-400">
              <FiCheck
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p className="text-sm font-semibold">
                {message}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-5 flex animate-[pulse_0.4s_ease-out] items-start gap-3 rounded-xl border border-red-500/20 bg-red-50 p-4 text-red-700 shadow-sm dark:bg-red-950/20 dark:text-red-400">
              <FiShield
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p className="text-sm font-semibold">
                {error}
              </p>
            </div>
          )}

          <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Campaign",
                value: enabled
                  ? "ACTIVE"
                  : "OFF",
                description:
                  "Current campaign status",
                icon: FiSettings,
              },
              {
                label: "Active Rewards",
                value: activeRewards.length,
                description:
                  "Rewards available on wheel",
                icon: FiGift,
              },
              {
                label: "Used Coupons",
                value: totalUsed,
                description:
                  "Total reward usage",
                icon: FiCheck,
              },
              {
                label: "Total Limit",
                value:
                  totalLimit === 0
                    ? "Unlimited"
                    : totalLimit,
                description:
                  "Combined maximum uses",
                icon: FiShield,
              },
            ].map(
              (
                item,
                index
              ) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={item.label}
                    style={{
                      transitionDelay: `${index * 100}ms`,
                    }}
                    className={`group rounded-2xl border border-[#8f3424]/10 bg-white p-5 shadow-sm transition-all duration-700 hover:-translate-y-2 hover:border-[#8f3424]/20 hover:shadow-xl dark:border-white/10 dark:bg-[#1c1410] ${cardAnimation}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {item.label}
                      </p>

                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8f3424]/10 text-[#8f3424] transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">
                        <Icon size={20} />
                      </div>
                    </div>

                    <p className="mt-3 text-xl font-bold transition-all duration-300 group-hover:translate-x-1">
                      {item.value}
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>

                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#8f3424]/10">
                      <div className="h-full w-1/2 rounded-full bg-[#8f3424] transition-all duration-700 group-hover:w-full" />
                    </div>
                  </div>
                );
              }
            )}
          </section>

          <section
            className={`mb-5 overflow-hidden rounded-2xl border border-[#8f3424]/10 bg-white shadow-sm transition-all duration-700 hover:shadow-xl dark:border-white/10 dark:bg-[#1c1410] ${cardAnimation}`}
            style={{
              transitionDelay: "350ms",
            }}
          >
            <div className="border-b border-[#8f3424]/10 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8f3424]/10 text-[#8f3424] transition-all duration-500 hover:rotate-6 hover:scale-110">
                  <FiSettings
                    size={20}
                  />
                </div>

                <div>
                  <h2 className="font-bold text-[#38271d] dark:text-white">
                    Campaign Settings
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Spin & Win campaign ki basic settings
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Campaign Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Vraj Creation Spin & Win"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Start Date & Time
                </label>

                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value
                      )
                    }
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Expiry Date & Time
                </label>

                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

                  <input
                    type="datetime-local"
                    value={expiryDate}
                    onChange={(event) =>
                      setExpiryDate(
                        event.target.value
                      )
                    }
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Duration Days
                </label>

                <input
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(event) =>
                    setDurationDays(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Session Time (Minutes)
                </label>

                <input
                  type="number"
                  min="1"
                  value={sessionMinutes}
                  onChange={(event) =>
                    setSessionMinutes(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={inputClass}
                />
              </div>

              <div className="group rounded-xl border border-slate-200 bg-[#faf8f5] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#8f3424]/30 hover:shadow-md lg:col-span-2 dark:border-white/10 dark:bg-[#211814]">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">
                      One Spin Per Mobile
                    </p>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Ek mobile number se sirf ek spin allow karega.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={
                        oneSpinPerMobile
                      }
                      onChange={(event) =>
                        setOneSpinPerMobile(
                          event.target
                            .checked
                        )
                      }
                      className="peer sr-only"
                    />

                    <div className="h-7 w-12 rounded-full bg-slate-300 transition-all duration-300 peer-checked:bg-[#8f3424] dark:bg-slate-700" />

                    <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section
            className={`mb-5 overflow-hidden rounded-2xl border border-[#8f3424]/10 bg-white shadow-sm transition-all duration-700 hover:shadow-xl dark:border-white/10 dark:bg-[#1c1410] ${cardAnimation}`}
            style={{
              transitionDelay: "450ms",
            }}
          >
            <div className="border-b border-[#8f3424]/10 p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8f3424]/10 text-[#8f3424] transition-all duration-500 hover:rotate-6 hover:scale-110">
                    <FiGift
                      size={20}
                    />
                  </div>

                  <div>
                    <h2 className="font-bold text-[#38271d] dark:text-white">
                      Wheel Rewards
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      3%, 5%, 7% aur 10% rewards configure karo.
                    </p>
                  </div>
                </div>

                <div className="animate-pulse rounded-full bg-[#8f3424]/10 px-3 py-1.5 text-xs font-bold text-[#8f3424]">
                  {activeRewards.length} Active
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {rewards.map(
                (
                  reward,
                  index
                ) => (
                  <div
                    key={
                      reward.wheelValue
                    }
                    style={{
                      transitionDelay: `${index * 120}ms`,
                    }}
                    className={`group rounded-2xl border border-[#8f3424]/10 bg-[#faf8f5] p-4 transition-all duration-700 hover:-translate-y-1 hover:border-[#8f3424]/30 hover:shadow-xl sm:p-5 dark:border-white/10 dark:bg-[#211814] ${cardAnimation}`}
                  >
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#8f3424] text-sm font-bold text-white shadow-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                          <div className="absolute inset-0 rounded-xl bg-[#8f3424]/20 blur-md transition-all duration-500 group-hover:scale-150" />

                          <span className="relative">
                            {
                              reward.wheelValue
                            }
                            %
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold transition-colors duration-300 group-hover:text-[#8f3424]">
                            {reward.name ||
                              `${reward.wheelValue}% Discount`}
                          </h3>

                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Wheel Value:{" "}
                            {
                              reward.wheelValue
                            }
                            %
                          </p>
                        </div>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            reward.active
                          )}
                          onChange={(
                            event
                          ) =>
                            updateReward(
                              index,
                              "active",
                              event.target
                                .checked
                            )
                          }
                          className="peer sr-only"
                        />

                        <div className="relative h-6 w-11 rounded-full bg-slate-300 transition-all duration-300 peer-checked:bg-[#8f3424] dark:bg-slate-700">
                          <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 peer-checked:translate-x-5" />
                        </div>

                        <span
                          className={
                            reward.active
                              ? "text-[#8f3424]"
                              : "text-slate-500"
                          }
                        >
                          {reward.active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Wheel Value
                        </label>

                        <select
                          value={
                            reward.wheelValue
                          }
                          onChange={(
                            event
                          ) =>
                            updateReward(
                              index,
                              "wheelValue",
                              Number(
                                event.target
                                  .value
                              )
                            )
                          }
                          className={inputClass}
                        >
                          <option value={3}>
                            3%
                          </option>

                          <option value={5}>
                            5%
                          </option>

                          <option value={7}>
                            7%
                          </option>

                          <option value={10}>
                            10%
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Discount %
                        </label>

                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={
                            reward.discount
                          }
                          onChange={(
                            event
                          ) =>
                            handleDiscountChange(
                              index,
                              event.target
                                .value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Coupon Code *
                        </label>

                        <input
                          type="text"
                          value={
                            reward.couponCode ||
                            reward.code ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateReward(
                              index,
                              "couponCode",
                              event.target
                                .value
                            )
                          }
                          placeholder={`VRAJ-SPIN-${reward.wheelValue}`}
                          className={`${inputClass} font-semibold uppercase`}
                        />

                        <p className="mt-1 text-[11px] text-slate-400">
                          Required by backend
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Reward Name
                        </label>

                        <input
                          type="text"
                          value={
                            reward.name ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateReward(
                              index,
                              "name",
                              event.target
                                .value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Minimum Order ₹
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            reward.minOrderAmount
                          }
                          onChange={(
                            event
                          ) =>
                            handleNumberChange(
                              index,
                              "minOrderAmount",
                              event.target
                                .value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Maximum Discount ₹
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            reward.maxDiscount
                          }
                          onChange={(
                            event
                          ) =>
                            handleNumberChange(
                              index,
                              "maxDiscount",
                              event.target
                                .value
                            )
                          }
                          className={inputClass}
                        />

                        <p className="mt-1 text-[11px] text-slate-400">
                          0 = no maximum limit
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Maximum Uses
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            reward.maxUses
                          }
                          onChange={(
                            event
                          ) =>
                            handleNumberChange(
                              index,
                              "maxUses",
                              event.target
                                .value
                            )
                          }
                          className={inputClass}
                        />

                        <p className="mt-1 text-[11px] text-slate-400">
                          0 = unlimited
                        </p>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Used Count
                        </label>

                        <div className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-600 transition-all duration-300 group-hover:border-[#8f3424]/20 dark:border-white/10 dark:bg-[#2b211c] dark:text-slate-300">
                          {reward.usedCount ||
                            0}
                        </div>
                      </div>

                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Description
                        </label>

                        <input
                          type="text"
                          value={
                            reward.description ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateReward(
                              index,
                              "description",
                              event.target
                                .value
                            )
                          }
                          placeholder="Get discount on your order."
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="sticky bottom-4 z-20 rounded-2xl border border-[#8f3424]/10 bg-white/95 p-4 shadow-xl backdrop-blur-xl transition-all duration-500 hover:shadow-2xl sm:p-5 dark:border-white/10 dark:bg-[#1c1410]/95">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      enabled
                        ? "animate-pulse bg-green-500"
                        : "bg-slate-400"
                    }`}
                  />

                  <p className="text-sm font-bold">
                    {enabled
                      ? "Campaign currently ACTIVE"
                      : "Campaign currently OFF"}
                  </p>
                </div>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Save karne ke baad changes public Spin & Win wheel par apply honge.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {enabled && (
                  <button
                    type="button"
                    onClick={
                      handleDeactivate
                    }
                    disabled={
                      saving ||
                      deactivating
                    }
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-red-100 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-950/20 dark:text-red-400"
                  >
                    {deactivating ? (
                      <FiRefreshCw
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <FiPower
                        size={16}
                        className="transition-transform duration-300 group-hover:rotate-90"
                      />
                    )}

                    {deactivating
                      ? "Turning OFF..."
                      : "Turn OFF"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving ||
                    deactivating
                  }
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#8f3424] px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-[#713622] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-700 group-hover:translate-x-full" />

                  <span className="relative flex items-center gap-2">
                    {saving ? (
                      <>
                        <FiRefreshCw
                          size={16}
                          className="animate-spin"
                        />

                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave
                          size={16}
                          className="transition-transform duration-300 group-hover:scale-110"
                        />

                        Save Campaign
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </section>

          <div className="mt-5 rounded-xl border border-[#d39a38]/20 bg-[#d39a38]/5 p-4 text-xs leading-5 text-slate-600 transition-all duration-300 hover:border-[#d39a38]/40 hover:shadow-md dark:text-slate-400">
            <strong className="text-[#8f3424]">
              Note:
            </strong>{" "}
            Current Spin & Win system mein 3%, 5%, 7%
            aur 10% rewards use kiye ja rahe hain.
            Har reward ke liye valid wheel value,
            discount aur unique coupon code required hai.
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}