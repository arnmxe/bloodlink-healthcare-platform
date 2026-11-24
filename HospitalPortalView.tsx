"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  LayoutDashboard,
  Menu,
  Radio,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import {
  BloodLinkLogo,
  BLButton,
  BloodTypeBadge,
  StatCard,
  StatusBadge,
} from "@/components/ui/BloodLinkUI";
import {
  BloodAllocationView,
  HospitalRequestsView,
  TransfusionTrackingView,
} from "@/components/admin/AdminClinicalAndAnalytics";
import { DonorProximityRadar } from "@/components/radar/DonorProximityRadar";
import { PARTNER_HOSPITALS } from "@/lib/bloodlink-utils";
import type {
  BloodLinkDataset,
  HospitalModuleKey,
} from "@/types/bloodlink";

export function HospitalPortalView({
  data,
  activeHospitalName,
  onChangeHospital,
  onMutate,
  actorName,
}: {
  data: BloodLinkDataset;
  activeHospitalName: string;
  onChangeHospital: (name: string) => void;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  actorName: string;
}) {
  const [activeMod, setActiveMod] = useState<HospitalModuleKey>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hospitalRef = useMemo(
    () =>
      PARTNER_HOSPITALS.find((h) => h.name === activeHospitalName) ||
      PARTNER_HOSPITALS[0],
    [activeHospitalName]
  );

  const myRequests = useMemo(
    () => data.requests.filter((r) => r.hospitalName === activeHospitalName),
    [data.requests, activeHospitalName]
  );

  const pendingCount = myRequests.filter(
    (r) => r.status === "Pending" || r.status === "Under Review"
  ).length;
  const approvedCount = myRequests.filter(
    (r) => r.status === "Approved" || r.status === "Ready for Release"
  ).length;
  const fulfilledCount = myRequests.filter(
    (r) =>
      r.status === "Released" ||
      r.status === "Completed" ||
      r.status === "Partially Fulfilled"
  ).length;
  const emergencyCount = myRequests.filter(
    (r) => r.urgency === "Emergency"
  ).length;

  const hospitalNotifications = useMemo(
    () =>
      data.notifications.filter(
        (n) =>
          n.targetPortal === "Hospital" &&
          (!n.hospitalName || n.hospitalName === activeHospitalName)
      ),
    [data.notifications, activeHospitalName]
  );

  const unreadCount = hospitalNotifications.filter((n) => !n.isRead).length;

  const navItems: {
    key: HospitalModuleKey;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      key: "submit_request",
      label: "Submit Blood Request",
      icon: <FilePlus2 className="h-4 w-4" />,
    },
    {
      key: "request_history",
      label: "Request History",
      icon: <ClipboardList className="h-4 w-4" />,
      badge: myRequests.length,
    },
    {
      key: "radar",
      label: "Donor Proximity Radar",
      icon: <Radio className="h-4 w-4" />,
    },
    {
      key: "allocation",
      label: "Blood Allocation",
      icon: <Truck className="h-4 w-4" />,
    },
    {
      key: "transfusion",
      label: "Transfusion Records",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      key: "profile",
      label: "Hospital Profile",
      icon: <Building2 className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-3.25rem)] flex bg-[#F5F6F8]">
      {/* Hospital Sidebar (Desktop & Collapsible Tablet/Mobile Drawer) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#172B4D] text-white flex flex-col justify-between transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <BloodLinkLogo variant="light" size="sm" showTagline />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-300 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-300">
              Partner Hospital Portal
            </div>
            <select
              aria-label="Active Partner Hospital"
              value={activeHospitalName}
              onChange={(e) => onChangeHospital(e.target.value)}
              className="mt-1.5 w-full bg-[#0F1E36] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none"
            >
              {PARTNER_HOSPITALS.map((h) => (
                <option key={h.name} value={h.name}>
                  {h.shortName}
                </option>
              ))}
            </select>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const active = activeMod === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveMod(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? "bg-[#C62828] text-white shadow-xs"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        active ? "bg-white text-[#C62828]" : "bg-white/15 text-white"
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

        <div className="p-4 border-t border-white/10 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Authorized Scope Active
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Hospital personnel only access de-identified radar telemetry and explicitly consented donor coordination records.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-[#172B4D]"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#172B4D]">
                {navItems.find((n) => n.key === activeMod)?.label} —{" "}
                {hospitalRef.shortName}
              </h1>
              <p className="text-xs text-slate-500">
                {hospitalRef.dohLevel} • Head: {hospitalRef.bloodBankHead}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BLButton
              size="sm"
              variant="secondary"
              onClick={() => setActiveMod("radar")}
            >
              <Radio className="h-4 w-4 text-[#C62828]" /> Donor Radar
            </BLButton>
            <BLButton
              size="sm"
              variant="primary"
              onClick={() => setActiveMod("submit_request")}
            >
              <FilePlus2 className="h-4 w-4" /> New Blood Request
            </BLButton>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-6">
          {activeMod === "dashboard" && (
            <div className="space-y-6">
              {/* 5 Hospital Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  label="Total Requests"
                  value={myRequests.length}
                  subtext="Submitted by facility"
                  icon={<ClipboardList className="h-5 w-5" />}
                  tone="navy"
                  onClick={() => setActiveMod("request_history")}
                />
                <StatCard
                  label="Pending Requests"
                  value={pendingCount}
                  subtext="Under blood bank review"
                  icon={<Clock className="h-5 w-5" />}
                  tone="orange"
                  onClick={() => setActiveMod("request_history")}
                />
                <StatCard
                  label="Approved Requests"
                  value={approvedCount}
                  subtext="Cleared / Ready for pickup"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                  tone="green"
                  onClick={() => setActiveMod("allocation")}
                />
                <StatCard
                  label="Fulfilled Requests"
                  value={fulfilledCount}
                  subtext="Released or transfused"
                  icon={<Truck className="h-5 w-5" />}
                  tone="green"
                  onClick={() => setActiveMod("transfusion")}
                />
                <StatCard
                  label="Emergency Requests"
                  value={emergencyCount}
                  subtext="STAT trauma & critical care"
                  icon={<AlertTriangle className="h-5 w-5" />}
                  tone="red"
                  onClick={() => setActiveMod("submit_request")}
                />
              </div>

              {/* Hospital Request Tracking Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#172B4D]">
                      Hospital Blood Request Tracking Table
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time fulfillment & crossmatching status from PRC Regional Blood Centers
                    </p>
                  </div>
                  <BLButton
                    size="xs"
                    variant="secondary"
                    onClick={() => setActiveMod("request_history")}
                  >
                    Full Request History
                  </BLButton>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Request Code</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Blood Group</th>
                        <th className="px-4 py-3">Component & Qty</th>
                        <th className="px-4 py-3">Crossmatch Status</th>
                        <th className="px-4 py-3">Urgency</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                            {r.requestCode}
                          </td>
                          <td className="px-4 py-3 font-medium text-[#172B4D]">
                            {r.department}
                          </td>
                          <td className="px-4 py-3">
                            <BloodTypeBadge bloodType={r.bloodType} />
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {r.component} ({r.unitsFulfilled}/{r.unitsRequested}u)
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.crossmatchStatus} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.urgency} />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Embedded Donor Proximity Radar on Hospital Dashboard */}
              <div>
                <h2 className="text-sm font-bold text-[#172B4D] mb-2.5">
                  Hospital Donor Proximity Radar (Authorized Privacy-Protected View)
                </h2>
                <DonorProximityRadar
                  markers={data.radarMarkers}
                  bloodCenters={data.bloodCenters}
                  broadcasts={data.radarBroadcasts}
                  responses={data.radarResponses}
                  defaultHospitalName={activeHospitalName}
                  actorName={actorName}
                  onSendBroadcast={(payload) =>
                    onMutate({ action: "send_radar_broadcast", ...payload })
                  }
                />
              </div>
            </div>
          )}

          {activeMod === "submit_request" && (
            <HospitalRequestsView
              data={data}
              onMutate={onMutate}
              scopedHospitalName={activeHospitalName}
              defaultOpenSubmit
            />
          )}

          {activeMod === "request_history" && (
            <HospitalRequestsView
              data={data}
              onMutate={onMutate}
              scopedHospitalName={activeHospitalName}
            />
          )}

          {activeMod === "radar" && (
            <DonorProximityRadar
              markers={data.radarMarkers}
              bloodCenters={data.bloodCenters}
              broadcasts={data.radarBroadcasts}
              responses={data.radarResponses}
              defaultHospitalName={activeHospitalName}
              actorName={actorName}
              onSendBroadcast={(payload) =>
                onMutate({ action: "send_radar_broadcast", ...payload })
              }
            />
          )}

          {activeMod === "allocation" && (
            <BloodAllocationView
              data={data}
              onMutate={onMutate}
              scopedHospitalName={activeHospitalName}
            />
          )}

          {activeMod === "transfusion" && (
            <TransfusionTrackingView
              data={data}
              onMutate={onMutate}
              scopedHospitalName={activeHospitalName}
            />
          )}

          {activeMod === "notifications" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 max-w-3xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-bold text-[#172B4D]">
                  Hospital Blood Bank Notifications ({hospitalNotifications.length})
                </h3>
                <BLButton
                  size="xs"
                  variant="secondary"
                  onClick={() =>
                    onMutate({
                      action: "mark_notifications_read",
                      targetPortal: "Hospital",
                    })
                  }
                >
                  Mark All Read
                </BLButton>
              </div>
              {hospitalNotifications.map((n) => (
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
                    <span className="text-[11px] text-slate-500">
                      {n.createdAtLabel}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{n.message}</p>
                </div>
              ))}
            </div>
          )}

          {activeMod === "profile" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs max-w-3xl space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase text-[#C62828]">
                    Accredited Hospital Blood Bank Profile
                  </span>
                  <h2 className="text-xl font-bold text-[#172B4D] mt-0.5">
                    {hospitalRef.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {hospitalRef.address}
                  </p>
                </div>
                <StatusBadge status="Verified Facility" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                  <div className="text-slate-500">DOH Classification</div>
                  <div className="font-bold text-[#172B4D] mt-1">
                    {hospitalRef.dohLevel}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                  <div className="text-slate-500">Blood Bank Pathologist / Head</div>
                  <div className="font-bold text-[#172B4D] mt-1">
                    {hospitalRef.bloodBankHead}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                  <div className="text-slate-500">Direct Transfusion Hotline</div>
                  <div className="font-bold text-[#172B4D] mt-1 tabular-nums">
                    {hospitalRef.contactPhone}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F5F6F8]">
                  <div className="text-slate-500">Radar Hub Coordinates</div>
                  <div className="font-bold text-[#172B4D] mt-1 tabular-nums">
                    {hospitalRef.lat}° N, {hospitalRef.lng}° E
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
