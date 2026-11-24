"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  Droplets,
  FileSpreadsheet,
  HeartPulse,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Settings,
  ShieldCheck,
  Smartphone,
  Syringe,
  Truck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  BloodLinkLogo,
  BLButton,
  BLModal,
  DesignSystemShowcase,
  ErrorAlert,
  LoadingState,
} from "@/components/ui/BloodLinkUI";
import { AuthSuite } from "@/components/auth/AuthSuite";
import {
  AdminDashboardView,
  BloodCollectionView,
  BloodInventoryView,
  DonorManagementView,
} from "@/components/admin/AdminCoreModules";
import {
  BloodAllocationView,
  BloodCentersManagementView,
  HospitalRequestsView,
  ReportsAndAnalyticsView,
  SystemSettingsView,
  TransfusionTrackingView,
  UserManagementView,
} from "@/components/admin/AdminClinicalAndAnalytics";
import { DonorProximityRadar } from "@/components/radar/DonorProximityRadar";
import { HospitalPortalView } from "@/components/hospital/HospitalPortalView";
import { DonorMobileApp } from "@/components/mobile/DonorMobileApp";
import type {
  AdminModuleKey,
  BloodLinkDataset,
  PortalMode,
} from "@/types/bloodlink";

export default function BloodLinkRootPage() {
  const [data, setData] = useState<BloodLinkDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Active Ecosystem Portal & Role Session
  const [portalMode, setPortalMode] = useState<PortalMode>("admin");
  const [currentUserLabel, setCurrentUserLabel] = useState<string>(
    "Dr. Elena Santos-Reyes, MD (Blood Center Admin)"
  );
  const [activeHospitalName, setActiveHospitalName] = useState<string>(
    "Philippine General Hospital (PGH)"
  );
  const [activeDonorId, setActiveDonorId] = useState<number>(1);

  // Admin Navigation & Responsive Sidebar State
  const [adminModule, setAdminModule] = useState<AdminModuleKey>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);

  const fetchDataset = useCallback(async () => {
    try {
      setError("");
      const res = await fetch("/api/bloodlink", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: BloodLinkDataset = await res.json();
      setData(json);
      if (json.donors.length > 0 && activeDonorId === 1) {
        setActiveDonorId(json.donors[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to synchronize with BloodLink PostgreSQL database.");
    } finally {
      setLoading(false);
    }
  }, [activeDonorId]);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  const mutateBloodLink = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/bloodlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Mutation request failed");
      }
      await fetchDataset();
    },
    [fetchDataset]
  );

  // Fullscreen Split-Screen Authentication Flow
  if (portalMode === "auth") {
    return (
      <AuthSuite
        onAuthenticated={(nextPortal, roleLabel, hospName) => {
          setPortalMode(nextPortal);
          setCurrentUserLabel(roleLabel);
          if (hospName) setActiveHospitalName(hospName);
        }}
      />
    );
  }

  const adminNavItems: {
    key: AdminModuleKey;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />,
    },
    {
      key: "donors",
      label: "Donor Management",
      icon: <Users className="h-4 w-4 shrink-0" />,
      badge: data?.donors.length,
    },
    {
      key: "collection",
      label: "Blood Collection",
      icon: <Syringe className="h-4 w-4 shrink-0" />,
    },
    {
      key: "inventory",
      label: "Blood Inventory",
      icon: <Droplets className="h-4 w-4 shrink-0" />,
      badge: data?.inventory.filter((u) => u.status === "Available").length,
    },
    {
      key: "radar",
      label: "Donor Proximity Radar",
      icon: <Radio className="h-4 w-4 shrink-0" />,
    },
    {
      key: "requests",
      label: "Hospital Requests",
      icon: <ClipboardCheck className="h-4 w-4 shrink-0" />,
      badge: data?.requests.filter((r) => r.status === "Pending").length || undefined,
    },
    {
      key: "allocation",
      label: "Blood Allocation",
      icon: <Truck className="h-4 w-4 shrink-0" />,
    },
    {
      key: "transfusion",
      label: "Transfusion Tracking",
      icon: <Activity className="h-4 w-4 shrink-0" />,
    },
    {
      key: "centers",
      label: "Blood Centers",
      icon: <Building2 className="h-4 w-4 shrink-0" />,
    },
    {
      key: "reports",
      label: "Reports and Analytics",
      icon: <BarChart3 className="h-4 w-4 shrink-0" />,
    },
    {
      key: "users",
      label: "User Management",
      icon: <UserCog className="h-4 w-4 shrink-0" />,
    },
    {
      key: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4 shrink-0" />,
    },
  ];

  const adminUnreadCount =
    data?.notifications.filter(
      (n) => n.targetPortal === "Admin" && !n.isRead
    ).length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F8]">
      {/* Connected Ecosystem Workspace Switcher Bar */}
      <div className="h-13 bg-[#0F1E36] text-white px-3 sm:px-5 flex items-center justify-between gap-2 border-b border-white/10 shrink-0 no-print">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold tracking-tight text-white">
            <HeartPulse className="h-4 w-4 text-[#C62828]" />
            BloodLink Ecosystem
          </span>
          <span className="hidden md:inline text-slate-500">|</span>

          {/* Portal Switcher Tabs: Part A, Part C, Part B, Part D */}
          <div className="flex items-center gap-1 bg-white/8 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setPortalMode("admin");
                if (adminModule === "design_system") setAdminModule("dashboard");
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                portalMode === "admin" && adminModule !== "design_system"
                  ? "bg-[#C62828] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Web Admin
            </button>
            <button
              type="button"
              onClick={() => setPortalMode("hospital")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                portalMode === "hospital"
                  ? "bg-[#C62828] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Hospital Portal
            </button>
            <button
              type="button"
              onClick={() => setPortalMode("mobile")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                portalMode === "mobile"
                  ? "bg-[#C62828] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Donor Mobile App
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode("admin");
                setAdminModule("design_system");
              }}
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                portalMode === "admin" && adminModule === "design_system"
                  ? "bg-[#C62828] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Design System
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden xl:inline text-xs text-slate-300 truncate max-w-[280px]">
            {currentUserLabel}
          </span>
          <button
            type="button"
            onClick={() => setPortalMode("auth")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-red-300" />
            <span className="hidden sm:inline">Auth / Sign Out</span>
          </button>
        </div>
      </div>

      {/* Loading / Error Handling */}
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <div className="p-6 max-w-xl mx-auto w-full">
          <ErrorAlert
            message={error || "Dataset unavailable"}
            onRetry={fetchDataset}
          />
        </div>
      ) : portalMode === "hospital" ? (
        /* PART C: HOSPITAL PORTAL */
        <HospitalPortalView
          data={data}
          activeHospitalName={activeHospitalName}
          onChangeHospital={setActiveHospitalName}
          onMutate={mutateBloodLink}
          actorName={currentUserLabel}
        />
      ) : portalMode === "mobile" ? (
        /* PART B: DONOR MOBILE APPLICATION */
        <DonorMobileApp
          data={data}
          activeDonorId={activeDonorId}
          onSelectDonor={setActiveDonorId}
          onMutate={mutateBloodLink}
        />
      ) : (
        /* PART A: ADMINISTRATOR & BLOOD CENTER WEB APPLICATION */
        <div className="flex-1 flex min-h-[calc(100vh-3.25rem)]">
          {/* Mobile Backdrop */}
          {mobileDrawerOpen && (
            <div
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 z-30 bg-[#172B4D]/50 lg:hidden"
            />
          )}

          {/* Navy Sidebar (Desktop Full / Tablet Collapsible / Mobile Drawer) */}
          <aside
            className={`fixed lg:static inset-y-0 left-0 z-40 bg-[#172B4D] text-white flex flex-col justify-between transition-all duration-200 no-print ${
              sidebarCollapsed ? "lg:w-20" : "lg:w-64"
            } w-64 ${
              mobileDrawerOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <div className="overflow-y-auto">
              <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
                {!sidebarCollapsed ? (
                  <BloodLinkLogo variant="light" size="sm" showTagline />
                ) : (
                  <div className="mx-auto">
                    <div className="h-9 w-9 rounded-lg bg-[#C62828] flex items-center justify-center text-white font-bold">
                      BL
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="lg:hidden text-slate-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="p-2.5 space-y-1">
                {adminNavItems.map((item) => {
                  const active = adminModule === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      title={item.label}
                      onClick={() => {
                        setAdminModule(item.key);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center ${
                        sidebarCollapsed
                          ? "justify-center px-2"
                          : "justify-between px-3"
                      } py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? "bg-[#C62828] text-white shadow-xs"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        {item.icon}
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </span>
                      {!sidebarCollapsed && item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                            active
                              ? "bg-white text-[#C62828]"
                              : "bg-white/15 text-slate-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Sidebar Collapse Toggle & Compliance Footer */}
            <div className="p-3 border-t border-white/10 space-y-2">
              {!sidebarCollapsed && (
                <div className="px-2 py-2 rounded-lg bg-white/6 text-[10px] text-slate-300 leading-relaxed">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> PRC National Blood Network
                  </div>
                  Conventional deterministic platform • RA 10173 Privacy Protected
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <>
                    <PanelLeftClose className="h-4 w-4" /> Collapse Sidebar
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Main Admin Workspace */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Top Module Header */}
            <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="lg:hidden p-2 rounded-lg border border-slate-200 text-[#172B4D]"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#172B4D]">
                    {adminModule === "design_system"
                      ? "Reusable Healthcare UI Design System"
                      : adminNavItems.find((i) => i.key === adminModule)?.label}
                  </h1>
                  <p className="text-xs text-slate-500">
                    BloodLink Central Coordination • Connecting Donors. Saving Lives.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <BLButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setAdminModule("radar")}
                >
                  <Radio className="h-4 w-4 text-[#C62828]" />
                  <span className="hidden sm:inline">Donor Proximity Radar</span>
                </BLButton>

                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[#172B4D] cursor-pointer"
                  aria-label="Open System Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {adminUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-[#C62828] text-white text-[10px] font-bold flex items-center justify-center">
                      {adminUnreadCount}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* Module View Body */}
            <main className="p-4 sm:p-6 flex-1">
              {adminModule === "dashboard" && (
                <AdminDashboardView data={data} onNavigate={setAdminModule} />
              )}
              {adminModule === "donors" && (
                <DonorManagementView data={data} onMutate={mutateBloodLink} />
              )}
              {adminModule === "collection" && (
                <BloodCollectionView data={data} onMutate={mutateBloodLink} />
              )}
              {adminModule === "inventory" && (
                <BloodInventoryView data={data} onMutate={mutateBloodLink} />
              )}
              {adminModule === "radar" && (
                <DonorProximityRadar
                  markers={data.radarMarkers}
                  bloodCenters={data.bloodCenters}
                  broadcasts={data.radarBroadcasts}
                  responses={data.radarResponses}
                  actorName={currentUserLabel}
                  onSendBroadcast={(payload) =>
                    mutateBloodLink({
                      action: "send_radar_broadcast",
                      ...payload,
                    })
                  }
                />
              )}
              {adminModule === "requests" && (
                <HospitalRequestsView data={data} onMutate={mutateBloodLink} />
              )}
              {adminModule === "allocation" && (
                <BloodAllocationView data={data} onMutate={mutateBloodLink} />
              )}
              {adminModule === "transfusion" && (
                <TransfusionTrackingView
                  data={data}
                  onMutate={mutateBloodLink}
                />
              )}
              {adminModule === "centers" && (
                <BloodCentersManagementView
                  data={data}
                  onMutate={mutateBloodLink}
                />
              )}
              {adminModule === "reports" && (
                <ReportsAndAnalyticsView data={data} />
              )}
              {adminModule === "users" && (
                <UserManagementView data={data} onMutate={mutateBloodLink} />
              )}
              {adminModule === "settings" && <SystemSettingsView />}
              {adminModule === "design_system" && <DesignSystemShowcase />}
            </main>
          </div>
        </div>
      )}

      {/* Admin Notification Center Modal */}
      <BLModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Blood Center Coordination Notifications"
        subtitle="Real-time alerts across hospital STAT requests, cold-chain inventory, and radar responses."
      >
        <div className="space-y-3">
          {data?.notifications
            .filter((n) => n.targetPortal === "Admin")
            .map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border text-xs ${
                  n.isRead
                    ? "bg-white border-slate-200"
                    : "bg-red-50/40 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#172B4D]">{n.title}</span>
                  <span className="text-[11px] text-slate-400">
                    {n.createdAtLabel}
                  </span>
                </div>
                <p className="text-slate-600 mt-1">{n.message}</p>
              </div>
            ))}
          <div className="flex justify-end gap-2 pt-2">
            <BLButton
              variant="secondary"
              onClick={async () => {
                await mutateBloodLink({
                  action: "mark_notifications_read",
                  targetPortal: "Admin",
                });
                setNotificationsOpen(false);
              }}
            >
              Mark All Read
            </BLButton>
            <BLButton
              variant="primary"
              onClick={() => setNotificationsOpen(false)}
            >
              Close
            </BLButton>
          </div>
        </div>
      </BLModal>
    </div>
  );
}
