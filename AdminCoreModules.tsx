"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Droplets,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Filter,
  History,
  MapPin,
  Plus,
  Shield,
  Stethoscope,
  Syringe,
  Trash2,
  Users,
} from "lucide-react";
import {
  BLButton,
  BLModal,
  BloodTypeBadge,
  ConfirmDialog,
  EmptyState,
  FormInput,
  FormSelect,
  SearchBar,
  StatCard,
  StatusBadge,
  TablePagination,
} from "@/components/ui/BloodLinkUI";
import {
  BLOOD_COMPONENTS,
  BLOOD_TYPES,
  daysUntilExpiration,
} from "@/lib/bloodlink-utils";
import type {
  AdminModuleKey,
  BloodLinkDataset,
  BloodInventoryUnit,
  DonorRecord,
} from "@/types/bloodlink";

/* ============================================================================
 * SECTION 5: ADMINISTRATOR DASHBOARD
 * ========================================================================== */
export function AdminDashboardView({
  data,
  onNavigate,
}: {
  data: BloodLinkDataset;
  onNavigate: (mod: AdminModuleKey) => void;
}) {
  const availableUnits = useMemo(
    () => data.inventory.filter((u) => u.status === "Available"),
    [data.inventory]
  );

  const pendingRequests = useMemo(
    () =>
      data.requests.filter(
        (r) =>
          r.status === "Pending" ||
          r.status === "Under Review" ||
          r.status === "Partially Fulfilled"
      ),
    [data.requests]
  );

  const emergencyRequests = useMemo(
    () =>
      data.requests.filter(
        (r) =>
          r.urgency === "Emergency" &&
          r.status !== "Completed" &&
          r.status !== "Rejected"
      ),
    [data.requests]
  );

  const expiringUnits = useMemo(
    () =>
      data.inventory.filter((u) => {
        if (u.status !== "Available" && u.status !== "Reserved") return false;
        const d = daysUntilExpiration(u.expirationDate);
        return d >= 0 && d <= 7;
      }),
    [data.inventory]
  );

  const activeDrivesCount = useMemo(
    () => data.bloodCenters.filter((c) => c.status === "Active").length,
    [data.bloodCenters]
  );

  // Blood type availability counts
  const bloodTypeCounts = useMemo(() => {
    return BLOOD_TYPES.map((bt) => ({
      bloodType: bt,
      available: availableUnits.filter((u) => u.bloodType === bt).length,
      reserved: data.inventory.filter(
        (u) => u.bloodType === bt && u.status === "Reserved"
      ).length,
    }));
  }, [availableUnits, data.inventory]);

  // Inventory distribution by component
  const componentDistribution = useMemo(() => {
    return BLOOD_COMPONENTS.map((comp) => ({
      component: comp,
      count: availableUnits.filter((u) => u.component === comp).length,
    }));
  }, [availableUnits]);

  const maxBtCount = Math.max(
    6,
    ...bloodTypeCounts.map((b) => b.available + b.reserved)
  );
  const maxCompCount = Math.max(
    6,
    ...componentDistribution.map((c) => c.count)
  );

  return (
    <div className="space-y-6">
      {/* Emergency Request Notification Banner */}
      {emergencyRequests.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#C62828] text-white shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#C62828]">
                Emergency Blood Request Notification ({emergencyRequests.length} Active STAT)
              </div>
              <p className="text-sm font-semibold text-[#172B4D] mt-0.5">
                {emergencyRequests[0].hospitalName} — {emergencyRequests[0].unitsRequested} units{" "}
                {emergencyRequests[0].bloodType} {emergencyRequests[0].component} ({emergencyRequests[0].requestCode})
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {emergencyRequests[0].medicalJustification}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BLButton size="sm" variant="secondary" onClick={() => onNavigate("radar")}>
              Open Proximity Radar
            </BLButton>
            <BLButton size="sm" variant="primary" onClick={() => onNavigate("allocation")}>
              Review & Allocate
            </BLButton>
          </div>
        </div>
      )}

      {/* 6 Dashboard Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Registered Donors"
          value={data.donors.length}
          subtext={`${data.donors.filter((d) => d.registrationStatus === "Verified").length} verified voluntary donors`}
          icon={<Users className="h-5 w-5" />}
          tone="navy"
          onClick={() => onNavigate("donors")}
        />
        <StatCard
          label="Available Blood Units"
          value={availableUnits.length}
          subtext="TTI-cleared & cold-chain verified"
          icon={<Droplets className="h-5 w-5" />}
          tone="green"
          onClick={() => onNavigate("inventory")}
        />
        <StatCard
          label="Pending Hospital Requests"
          value={pendingRequests.length}
          subtext="Awaiting review or crossmatch"
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="orange"
          onClick={() => onNavigate("requests")}
        />
        <StatCard
          label="Active Collection Drives"
          value={activeDrivesCount}
          subtext="PRC chapters & mobile units"
          icon={<Calendar className="h-5 w-5" />}
          tone="neutral"
          onClick={() => onNavigate("centers")}
        />
        <StatCard
          label="Expiring Blood Units"
          value={expiringUnits.length}
          subtext="Expiring within next 7 days"
          icon={<Clock className="h-5 w-5" />}
          tone="orange"
          onClick={() => onNavigate("inventory")}
        />
        <StatCard
          label="Emergency Requests"
          value={emergencyRequests.length}
          subtext="Immediate STAT trauma / ICU"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="red"
          onClick={() => onNavigate("requests")}
        />
      </div>

      {/* Charts Row: Blood Type Availability Chart + Blood Inventory Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Blood Type Availability Chart */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">
                Blood Type Availability Chart
              </h3>
              <p className="text-xs text-slate-500">
                Real-time TTI-cleared available vs. crossmatch-reserved units by ABO/Rh group
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1.5 text-[#172B4D]">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#C62828]" /> Available
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#ED8B00]" /> Reserved
              </span>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-3 items-end h-48 pt-6 px-2 border-b border-slate-200">
            {bloodTypeCounts.map((item) => {
              const availHeight = Math.round((item.available / maxBtCount) * 135);
              const resHeight = Math.round((item.reserved / maxBtCount) * 135);
              return (
                <div
                  key={item.bloodType}
                  className="flex flex-col items-center justify-end h-full group"
                >
                  <span className="text-xs font-bold text-[#172B4D] tabular-nums mb-1.5">
                    {item.available}
                  </span>
                  <div className="w-full max-w-[34px] flex flex-col justify-end rounded-t-md overflow-hidden">
                    {item.reserved > 0 && (
                      <div
                        style={{ height: `${Math.max(8, resHeight)}px` }}
                        className="w-full bg-[#ED8B00] transition-all"
                        title={`${item.reserved} Reserved`}
                      />
                    )}
                    <div
                      style={{ height: `${Math.max(10, availHeight)}px` }}
                      className="w-full bg-[#C62828] group-hover:bg-[#8E1B1B] transition-all"
                      title={`${item.available} Available`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-3 pt-2.5 px-2 text-center">
            {bloodTypeCounts.map((item) => (
              <div key={item.bloodType} className="text-xs font-bold text-[#172B4D]">
                {item.bloodType}
              </div>
            ))}
          </div>
        </div>

        {/* Blood Inventory Distribution Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">
              Blood Inventory Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Available blood components across cold-storage (+4°C, +22°C, -30°C)
            </p>
            <div className="space-y-3.5">
              {componentDistribution.map((c) => {
                const pct = Math.round((c.count / maxCompCount) * 100);
                return (
                  <div key={c.component}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-[#172B4D]">{c.component}</span>
                      <span className="font-bold text-[#172B4D] tabular-nums">
                        {c.count} units
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[#F5F6F8] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#172B4D]"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Quarantine Hold: {data.inventory.filter((u) => u.status === "Quarantined").length} unit(s)</span>
            <button
              type="button"
              onClick={() => onNavigate("inventory")}
              className="font-semibold text-[#C62828] hover:underline cursor-pointer"
            >
              Full Inventory Ledger →
            </button>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Hospital Requests & Expiring Blood Units Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Recent Hospital Requests</h3>
              <p className="text-xs text-slate-500">Incoming partner hospital blood requisitions</p>
            </div>
            <BLButton size="xs" variant="secondary" onClick={() => onNavigate("requests")}>
              View All
            </BLButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Ref ID</th>
                  <th className="px-4 py-2.5 font-semibold">Hospital</th>
                  <th className="px-4 py-2.5 font-semibold">Type & Component</th>
                  <th className="px-4 py-2.5 font-semibold">Urgency</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.requests.slice(0, 5).map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                      {req.requestCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#172B4D]">{req.hospitalName}</div>
                      <div className="text-[11px] text-slate-500">{req.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <BloodTypeBadge bloodType={req.bloodType} />
                        <span className="font-medium text-slate-700">
                          {req.component} ({req.unitsRequested}u)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.urgency} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Blood Units Table & Recent Donation Activities */}
        <div className="xl:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">
                  Expiring Blood Units (≤ 7 Days)
                </h3>
                <p className="text-xs text-slate-500">Priority FEFO allocation candidates</p>
              </div>
              <Clock className="h-4 w-4 text-[#ED8B00]" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Unit ID</th>
                    <th className="px-4 py-2 font-semibold">Type</th>
                    <th className="px-4 py-2 font-semibold">Component</th>
                    <th className="px-4 py-2 font-semibold">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringUnits.slice(0, 5).map((u) => {
                    const daysLeft = daysUntilExpiration(u.expirationDate);
                    return (
                      <tr key={u.id} className="hover:bg-amber-50/30">
                        <td className="px-4 py-2.5 font-bold text-[#172B4D] tabular-nums">
                          {u.unitId}
                        </td>
                        <td className="px-4 py-2.5">
                          <BloodTypeBadge bloodType={u.bloodType} />
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{u.component}</td>
                        <td className="px-4 py-2.5 font-semibold text-[#C62828] tabular-nums">
                          {u.expirationDate} ({daysLeft}d)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Donation Activities */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#172B4D]">Recent Donation Activities</h3>
              <button
                type="button"
                onClick={() => onNavigate("collection")}
                className="text-xs font-semibold text-[#C62828] hover:underline cursor-pointer"
              >
                Collection Log →
              </button>
            </div>
            <div className="space-y-2.5">
              {data.collections.slice(0, 4).map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F5F6F8]/70 border border-slate-100 text-xs"
                >
                  <div>
                    <div className="font-bold text-[#172B4D] tabular-nums">
                      {col.unitId} • {col.component} ({col.volumeMl} mL)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {col.centerName} • Donor {col.donorCode}
                    </div>
                  </div>
                  <StatusBadge status={col.testingStatus} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * SECTION 6: DONOR MANAGEMENT & DETAILED DONOR PROFILE
 * ========================================================================== */
export function DonorManagementView({
  data,
  onMutate,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [authorizedBloodTypeView, setAuthorizedBloodTypeView] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Detailed Donor Profile sub-screen
  const [selectedProfile, setSelectedProfile] = useState<DonorRecord | null>(null);

  // Modals: Add/Edit Donor, Screening, Consent/Privacy, Delete Confirmation
  const [donorModalOpen, setDonorModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<DonorRecord | null>(null);
  const [screeningDonor, setScreeningDonor] = useState<DonorRecord | null>(null);
  const [consentDonor, setConsentDonor] = useState<DonorRecord | null>(null);
  const [deletingDonor, setDeletingDonor] = useState<DonorRecord | null>(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [birthday, setBirthday] = useState("1995-05-12");
  const [sex, setSex] = useState("Male");
  const [bloodType, setBloodType] = useState("O+");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [sectorLabel, setSectorLabel] = useState("Ermita-Malate Sector, Manila");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Screening states
  const [hgb, setHgb] = useState("14.2");
  const [bp, setBp] = useState("120/80 mmHg");
  const [weight, setWeight] = useState("65");
  const [regStatus, setRegStatus] = useState("Verified");
  const [btVerified, setBtVerified] = useState(true);
  const [screenNotes, setScreenNotes] = useState("");

  // Consent states
  const [locSharing, setLocSharing] = useState(true);
  const [contactOptIn, setContactOptIn] = useState(true);
  const [dataConsent, setDataConsent] = useState(true);

  const filteredDonors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.donors.filter((d) => {
      if (statusFilter !== "All" && d.registrationStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        d.donorCode.toLowerCase().includes(q) ||
        d.fullName.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.sectorLabel.toLowerCase().includes(q)
      );
    });
  }, [data.donors, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDonors.length / pageSize));
  const pagedDonors = filteredDonors.slice((page - 1) * pageSize, page * pageSize);

  const openAddDonor = () => {
    setEditingDonor(null);
    setFullName("");
    setBirthday("1996-08-20");
    setSex("Female");
    setBloodType("O+");
    setPhone("+63 917 800 1234");
    setEmail("");
    setAddress("Diliman, Quezon City");
    setSectorLabel("Diliman Sector, Quezon City");
    setEmergencyContactName("Authorized Next of Kin");
    setEmergencyContactPhone("+63 918 500 9876");
    setDonorModalOpen(true);
  };

  const openEditDonor = (d: DonorRecord) => {
    setEditingDonor(d);
    setFullName(d.fullName);
    setBirthday(d.birthday);
    setSex(d.sex);
    setBloodType(d.bloodType);
    setPhone(d.phone);
    setEmail(d.email);
    setAddress(d.address);
    setSectorLabel(d.sectorLabel);
    setEmergencyContactName(d.emergencyContactName);
    setEmergencyContactPhone(d.emergencyContactPhone);
    setDonorModalOpen(true);
  };

  const handleSaveDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDonor) {
      await onMutate({
        action: "update_donor",
        id: editingDonor.id,
        fullName,
        bloodType,
        phone,
        email,
        address,
        sectorLabel,
      });
    } else {
      await onMutate({
        action: "add_donor",
        fullName,
        birthday,
        sex,
        bloodType,
        phone,
        email,
        address,
        sectorLabel,
        emergencyContactName,
        emergencyContactPhone,
        registrationStatus: "Pending Screening",
      });
    }
    setDonorModalOpen(false);
  };

  // Detailed Donor Profile View
  if (selectedProfile) {
    const freshDonor =
      data.donors.find((d) => d.id === selectedProfile.id) || selectedProfile;
    const donorHistory = data.collections.filter(
      (c) => c.donorId === freshDonor.id || c.donorCode === freshDonor.donorCode
    );
    const donorAppts = data.appointments.filter(
      (a) => a.donorId === freshDonor.id || a.donorCode === freshDonor.donorCode
    );

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedProfile(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#172B4D] hover:text-[#C62828] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Donor Directory
          </button>
          <div className="flex items-center gap-2">
            <BLButton
              size="sm"
              variant="secondary"
              onClick={() => {
                setScreeningDonor(freshDonor);
                setHgb(String(freshDonor.hemoglobinGdl));
                setBp(freshDonor.bloodPressure);
                setWeight(String(freshDonor.weightKg));
                setRegStatus(freshDonor.registrationStatus);
                setBtVerified(freshDonor.bloodTypeVerified);
                setScreenNotes(freshDonor.medicalScreeningNotes);
              }}
            >
              <Stethoscope className="h-4 w-4" /> Update Medical Screening
            </BLButton>
            <BLButton
              size="sm"
              variant="primary"
              onClick={() => openEditDonor(freshDonor)}
            >
              <Edit3 className="h-4 w-4" /> Edit Donor Record
            </BLButton>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 tabular-nums">
                  {freshDonor.donorCode}
                </span>
                <h2 className="text-xl font-bold text-[#172B4D] mt-0.5">
                  {freshDonor.fullName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {freshDonor.sex} • DOB {freshDonor.birthday}
                </p>
              </div>
              <BloodTypeBadge
                bloodType={freshDonor.bloodType}
                masked={!authorizedBloodTypeView}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={freshDonor.registrationStatus} />
              <span className="text-xs text-slate-500">
                Total Donations:{" "}
                <strong className="text-[#172B4D] tabular-nums">
                  {freshDonor.totalDonations}
                </strong>
              </span>
            </div>

            <div className="pt-2 space-y-1.5 text-xs text-slate-600">
              <div>
                <strong>Contact:</strong> {freshDonor.phone} • {freshDonor.email}
              </div>
              <div>
                <strong>Residential Area:</strong> {freshDonor.address}
              </div>
              <div>
                <strong>Emergency Contact:</strong>{" "}
                {freshDonor.emergencyContactName} ({freshDonor.emergencyContactPhone})
              </div>
            </div>
          </div>

          {/* Clinical Screening Records */}
          <div className="lg:col-span-4 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Medical Screening & Eligibility
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-[#F5F6F8]">
                <div className="text-[10px] text-slate-500">Hemoglobin</div>
                <div className="text-sm font-bold text-[#172B4D] tabular-nums">
                  {freshDonor.hemoglobinGdl} g/dL
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F6F8]">
                <div className="text-[10px] text-slate-500">Blood Pressure</div>
                <div className="text-sm font-bold text-[#172B4D] tabular-nums">
                  {freshDonor.bloodPressure.replace(" mmHg", "")}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#F5F6F8]">
                <div className="text-[10px] text-slate-500">Weight</div>
                <div className="text-sm font-bold text-[#172B4D] tabular-nums">
                  {freshDonor.weightKg} kg
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {freshDonor.medicalScreeningNotes}
            </p>
          </div>

          {/* Privacy, Consent & Account Activity */}
          <div className="lg:col-span-3 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Privacy & Radar Consent
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Radar Token:</span>
                <span className="font-bold text-[#172B4D] tabular-nums">
                  {freshDonor.anonymousToken}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Location Discovery:</span>
                <StatusBadge
                  status={freshDonor.locationSharingEnabled ? "Active" : "Disabled"}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Emergency Invites:</span>
                <StatusBadge
                  status={freshDonor.contactInvitationOptIn ? "Verified" : "Opted Out"}
                />
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Approx. Radar Sector: <strong>{freshDonor.sectorLabel}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Donation History & Account Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h3 className="text-sm font-bold text-[#172B4D]">
                Recorded Blood Donation History
              </h3>
            </div>
            {donorHistory.length === 0 ? (
              <div className="p-6 text-xs text-slate-500">
                No completed blood unit phlebotomy records on file yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Unit ID</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Collection Center</th>
                    <th className="px-4 py-2.5">Component & Vol</th>
                    <th className="px-4 py-2.5">Testing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {donorHistory.map((h) => (
                    <tr key={h.id}>
                      <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                        {h.unitId}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{h.collectionDate}</td>
                      <td className="px-4 py-3">{h.centerName}</td>
                      <td className="px-4 py-3">
                        {h.component} ({h.volumeMl} mL)
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={h.testingStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-[#172B4D] mb-3">
              Appointments & Account Activity
            </h3>
            <div className="space-y-3 text-xs">
              {donorAppts.map((ap) => (
                <div
                  key={ap.id}
                  className="p-3 rounded-lg bg-[#F5F6F8] border border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172B4D] tabular-nums">
                      {ap.appointmentCode}
                    </span>
                    <StatusBadge status={ap.status} />
                  </div>
                  <div className="mt-1 text-slate-600">{ap.centerName}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    {ap.scheduledDate} • {ap.timeSlot}
                  </div>
                </div>
              ))}
              <div className="p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                Data Privacy Consent (RA 10173) verified electronically • Last Donation:{" "}
                <strong className="text-[#172B4D]">{freshDonor.lastDonationDate}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search Donor ID, name, phone, or sector..."
            className="w-full sm:w-72"
          />
          <FormSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { label: "All Registration Statuses", value: "All" },
              { label: "Verified", value: "Verified" },
              { label: "Pending Screening", value: "Pending Screening" },
              { label: "Deferred", value: "Deferred" },
            ]}
          />
          <button
            type="button"
            onClick={() => setAuthorizedBloodTypeView(!authorizedBloodTypeView)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-[#F5F6F8] text-xs font-semibold text-[#172B4D] cursor-pointer hover:bg-slate-200/70"
          >
            {authorizedBloodTypeView ? (
              <>
                <Eye className="h-3.5 w-3.5 text-[#2E7D32]" />
                Blood Type: Authorized View
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                Blood Type: Restricted Mask
              </>
            )}
          </button>
        </div>

        <BLButton variant="primary" onClick={openAddDonor}>
          <Plus className="h-4 w-4" /> Register Donor
        </BLButton>
      </div>

      {/* Donor Listing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Donor ID</th>
                <th className="px-4 py-3 font-semibold">Donor Name</th>
                <th className="px-4 py-3 font-semibold">
                  Blood Type (Authorized Only)
                </th>
                <th className="px-4 py-3 font-semibold">Contact Information</th>
                <th className="px-4 py-3 font-semibold">Last Donation Date</th>
                <th className="px-4 py-3 font-semibold">Registration Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedDonors.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                    {d.donorCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#172B4D]">{d.fullName}</div>
                    <div className="text-[11px] text-slate-500">{d.sectorLabel}</div>
                  </td>
                  <td className="px-4 py-3">
                    <BloodTypeBadge
                      bloodType={d.bloodType}
                      masked={!authorizedBloodTypeView}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[#172B4D] tabular-nums">{d.phone}</div>
                    <div className="text-[11px] text-slate-500">{d.email}</div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">
                    {d.lastDonationDate}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={d.registrationStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <BLButton
                        size="xs"
                        variant="secondary"
                        onClick={() => setSelectedProfile(d)}
                        title="View Donor Profile & History"
                      >
                        Profile
                      </BLButton>
                      <BLButton
                        size="xs"
                        variant="ghost"
                        title="Record Screening Information"
                        onClick={() => {
                          setScreeningDonor(d);
                          setHgb(String(d.hemoglobinGdl));
                          setBp(d.bloodPressure);
                          setWeight(String(d.weightKg));
                          setRegStatus(d.registrationStatus);
                          setBtVerified(d.bloodTypeVerified);
                          setScreenNotes(d.medicalScreeningNotes);
                        }}
                      >
                        <Stethoscope className="h-3.5 w-3.5 text-[#172B4D]" />
                      </BLButton>
                      <BLButton
                        size="xs"
                        variant="ghost"
                        title="Manage Consent & Location Sharing"
                        onClick={() => {
                          setConsentDonor(d);
                          setLocSharing(d.locationSharingEnabled);
                          setContactOptIn(d.contactInvitationOptIn);
                          setDataConsent(d.consentDataProcessing);
                        }}
                      >
                        <Shield className="h-3.5 w-3.5 text-[#2E7D32]" />
                      </BLButton>
                      <BLButton
                        size="xs"
                        variant="ghost"
                        title="Edit Donor"
                        onClick={() => openEditDonor(d)}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-slate-600" />
                      </BLButton>
                      <BLButton
                        size="xs"
                        variant="ghost"
                        title="Delete Donor"
                        onClick={() => setDeletingDonor(d)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[#C62828]" />
                      </BLButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredDonors.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Add / Edit Donor Modal */}
      <BLModal
        open={donorModalOpen}
        onClose={() => setDonorModalOpen(false)}
        title={editingDonor ? `Edit Donor — ${editingDonor.donorCode}` : "Register Voluntary Blood Donor"}
        subtitle="Authorized blood service facility donor intake record."
      >
        <form onSubmit={handleSaveDonor} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Full Name" required value={fullName} onChange={setFullName} />
            <FormInput label="Birthday" type="date" required value={birthday} onChange={setBirthday} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormSelect
              label="Sex"
              value={sex}
              onChange={setSex}
              options={[
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
              ]}
            />
            <FormSelect
              label="Blood Type"
              value={bloodType}
              onChange={setBloodType}
              options={[
                ...BLOOD_TYPES.map((bt) => ({ label: bt, value: bt })),
                { label: "Unverified", value: "Unverified" },
              ]}
            />
            <FormInput label="Contact Number" required value={phone} onChange={setPhone} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Email Address" type="email" required value={email} onChange={setEmail} />
            <FormInput label="Approximate Radar Sector" required value={sectorLabel} onChange={setSectorLabel} />
          </div>
          <FormInput label="Residential Address (Restricted Backend Storage)" required value={address} onChange={setAddress} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput label="Emergency Contact Name" required value={emergencyContactName} onChange={setEmergencyContactName} />
            <FormInput label="Emergency Contact Phone" required value={emergencyContactPhone} onChange={setEmergencyContactPhone} />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <BLButton variant="secondary" onClick={() => setDonorModalOpen(false)}>
              Cancel
            </BLButton>
            <BLButton type="submit" variant="primary">
              {editingDonor ? "Save Changes" : "Create Donor Record"}
            </BLButton>
          </div>
        </form>
      </BLModal>

      {/* Screening Modal */}
      <BLModal
        open={Boolean(screeningDonor)}
        onClose={() => setScreeningDonor(null)}
        title={`Medical Screening — ${screeningDonor?.fullName || ""}`}
        subtitle="Record physical examination vitals, hemoglobin check, and laboratory blood type confirmation."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!screeningDonor) return;
            await onMutate({
              action: "update_donor",
              id: screeningDonor.id,
              hemoglobinGdl: Number(hgb),
              bloodPressure: bp,
              weightKg: Number(weight),
              registrationStatus: regStatus,
              bloodTypeVerified: btVerified,
              medicalScreeningNotes: screenNotes,
            });
            setScreeningDonor(null);
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-3 gap-3">
            <FormInput label="Hemoglobin (g/dL)" type="number" value={hgb} onChange={setHgb} />
            <FormInput label="Blood Pressure" value={bp} onChange={setBp} />
            <FormInput label="Body Weight (kg)" type="number" value={weight} onChange={setWeight} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Screening Status"
              value={regStatus}
              onChange={setRegStatus}
              options={[
                { label: "Verified (Eligible)", value: "Verified" },
                { label: "Pending Screening", value: "Pending Screening" },
                { label: "Deferred (Temporary/Medical)", value: "Deferred" },
              ]}
            />
            <div className="pt-6">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#172B4D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={btVerified}
                  onChange={(e) => setBtVerified(e.target.checked)}
                />
                ABO/Rh Lab Typing Confirmed
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Medical Screening Officer Notes
            </label>
            <textarea
              rows={3}
              value={screenNotes}
              onChange={(e) => setScreenNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <BLButton variant="secondary" onClick={() => setScreeningDonor(null)}>
              Cancel
            </BLButton>
            <BLButton type="submit" variant="success">
              Save Screening Record
            </BLButton>
          </div>
        </form>
      </BLModal>

      {/* Consent & Location Sharing Modal */}
      <BLModal
        open={Boolean(consentDonor)}
        onClose={() => setConsentDonor(null)}
        title={`Consent & Privacy Preferences — ${consentDonor?.donorCode || ""}`}
        subtitle="Manage voluntary donor opt-in settings under Data Privacy Act compliance."
      >
        <div className="space-y-4">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={locSharing}
              onChange={(e) => setLocSharing(e.target.checked)}
              className="mt-0.5"
            />
            <div className="text-xs">
              <div className="font-bold text-[#172B4D]">
                Approximate Location Sharing (Donor Proximity Radar)
              </div>
              <div className="text-slate-500 mt-0.5">
                Allows anonymized sector indicator on the radar without revealing identity or blood type.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={contactOptIn}
              onChange={(e) => setContactOptIn(e.target.checked)}
              className="mt-0.5"
            />
            <div className="text-xs">
              <div className="font-bold text-[#172B4D]">
                Emergency Voluntary Donation Invitations
              </div>
              <div className="text-slate-500 mt-0.5">
                Permits receiving voluntary push invitations when nearby hospitals broadcast emergency requests.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={dataConsent}
              onChange={(e) => setDataConsent(e.target.checked)}
              className="mt-0.5"
            />
            <div className="text-xs">
              <div className="font-bold text-[#172B4D]">
                Clinical Blood Service Data Processing Consent
              </div>
              <div className="text-slate-500 mt-0.5">
                Required for blood unit traceability and DOH hemovigilance recordkeeping.
              </div>
            </div>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <BLButton variant="secondary" onClick={() => setConsentDonor(null)}>
              Cancel
            </BLButton>
            <BLButton
              variant="primary"
              onClick={async () => {
                if (!consentDonor) return;
                await onMutate({
                  action: "update_donor",
                  id: consentDonor.id,
                  locationSharingEnabled: locSharing,
                  contactInvitationOptIn: contactOptIn,
                  consentDataProcessing: dataConsent,
                });
                setConsentDonor(null);
              }}
            >
              Update Privacy Preferences
            </BLButton>
          </div>
        </div>
      </BLModal>

      {/* Delete Donor Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingDonor)}
        onClose={() => setDeletingDonor(null)}
        title="Remove Donor Record"
        message={`Are you sure you want to remove ${deletingDonor?.fullName} (${deletingDonor?.donorCode}) from active donor listings? Historical unit traceability logs remain preserved.`}
        confirmLabel="Remove Donor"
        danger
        onConfirm={() => {
          if (deletingDonor) {
            onMutate({ action: "delete_donor", id: deletingDonor.id });
          }
        }}
      />
    </div>
  );
}

/* ============================================================================
 * SECTION 7: BLOOD COLLECTION MANAGEMENT
 * ========================================================================== */
export function BloodCollectionView({
  data,
  onMutate,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [subTab, setSubTab] = useState<
    "history" | "record" | "appointments" | "verification"
  >("history");
  const [search, setSearch] = useState("");

  // Record Donation Form
  const [selectedDonorId, setSelectedDonorId] = useState<string>(
    String(data.donors[0]?.id || 1)
  );
  const [centerName, setCenterName] = useState<string>(
    data.bloodCenters[0]?.name || "PRC National Blood Center - Port Area"
  );
  const [collectionDate, setCollectionDate] = useState("2026-04-12");
  const [volumeMl, setVolumeMl] = useState("450");
  const [component, setComponent] = useState("Packed RBC");
  const [generatedUnitId, setGeneratedUnitId] = useState("PRC-2026-88492");
  const [notes, setNotes] = useState(
    "Standard sterile CPDA-1 collection; venipuncture completed smoothly in 8 mins."
  );
  const [savedNotice, setSavedNotice] = useState("");

  // Appointment Modal
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [apptDate, setApptDate] = useState("2026-04-17");
  const [apptSlot, setApptSlot] = useState("09:00 AM – 09:45 AM");
  const [apptType, setApptType] = useState("Whole Blood");

  const filteredCollections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.collections;
    return data.collections.filter(
      (c) =>
        c.unitId.toLowerCase().includes(q) ||
        c.donorCode.toLowerCase().includes(q) ||
        c.centerName.toLowerCase().includes(q) ||
        c.component.toLowerCase().includes(q)
    );
  }, [data.collections, search]);

  const pendingVerificationList = useMemo(
    () => data.collections.filter((c) => c.testingStatus === "Pending Serology"),
    [data.collections]
  );

  const handleRecordCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const donorObj = data.donors.find((d) => String(d.id) === selectedDonorId);
    await onMutate({
      action: "record_collection",
      unitId: generatedUnitId,
      donorId: Number(selectedDonorId),
      donorCode: donorObj?.donorCode || "BL-DNR-2026-0101",
      bloodType: donorObj?.bloodType || "O+",
      centerName,
      collectionDate,
      volumeMl: Number(volumeMl),
      component,
      notes,
    });
    const nextNum = Math.floor(88500 + Math.random() * 1400);
    setSavedNotice(
      `Blood Unit ${generatedUnitId} recorded and placed in initial TTI quarantine inventory.`
    );
    setGeneratedUnitId(`PRC-2026-${nextNum}`);
    setSubTab("history");
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "history", label: `Collection & Donation History (${data.collections.length})` },
            { id: "record", label: "Donation Registration & Recording" },
            { id: "appointments", label: `Appointment Scheduling (${data.appointments.length})` },
            {
              id: "verification",
              label: `Collection Verification (${pendingVerificationList.length})`,
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                subTab === t.id
                  ? "bg-[#172B4D] text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <BLButton size="sm" variant="primary" onClick={() => setApptModalOpen(true)}>
          <Calendar className="h-4 w-4" /> Schedule Collection Slot
        </BLButton>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] font-semibold flex items-center justify-between">
          <span>{savedNotice}</span>
          <button
            type="button"
            onClick={() => setSavedNotice("")}
            className="underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {subTab === "history" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">
                Blood Collection & Unit Identification Registry
              </h3>
              <p className="text-xs text-slate-500">
                Every collected unit carries a unique ISBT-aligned Unit ID linked to donor screening & TTI serology
              </p>
            </div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search Unit ID, Donor Ref, or Center..."
              className="w-full sm:w-72"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Unique Unit ID</th>
                  <th className="px-4 py-3">Donation Date</th>
                  <th className="px-4 py-3">Collection Center</th>
                  <th className="px-4 py-3">Donor Reference</th>
                  <th className="px-4 py-3">Blood Type</th>
                  <th className="px-4 py-3">Volume</th>
                  <th className="px-4 py-3">Blood Component</th>
                  <th className="px-4 py-3">Testing Status</th>
                  <th className="px-4 py-3">Processing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCollections.map((col) => (
                  <tr key={col.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                      {col.unitId}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{col.collectionDate}</td>
                    <td className="px-4 py-3 font-medium text-[#172B4D]">
                      {col.centerName}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {col.donorCode}
                    </td>
                    <td className="px-4 py-3">
                      <BloodTypeBadge bloodType={col.bloodType} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{col.volumeMl} mL</td>
                    <td className="px-4 py-3 font-medium">{col.component}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={col.testingStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={col.processingStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "record" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs max-w-3xl">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-9 w-9 rounded-lg bg-red-50 text-[#C62828] flex items-center justify-center">
              <Syringe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172B4D]">
                Record Phlebotomy & Blood Collection Unit
              </h3>
              <p className="text-xs text-slate-500">
                Assigns a unique Blood Unit ID and automatically registers the bag into initial quarantine cold storage.
              </p>
            </div>
          </div>

          <form onSubmit={handleRecordCollection} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Unique Blood Unit ID"
                required
                value={generatedUnitId}
                onChange={setGeneratedUnitId}
                helperText="ISBT-128 / PRC sequential unit barcode"
              />
              <FormInput
                label="Donation Date"
                type="date"
                required
                value={collectionDate}
                onChange={setCollectionDate}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Verified Donor Reference"
                value={selectedDonorId}
                onChange={setSelectedDonorId}
                options={data.donors.slice(0, 12).map((d) => ({
                  label: `${d.donorCode} — ${d.fullName} (${d.bloodType})`,
                  value: String(d.id),
                }))}
              />
              <FormSelect
                label="Collection Center / Drive"
                value={centerName}
                onChange={setCenterName}
                options={data.bloodCenters.map((c) => ({
                  label: c.name,
                  value: c.name,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                label="Target Blood Component"
                value={component}
                onChange={setComponent}
                options={BLOOD_COMPONENTS.map((c) => ({ label: c, value: c }))}
              />
              <FormInput
                label="Collection Volume (mL)"
                type="number"
                required
                value={volumeMl}
                onChange={setVolumeMl}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                Phlebotomy & Bag Inspection Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <BLButton type="submit" variant="primary">
                Record Blood Unit & Send to TTI Verification
              </BLButton>
            </div>
          </form>
        </div>
      )}

      {subTab === "appointments" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-[#172B4D]">
              Scheduled Donor Collection Appointments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Appointment Code</th>
                  <th className="px-4 py-3">Donor</th>
                  <th className="px-4 py-3">Collection Center</th>
                  <th className="px-4 py-3">Date & Slot</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                      {a.appointmentCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#172B4D]">{a.donorName}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">{a.donorCode}</div>
                    </td>
                    <td className="px-4 py-3">{a.centerName}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {a.scheduledDate} • {a.timeSlot}
                    </td>
                    <td className="px-4 py-3">{a.donationType}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {a.status === "Scheduled" && (
                        <BLButton
                          size="xs"
                          variant="secondary"
                          onClick={() =>
                            onMutate({
                              action: "update_appointment",
                              id: a.id,
                              status: "Checked In",
                            })
                          }
                        >
                          Check In
                        </BLButton>
                      )}
                      {a.status !== "Completed" && a.status !== "Cancelled" && (
                        <BLButton
                          size="xs"
                          variant="success"
                          onClick={() =>
                            onMutate({
                              action: "update_appointment",
                              id: a.id,
                              status: "Completed",
                            })
                          }
                        >
                          Complete
                        </BLButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "verification" && (
        <div className="space-y-3">
          {pendingVerificationList.length === 0 ? (
            <EmptyState
              title="All Collected Units Verified"
              description="No blood units are currently awaiting TTI serology or component labeling verification."
            />
          ) : (
            pendingVerificationList.map((col) => (
              <div
                key={col.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#172B4D] tabular-nums">
                      {col.unitId}
                    </span>
                    <BloodTypeBadge bloodType={col.bloodType} />
                    <StatusBadge status={col.testingStatus} />
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {col.component} ({col.volumeMl} mL) • Collected {col.collectionDate} at{" "}
                    <strong>{col.centerName}</strong> • Donor Ref {col.donorCode}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{col.notes}</div>
                </div>
                <div className="flex items-center gap-2">
                  <BLButton
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      onMutate({
                        action: "verify_collection",
                        id: col.id,
                        testingStatus: "Reactive / Quarantined",
                        verifiedBy: "Marco Villanueva, RMT",
                      })
                    }
                  >
                    Flag Reactive (Quarantine)
                  </BLButton>
                  <BLButton
                    size="sm"
                    variant="success"
                    onClick={() =>
                      onMutate({
                        action: "verify_collection",
                        id: col.id,
                        testingStatus: "Cleared / Negative",
                        verifiedBy: "Marco Villanueva, RMT",
                        storageLocation: "Ref-A1 • Verified Shelf 1 (+4°C)",
                      })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" /> Verify Non-Reactive & Release to Stock
                  </BLButton>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule Appointment Modal */}
      <BLModal
        open={apptModalOpen}
        onClose={() => setApptModalOpen(false)}
        title="Schedule Donor Collection Appointment"
        subtitle="Reserve a phlebotomy chair or apheresis slot at an accredited blood center."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const d = data.donors.find((x) => String(x.id) === selectedDonorId) || data.donors[0];
            const c = data.bloodCenters.find((x) => x.name === centerName) || data.bloodCenters[0];
            await onMutate({
              action: "create_appointment",
              donorId: d?.id,
              donorCode: d?.donorCode,
              donorName: d?.fullName,
              centerId: c?.id,
              centerName: c?.name,
              centerAddress: c?.address,
              scheduledDate: apptDate,
              timeSlot: apptSlot,
              donationType: apptType,
            });
            setApptModalOpen(false);
            setSubTab("appointments");
          }}
          className="space-y-3.5"
        >
          <FormSelect
            label="Donor"
            value={selectedDonorId}
            onChange={setSelectedDonorId}
            options={data.donors.slice(0, 10).map((d) => ({
              label: `${d.fullName} (${d.donorCode})`,
              value: String(d.id),
            }))}
          />
          <FormSelect
            label="Blood Center"
            value={centerName}
            onChange={setCenterName}
            options={data.bloodCenters.map((c) => ({ label: c.name, value: c.name }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Date" type="date" value={apptDate} onChange={setApptDate} />
            <FormSelect
              label="Time Slot"
              value={apptSlot}
              onChange={setApptSlot}
              options={[
                { label: "08:30 AM – 09:15 AM", value: "08:30 AM – 09:15 AM" },
                { label: "09:30 AM – 10:15 AM", value: "09:30 AM – 10:15 AM" },
                { label: "11:00 AM – 11:45 AM", value: "11:00 AM – 11:45 AM" },
                { label: "02:00 PM – 02:45 PM", value: "02:00 PM – 02:45 PM" },
              ]}
            />
          </div>
          <FormSelect
            label="Donation Type"
            value={apptType}
            onChange={setApptType}
            options={[
              { label: "Whole Blood", value: "Whole Blood" },
              { label: "Packed RBC", value: "Packed RBC" },
              { label: "Platelet Apheresis", value: "Platelet Apheresis" },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <BLButton variant="secondary" onClick={() => setApptModalOpen(false)}>
              Cancel
            </BLButton>
            <BLButton type="submit" variant="primary">
              Confirm Appointment
            </BLButton>
          </div>
        </form>
      </BLModal>
    </div>
  );
}

/* ============================================================================
 * SECTION 8: BLOOD INVENTORY MANAGEMENT
 * ========================================================================== */
export function BloodInventoryView({
  data,
  onMutate,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [selectedBloodType, setSelectedBloodType] = useState<string>("All");
  const [componentFilter, setComponentFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [expiringOnly, setExpiringOnly] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals: Stock Movement History & Storage/Status Update
  const [historyUnit, setHistoryUnit] = useState<BloodInventoryUnit | null>(null);
  const [editingUnit, setEditingUnit] = useState<BloodInventoryUnit | null>(null);
  const [nextStorage, setNextStorage] = useState("");
  const [nextStatus, setNextStatus] = useState("");
  const [nextQuarantine, setNextQuarantine] = useState("");

  // 8 Blood Type Cards showing Available Quantity in Units
  const bloodTypeCards = useMemo(() => {
    return BLOOD_TYPES.map((bt) => {
      const available = data.inventory.filter(
        (u) => u.bloodType === bt && u.status === "Available"
      ).length;
      const total = data.inventory.filter((u) => u.bloodType === bt).length;
      return { bloodType: bt, available, total };
    });
  }, [data.inventory]);

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.inventory.filter((u) => {
      if (selectedBloodType !== "All" && u.bloodType !== selectedBloodType)
        return false;
      if (componentFilter !== "All" && u.component !== componentFilter)
        return false;
      if (statusFilter !== "All" && u.status !== statusFilter) return false;
      if (expiringOnly) {
        const d = daysUntilExpiration(u.expirationDate);
        if (d > 7 || u.status === "Released") return false;
      }
      if (!q) return true;
      return (
        u.unitId.toLowerCase().includes(q) ||
        u.storageLocation.toLowerCase().includes(q) ||
        u.centerName.toLowerCase().includes(q)
      );
    });
  }, [
    data.inventory,
    selectedBloodType,
    componentFilter,
    statusFilter,
    expiringOnly,
    search,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const pagedUnits = filteredUnits.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-5">
      {/* 8 Separate ABO/Rh Blood Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {bloodTypeCards.map((card) => {
          const active = selectedBloodType === card.bloodType;
          const lowStock = card.available <= 2;
          return (
            <button
              key={card.bloodType}
              type="button"
              onClick={() => {
                setSelectedBloodType(active ? "All" : card.bloodType);
                setPage(1);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                active
                  ? "bg-[#172B4D] text-white border-[#172B4D] shadow-sm"
                  : "bg-white text-[#172B4D] border-slate-200 hover:border-[#C62828]/50 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-lg font-bold tabular-nums ${
                    active ? "text-white" : "text-[#C62828]"
                  }`}
                >
                  {card.bloodType}
                </span>
                <Droplets
                  className={`h-4 w-4 ${
                    active
                      ? "text-red-300"
                      : lowStock
                      ? "text-[#ED8B00]"
                      : "text-[#2E7D32]"
                  }`}
                />
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums">
                {card.available}
              </div>
              <div
                className={`text-[11px] mt-0.5 ${
                  active ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Available units
              </div>
            </button>
          );
        })}
      </div>

      {/* Inventory Search & Multi-Filter Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search Blood Unit ID or Storage Rack..."
            className="w-full sm:w-64"
          />
          <FormSelect
            value={componentFilter}
            onChange={(v) => {
              setComponentFilter(v);
              setPage(1);
            }}
            options={[
              { label: "All Blood Components", value: "All" },
              ...BLOOD_COMPONENTS.map((c) => ({ label: c, value: c })),
            ]}
          />
          <FormSelect
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={[
              { label: "All Storage Statuses", value: "All" },
              { label: "Available", value: "Available" },
              { label: "Reserved", value: "Reserved" },
              { label: "Released", value: "Released" },
              { label: "Quarantined", value: "Quarantined" },
              { label: "Expired", value: "Expired" },
            ]}
          />
          <button
            type="button"
            onClick={() => {
              setExpiringOnly(!expiringOnly);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
              expiringOnly
                ? "bg-amber-50 text-[#B46900] border-amber-300"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Expiration Monitor (≤ 7d)
          </button>
        </div>

        {selectedBloodType !== "All" && (
          <BLButton
            size="xs"
            variant="secondary"
            onClick={() => setSelectedBloodType("All")}
          >
            Clear {selectedBloodType} Filter
          </BLButton>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Blood Unit ID</th>
                <th className="px-4 py-3">Blood Type</th>
                <th className="px-4 py-3">Component</th>
                <th className="px-4 py-3">Collection Date</th>
                <th className="px-4 py-3">Expiration Date</th>
                <th className="px-4 py-3">Storage Location</th>
                <th className="px-4 py-3">Quarantine</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedUnits.map((unit) => {
                const daysLeft = daysUntilExpiration(unit.expirationDate);
                const nearExpiry =
                  daysLeft >= 0 && daysLeft <= 7 && unit.status === "Available";
                return (
                  <tr key={unit.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                      {unit.unitId}
                    </td>
                    <td className="px-4 py-3">
                      <BloodTypeBadge bloodType={unit.bloodType} />
                    </td>
                    <td className="px-4 py-3 font-medium text-[#172B4D]">
                      {unit.component}
                      <span className="text-[11px] text-slate-400 ml-1 tabular-nums">
                        ({unit.volumeMl}mL)
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">
                      {unit.collectionDate}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span
                        className={
                          unit.status === "Expired" || daysLeft < 0
                            ? "font-bold text-[#C62828]"
                            : nearExpiry
                            ? "font-bold text-[#ED8B00]"
                            : "text-slate-700"
                        }
                      >
                        {unit.expirationDate}
                      </span>
                      {nearExpiry && (
                        <span className="ml-1.5 text-[10px] font-bold text-[#ED8B00]">
                          ({daysLeft}d left)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div>{unit.storageLocation}</div>
                      <div className="text-[10px] text-slate-400">{unit.centerName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={unit.quarantineStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={unit.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <BLButton
                          size="xs"
                          variant="secondary"
                          onClick={() => setHistoryUnit(unit)}
                        >
                          <History className="h-3.5 w-3.5" /> Movement
                        </BLButton>
                        <BLButton
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setEditingUnit(unit);
                            setNextStorage(unit.storageLocation);
                            setNextStatus(unit.status);
                            setNextQuarantine(unit.quarantineStatus);
                          }}
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </BLButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredUnits.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Stock Movement History Modal */}
      <BLModal
        open={Boolean(historyUnit)}
        onClose={() => setHistoryUnit(null)}
        title={`Stock Movement & Cold-Chain Log — ${historyUnit?.unitId || ""}`}
        subtitle={`${historyUnit?.bloodType || ""} ${historyUnit?.component || ""} • Current Location: ${historyUnit?.storageLocation || ""}`}
      >
        <div className="space-y-3">
          {(historyUnit?.stockMovementLog || []).map((entry, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172B4D]">{entry.action}</span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {entry.timestamp}
                </span>
              </div>
              <div className="text-slate-600">
                Location: <strong>{entry.location}</strong> • Verified by{" "}
                <strong>{entry.actor}</strong>
              </div>
              <div className="text-[11px] text-slate-500">{entry.notes}</div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <BLButton variant="secondary" onClick={() => setHistoryUnit(null)}>
              Close Log
            </BLButton>
          </div>
        </div>
      </BLModal>

      {/* Update Storage / Quarantine Modal */}
      <BLModal
        open={Boolean(editingUnit)}
        onClose={() => setEditingUnit(null)}
        title={`Update Blood Unit — ${editingUnit?.unitId || ""}`}
        subtitle="Modify cold-chain rack assignment, quarantine clearance, or disposition."
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!editingUnit) return;
            await onMutate({
              action: "update_inventory_unit",
              id: editingUnit.id,
              storageLocation: nextStorage,
              status: nextStatus,
              quarantineStatus: nextQuarantine,
            });
            setEditingUnit(null);
          }}
          className="space-y-3.5"
        >
          <FormInput
            label="Cold-Chain Storage Location"
            required
            value={nextStorage}
            onChange={setNextStorage}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Quarantine Status"
              value={nextQuarantine}
              onChange={setNextQuarantine}
              options={[
                { label: "Cleared", value: "Cleared" },
                { label: "Under Quarantine", value: "Under Quarantine" },
                { label: "Quarantine Released", value: "Quarantine Released" },
              ]}
            />
            <FormSelect
              label="Unit Disposition Status"
              value={nextStatus}
              onChange={setNextStatus}
              options={[
                { label: "Available", value: "Available" },
                { label: "Reserved", value: "Reserved" },
                { label: "Released", value: "Released" },
                { label: "Quarantined", value: "Quarantined" },
                { label: "Expired", value: "Expired" },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <BLButton variant="secondary" onClick={() => setEditingUnit(null)}>
              Cancel
            </BLButton>
            <BLButton type="submit" variant="primary">
              Update Inventory Unit
            </BLButton>
          </div>
        </form>
      </BLModal>
    </div>
  );
}
