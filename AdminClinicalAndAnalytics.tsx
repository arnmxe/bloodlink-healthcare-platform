"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  GitCommitHorizontal,
  MapPin,
  Plus,
  Printer,
  ShieldCheck,
  Truck,
  UserPlus,
} from "lucide-react";
import {
  BLButton,
  BLModal,
  BloodTypeBadge,
  EmptyState,
  FormInput,
  FormSelect,
  SearchBar,
  StatusBadge,
} from "@/components/ui/BloodLinkUI";
import {
  BLOOD_COMPONENTS,
  BLOOD_TYPES,
  daysUntilExpiration,
  PARTNER_HOSPITALS,
  REQUEST_STATUSES,
} from "@/lib/bloodlink-utils";
import type {
  BloodAllocationRecord,
  BloodLinkDataset,
  HospitalBloodRequest,
} from "@/types/bloodlink";

/* ============================================================================
 * SECTION 10: HOSPITAL BLOOD REQUEST MANAGEMENT
 * ========================================================================== */
export function HospitalRequestsView({
  data,
  onMutate,
  scopedHospitalName,
  defaultOpenSubmit = false,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  scopedHospitalName?: string;
  defaultOpenSubmit?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [submitModalOpen, setSubmitModalOpen] = useState(defaultOpenSubmit);
  const [detailReq, setDetailReq] = useState<HospitalBloodRequest | null>(null);

  // Request Form State
  const [hospitalName, setHospitalName] = useState(
    scopedHospitalName || PARTNER_HOSPITALS[0].name
  );
  const [department, setDepartment] = useState(
    "Emergency Trauma & Acute Care Surgery"
  );
  const [bloodType, setBloodType] = useState("O+");
  const [component, setComponent] = useState("Packed RBC");
  const [unitsRequested, setUnitsRequested] = useState("2");
  const [requiredDateTime, setRequiredDateTime] = useState(
    "2026-04-13 • 08:00 AM"
  );
  const [urgency, setUrgency] = useState("Urgent");
  const [medicalJustification, setMedicalJustification] = useState("");
  const [requestingPersonnel, setRequestingPersonnel] = useState(
    "Dr. Rafael Bautista, MD"
  );
  const [licenseNumber, setLicenseNumber] = useState("PRC-MD-0119482");
  const [submittedNotice, setSubmittedNotice] = useState("");

  const visibleRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.requests.filter((r) => {
      if (scopedHospitalName && r.hospitalName !== scopedHospitalName)
        return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.requestCode.toLowerCase().includes(q) ||
        r.hospitalName.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.bloodType.toLowerCase().includes(q)
      );
    });
  }, [data.requests, scopedHospitalName, statusFilter, search]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await onMutate({
      action: "create_hospital_request",
      hospitalName: scopedHospitalName || hospitalName,
      department,
      bloodType,
      component,
      unitsRequested: Number(unitsRequested) || 1,
      requiredDateTime,
      urgency,
      medicalJustification,
      requestingPersonnel,
      licenseNumber,
    });
    setSubmitModalOpen(false);
    setMedicalJustification("");
    setSubmittedNotice(
      `${urgency} blood requisition submitted to BloodLink Central Coordination Queue.`
    );
  };

  const openEmergencyQuickForm = () => {
    setUrgency("Emergency");
    setRequiredDateTime("2026-04-12 • IMMEDIATE STAT");
    setMedicalJustification(
      "Acute hemorrhagic emergency; immediate STAT crossmatch & blood release requested."
    );
    setSubmitModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search Request Code, hospital, or department..."
            className="w-full sm:w-72"
          />
          <FormSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "All Request Statuses", value: "All" },
              ...REQUEST_STATUSES.map((s) => ({ label: s, value: s })),
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <BLButton variant="danger" onClick={openEmergencyQuickForm}>
            <AlertTriangle className="h-4 w-4" /> Emergency STAT Request
          </BLButton>
          <BLButton
            variant="primary"
            onClick={() => {
              setUrgency("Routine");
              setSubmitModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Submit Blood Request
          </BLButton>
        </div>
      </div>

      {submittedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] font-semibold flex items-center justify-between">
          <span>{submittedNotice}</span>
          <button
            type="button"
            onClick={() => setSubmittedNotice("")}
            className="underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Hospital & Department</th>
                <th className="px-4 py-3">Blood Type</th>
                <th className="px-4 py-3">Component & Units</th>
                <th className="px-4 py-3">Required Date/Time</th>
                <th className="px-4 py-3">Urgency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                    {req.requestCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#172B4D]">
                      {req.hospitalName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {req.department}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <BloodTypeBadge bloodType={req.bloodType} />
                  </td>
                  <td className="px-4 py-3 font-medium text-[#172B4D] tabular-nums">
                    {req.component} • {req.unitsFulfilled}/{req.unitsRequested}{" "}
                    units
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {req.requiredDateTime}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.urgency} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <BLButton
                        size="xs"
                        variant="secondary"
                        onClick={() => setDetailReq(req)}
                      >
                        Details
                      </BLButton>
                      {!scopedHospitalName && (
                        <select
                          aria-label="Update Request Status"
                          value={req.status}
                          onChange={(e) =>
                            onMutate({
                              action: "update_request_status",
                              id: req.id,
                              status: e.target.value,
                            })
                          }
                          className="px-2 py-1 text-[11px] font-semibold border border-slate-300 rounded-md bg-white text-[#172B4D]"
                        >
                          {REQUEST_STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Blood Request Modal */}
      <BLModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title={
          urgency === "Emergency"
            ? "Emergency STAT Hospital Blood Requisition"
            : "Submit Hospital Blood Request"
        }
        subtitle="Authorized physician or hospital blood bank coordinator requisition form."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {scopedHospitalName ? (
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                  Hospital Name
                </label>
                <div className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D]">
                  {scopedHospitalName}
                </div>
              </div>
            ) : (
              <FormSelect
                label="Hospital Name"
                required
                value={hospitalName}
                onChange={setHospitalName}
                options={PARTNER_HOSPITALS.map((h) => ({
                  label: h.name,
                  value: h.name,
                }))}
              />
            )}
            <FormInput
              label="Requesting Department"
              required
              value={department}
              onChange={setDepartment}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormSelect
              label="Requested Blood Type"
              required
              value={bloodType}
              onChange={setBloodType}
              options={BLOOD_TYPES.map((bt) => ({ label: bt, value: bt }))}
            />
            <FormSelect
              label="Blood Component"
              required
              value={component}
              onChange={setComponent}
              options={BLOOD_COMPONENTS.map((c) => ({ label: c, value: c }))}
            />
            <FormInput
              label="Number of Units"
              type="number"
              required
              value={unitsRequested}
              onChange={setUnitsRequested}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Required Date & Time"
              required
              value={requiredDateTime}
              onChange={setRequiredDateTime}
            />
            <FormSelect
              label="Urgency Level"
              required
              value={urgency}
              onChange={setUrgency}
              options={[
                { label: "Routine (Scheduled)", value: "Routine" },
                { label: "Urgent (Same Day)", value: "Urgent" },
                { label: "Emergency (Immediate STAT)", value: "Emergency" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Medical Justification & Clinical Indication{" "}
              <span className="text-[#C62828]">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Include patient diagnosis, latest Hemoglobin/Platelet count, and surgical/transfusion indication..."
              value={medicalJustification}
              onChange={(e) => setMedicalJustification(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              label="Authorized Requesting Personnel"
              required
              value={requestingPersonnel}
              onChange={setRequestingPersonnel}
            />
            <FormInput
              label="PRC License Number"
              required
              value={licenseNumber}
              onChange={setLicenseNumber}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <BLButton
              variant="secondary"
              onClick={() => setSubmitModalOpen(false)}
            >
              Cancel
            </BLButton>
            <BLButton type="submit" variant="primary">
              Submit Official Request
            </BLButton>
          </div>
        </form>
      </BLModal>

      {/* Request Details Modal */}
      <BLModal
        open={Boolean(detailReq)}
        onClose={() => setDetailReq(null)}
        title={`Hospital Blood Request — ${detailReq?.requestCode || ""}`}
        subtitle={`${detailReq?.hospitalName || ""} • ${detailReq?.department || ""}`}
      >
        {detailReq && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <BloodTypeBadge bloodType={detailReq.bloodType} />
              <StatusBadge status={detailReq.urgency} />
              <StatusBadge status={detailReq.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200">
              <div>
                <div className="text-slate-500">Component & Quantity</div>
                <div className="font-bold text-[#172B4D] mt-0.5 tabular-nums">
                  {detailReq.component} ({detailReq.unitsFulfilled}/
                  {detailReq.unitsRequested} units fulfilled)
                </div>
              </div>
              <div>
                <div className="text-slate-500">Required By</div>
                <div className="font-bold text-[#172B4D] mt-0.5 tabular-nums">
                  {detailReq.requiredDateTime}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Requesting Clinician</div>
                <div className="font-bold text-[#172B4D] mt-0.5">
                  {detailReq.requestingPersonnel} ({detailReq.licenseNumber})
                </div>
              </div>
              <div>
                <div className="text-slate-500">Crossmatch & Release Doc</div>
                <div className="font-bold text-[#172B4D] mt-0.5">
                  {detailReq.crossmatchStatus} • {detailReq.releaseDocNumber}
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-[#172B4D] mb-1">
                Medical Justification
              </div>
              <p className="p-3 rounded-lg border border-slate-200 text-slate-600 leading-relaxed">
                {detailReq.medicalJustification}
              </p>
            </div>

            <div className="flex justify-end">
              <BLButton variant="secondary" onClick={() => setDetailReq(null)}>
                Close
              </BLButton>
            </div>
          </div>
        )}
      </BLModal>
    </div>
  );
}

/* ============================================================================
 * SECTION 11: BLOOD ALLOCATION AND RELEASE
 * ========================================================================== */
export function BloodAllocationView({
  data,
  onMutate,
  scopedHospitalName,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  scopedHospitalName?: string;
}) {
  const actionableRequests = useMemo(
    () =>
      data.requests.filter(
        (r) =>
          (!scopedHospitalName || r.hospitalName === scopedHospitalName) &&
          r.status !== "Completed" &&
          r.status !== "Rejected"
      ),
    [data.requests, scopedHospitalName]
  );

  const [selectedReqId, setSelectedReqId] = useState<number>(
    actionableRequests[0]?.id || 0
  );
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(
    null
  );
  const [medTechName, setMedTechName] = useState(
    "Marco Villanueva, RMT (PRC #0084120)"
  );
  const [compatibilityMethod, setCompatibilityMethod] = useState(
    "Verified Compatible — Major & Minor AHG Gel Card"
  );
  const [aboConfirmed, setAboConfirmed] = useState(false);
  const [crossmatchConfirmed, setCrossmatchConfirmed] = useState(false);
  const [visualBagInspected, setVisualBagInspected] = useState(false);
  const [releaseImmediately, setReleaseImmediately] = useState(true);
  const [releaseNotes, setReleaseNotes] = useState(
    "Issued in validated +4°C insulated blood transport container with temperature logger."
  );
  const [releaseSlipModal, setReleaseSlipModal] =
    useState<BloodAllocationRecord | null>(null);

  const activeRequest = useMemo(
    () =>
      actionableRequests.find((r) => r.id === selectedReqId) ||
      actionableRequests[0] ||
      null,
    [actionableRequests, selectedReqId]
  );

  const availableUnits = useMemo(
    () => data.inventory.filter((u) => u.status === "Available"),
    [data.inventory]
  );

  const visibleAllocations = useMemo(
    () =>
      data.allocations.filter(
        (a) => !scopedHospitalName || a.hospitalName === scopedHospitalName
      ),
    [data.allocations, scopedHospitalName]
  );

  const handleConfirmAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !activeRequest ||
      !selectedInventoryId ||
      !aboConfirmed ||
      !crossmatchConfirmed ||
      !visualBagInspected
    ) {
      return;
    }
    await onMutate({
      action: "allocate_blood_unit",
      requestId: activeRequest.id,
      inventoryId: selectedInventoryId,
      crossmatchVerifiedBy: medTechName,
      compatibilityStatus: compatibilityMethod,
      releaseNow: releaseImmediately,
      releaseNotes,
    });
    setSelectedInventoryId(null);
    setAboConfirmed(false);
    setCrossmatchConfirmed(false);
    setVisualBagInspected(false);
  };

  return (
    <div className="space-y-6">
      {/* Professional Verification Banner (No Automated Clinical Compatibility!) */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold">
              Mandatory Licensed Professional Compatibility & Crossmatching Protocol
            </div>
            <p className="text-slate-300 mt-0.5">
              BloodLink does not automate clinical compatibility decisions. Every unit allocation requires physical laboratory crossmatching and sign-off by a licensed Medical Technologist / Pathologist.
            </p>
          </div>
        </div>
      </div>

      {/* Allocation Workbench (Admin / Blood Center Personnel) */}
      {!scopedHospitalName && activeRequest && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Select Request & Available Inventory */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                1. Select Active Hospital Blood Request
              </label>
              <select
                value={activeRequest.id}
                onChange={(e) => {
                  setSelectedReqId(Number(e.target.value));
                  setSelectedInventoryId(null);
                }}
                className="w-full px-3 py-2 text-xs font-bold bg-[#F5F6F8] border border-slate-300 rounded-lg text-[#172B4D]"
              >
                {actionableRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.requestCode} — {r.hospitalName} • {r.bloodType}{" "}
                    {r.component} ({r.unitsFulfilled}/{r.unitsRequested}{" "}
                    fulfilled) [{r.urgency}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Request Summary */}
            <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172B4D]">
                  {activeRequest.hospitalName} — {activeRequest.department}
                </span>
                <div className="flex items-center gap-1.5">
                  <BloodTypeBadge bloodType={activeRequest.bloodType} />
                  <StatusBadge status={activeRequest.urgency} />
                </div>
              </div>
              <p className="text-slate-600">
                Requested: <strong>{activeRequest.component}</strong> •{" "}
                <strong>
                  {activeRequest.unitsFulfilled} of {activeRequest.unitsRequested}{" "}
                  units allocated
                </strong>{" "}
                • Needed: {activeRequest.requiredDateTime}
              </p>
              <p className="text-[11px] text-slate-500">
                Clinical Indication: {activeRequest.medicalJustification}
              </p>
            </div>

            {/* Available Inventory Selection Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                2. Select Available TTI-Cleared Inventory Unit
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Select</th>
                      <th className="px-3 py-2">Unit ID</th>
                      <th className="px-3 py-2">Group</th>
                      <th className="px-3 py-2">Component</th>
                      <th className="px-3 py-2">Expires</th>
                      <th className="px-3 py-2">Storage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {availableUnits.map((u) => {
                      const checked = selectedInventoryId === u.id;
                      const exactTypeMatch =
                        u.bloodType === activeRequest.bloodType;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedInventoryId(u.id)}
                          className={`cursor-pointer ${
                            checked
                              ? "bg-red-50/70"
                              : exactTypeMatch
                              ? "bg-emerald-50/25 hover:bg-slate-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <input
                              type="radio"
                              name="allocUnit"
                              checked={checked}
                              onChange={() => setSelectedInventoryId(u.id)}
                            />
                          </td>
                          <td className="px-3 py-2.5 font-bold text-[#172B4D] tabular-nums">
                            {u.unitId}
                          </td>
                          <td className="px-3 py-2.5">
                            <BloodTypeBadge bloodType={u.bloodType} />
                          </td>
                          <td className="px-3 py-2.5">{u.component}</td>
                          <td className="px-3 py-2.5 tabular-nums">
                            {u.expirationDate}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-500">
                            {u.storageLocation}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Manual Compatibility & Crossmatch Verification Form */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-[#172B4D] mb-1">
              3. Laboratory Crossmatching & Release Sign-Off
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Required manual clinical verification workflow before unit allocation or release.
            </p>

            <form onSubmit={handleConfirmAllocation} className="space-y-3.5">
              <FormInput
                label="Verifying Medical Technologist & PRC License"
                required
                value={medTechName}
                onChange={setMedTechName}
              />

              <FormSelect
                label="Serologic Crossmatch Result"
                value={compatibilityMethod}
                onChange={setCompatibilityMethod}
                options={[
                  {
                    label: "Verified Compatible — Major & Minor AHG Gel Card",
                    value: "Verified Compatible — Major & Minor AHG Gel Card",
                  },
                  {
                    label: "Verified Compatible — Immediate Spin & Saline",
                    value: "Verified Compatible — Immediate Spin & Saline",
                  },
                  {
                    label: "Emergency Uncrossmatched Group-Compatible Release (Physician Signed)",
                    value: "Emergency Physician-Authorized Release",
                  },
                ]}
              />

              <div className="space-y-2 p-3 rounded-xl bg-[#F5F6F8] border border-slate-200 text-xs">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aboConfirmed}
                    onChange={(e) => setAboConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>ABO & RhD Repeat Typing Verified</strong> on both donor segment and recipient specimen.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={crossmatchConfirmed}
                    onChange={(e) => setCrossmatchConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Antibody Screen & Crossmatch Bench Record</strong> verified compatible with zero hemolysis/agglutination.
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visualBagInspected}
                    onChange={(e) => setVisualBagInspected(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Visual Integrity & Cold-Chain Check</strong> passed (intact ports, normal plasma color, valid expiration).
                  </span>
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#172B4D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={releaseImmediately}
                  onChange={(e) => setReleaseImmediately(e.target.checked)}
                />
                Generate Release Documentation & Mark Released Immediately
              </label>

              <FormInput
                label="Cold-Chain Transport & Release Notes"
                value={releaseNotes}
                onChange={setReleaseNotes}
              />

              <BLButton
                type="submit"
                variant="primary"
                className="w-full"
                disabled={
                  !selectedInventoryId ||
                  !aboConfirmed ||
                  !crossmatchConfirmed ||
                  !visualBagInspected
                }
              >
                <ClipboardCheck className="h-4 w-4" />
                Confirm Allocation & Issue Release Slip
              </BLButton>
            </form>
          </div>
        </div>
      )}

      {/* Allocations & Release Documentation Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-[#172B4D]">
            Blood Allocation & Official Release Documentation Ledger
          </h3>
          <p className="text-xs text-slate-500">
            Crossmatched units allocated and released to hospital transfusion services
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Release Doc #</th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Blood Unit ID</th>
                <th className="px-4 py-3">Receiving Hospital</th>
                <th className="px-4 py-3">Compatibility & Crossmatch</th>
                <th className="px-4 py-3">Release Status</th>
                <th className="px-4 py-3 text-right">Documentation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleAllocations.map((al) => (
                <tr key={al.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                    {al.releaseDocNumber}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {al.requestCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <BloodTypeBadge bloodType={al.bloodType} />
                      <span className="font-bold text-[#172B4D] tabular-nums">
                        {al.unitId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {al.component}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#172B4D]">
                      {al.hospitalName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {al.department}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#2E7D32]">
                      {al.compatibilityStatus}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      By {al.crossmatchVerifiedBy}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={al.releaseStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BLButton
                      size="xs"
                      variant="secondary"
                      onClick={() => setReleaseSlipModal(al)}
                    >
                      <FileText className="h-3.5 w-3.5" /> Release Slip
                    </BLButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Official Release Documentation Modal */}
      <BLModal
        open={Boolean(releaseSlipModal)}
        onClose={() => setReleaseSlipModal(null)}
        title={`Official Blood Unit Release Certificate — ${releaseSlipModal?.releaseDocNumber || ""}`}
        subtitle="ISBT-128 / DOH Blood Service Facility Chain-of-Custody Form"
      >
        {releaseSlipModal && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-300 bg-[#F5F6F8]/50 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-sm text-[#172B4D]">
                  Blood Unit ID: {releaseSlipModal.unitId}
                </span>
                <BloodTypeBadge bloodType={releaseSlipModal.bloodType} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <span className="text-slate-500 block">Component:</span>
                  <strong>{releaseSlipModal.component}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Hospital Request:</span>
                  <strong>{releaseSlipModal.requestCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Receiving Facility:</span>
                  <strong>{releaseSlipModal.hospitalName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Department:</span>
                  <strong>{releaseSlipModal.department}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Crossmatch Sign-Off:</span>
                  <strong>{releaseSlipModal.crossmatchVerifiedBy}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Timestamp:</span>
                  <strong className="tabular-nums">
                    {releaseSlipModal.crossmatchTimestamp}
                  </strong>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-slate-600">
                <strong>Transport & Cold-Chain Notes:</strong>{" "}
                {releaseSlipModal.releaseNotes}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <BLButton
                variant="secondary"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" /> Print Release Slip
              </BLButton>
              <BLButton
                variant="primary"
                onClick={() => setReleaseSlipModal(null)}
              >
                Done
              </BLButton>
            </div>
          </div>
        )}
      </BLModal>
    </div>
  );
}

/* ============================================================================
 * SECTION 12: TRANSFUSION TRACKING & END-TO-END UNIT TRACEABILITY TIMELINE
 * ========================================================================== */
export function TransfusionTrackingView({
  data,
  onMutate,
  scopedHospitalName,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
  scopedHospitalName?: string;
}) {
  const [selectedTraceUnitId, setSelectedTraceUnitId] = useState<string>(
    data.transfusions[0]?.unitId || data.inventory[0]?.unitId || "PRC-2026-88390"
  );
  const [logModalOpen, setLogModalOpen] = useState(false);

  // Transfusion Form
  const [unitId, setUnitId] = useState("PRC-2026-88415");
  const [receivingHospital, setReceivingHospital] = useState(
    scopedHospitalName || "Philippine General Hospital (PGH)"
  );
  const [receivingDept, setReceivingDept] = useState(
    "Obstetrics & High-Risk Perinatology"
  );
  const [receivedBy, setReceivedBy] = useState("Dr. Rafael Bautista, MD");
  const [patientCaseRef, setPatientCaseRef] = useState("PGH-OB-2026-8812");
  const [transfusionRecord, setTransfusionRecord] = useState(
    "Infused 450 mL Packed RBC over 2.5 hours via 170-micron filter; vitals stable."
  );
  const [outcome, setOutcome] = useState("Completed Uneventfully");
  const [adverseReaction, setAdverseReaction] = useState("None Reported");
  const [adverseDetails, setAdverseDetails] = useState(
    "Zero febrile, allergic, or hemolytic signs during 4-hour post-transfusion monitoring."
  );

  const visibleTransfusions = useMemo(
    () =>
      data.transfusions.filter(
        (t) => !scopedHospitalName || t.receivingHospital === scopedHospitalName
      ),
    [data.transfusions, scopedHospitalName]
  );

  // Build End-to-End Traceability Timeline for selectedTraceUnitId
  const traceabilityTimeline = useMemo(() => {
    const col = data.collections.find((c) => c.unitId === selectedTraceUnitId);
    const inv = data.inventory.find((u) => u.unitId === selectedTraceUnitId);
    const alloc = data.allocations.find((a) => a.unitId === selectedTraceUnitId);
    const trf = data.transfusions.find((t) => t.unitId === selectedTraceUnitId);

    const steps = [
      {
        stage: "1. Voluntary Donor Phlebotomy & Barcoding",
        completed: Boolean(col || inv),
        timestamp: col?.collectionDate || inv?.collectionDate || "Recorded",
        location: col?.centerName || inv?.centerName || "PRC Blood Center",
        detail: `Blood Unit ${selectedTraceUnitId} (${
          inv?.bloodType || col?.bloodType || "O+"
        } ${inv?.component || col?.component || "Packed RBC"}) collected from screened voluntary donor ref ${
          col?.donorCode || inv?.donorReference || "BL-DNR"
        }.`,
      },
      {
        stage: "2. TTI Serology Screening & Component Processing",
        completed:
          col?.testingStatus === "Cleared / Negative" ||
          inv?.quarantineStatus !== "Under Quarantine",
        timestamp: col?.verifiedAt !== "—" ? col?.verifiedAt || "Verified" : "Pending",
        location: "Immunohematology & TTI Reference Lab",
        detail:
          col?.testingStatus === "Pending Serology"
            ? "Sample currently undergoing chemiluminescence TTI screening."
            : `Non-reactive for HIV, HBV, HCV, Syphilis & Malaria. Verified by ${
                col?.verifiedBy || "Marco Villanueva, RMT"
              }.`,
      },
      {
        stage: "3. Cold-Chain Validated Inventory Storage",
        completed: Boolean(inv),
        timestamp: inv ? `Expires ${inv.expirationDate}` : "—",
        location: inv?.storageLocation || "Cold Storage",
        detail: inv
          ? `Current disposition: ${inv.status} (${inv.quarantineStatus}).`
          : "Registered in inventory ledger.",
      },
      {
        stage: "4. Clinical Crossmatching & Hospital Allocation",
        completed: Boolean(alloc),
        timestamp: alloc?.crossmatchTimestamp || "Awaiting Allocation",
        location: alloc ? `${alloc.hospitalName} (${alloc.requestCode})` : "—",
        detail: alloc
          ? `${alloc.compatibilityStatus} by ${alloc.crossmatchVerifiedBy}. Release Doc: ${alloc.releaseDocNumber}.`
          : "Unit has not yet been crossmatched to a hospital requisition.",
      },
      {
        stage: "5. Cold-Chain Courier Release & Hospital Receipt",
        completed: Boolean(alloc && alloc.releaseStatus === "Released"),
        timestamp: alloc?.releasedAt || "—",
        location: trf?.receivingHospital || alloc?.hospitalName || "—",
        detail: trf
          ? `Received at ${trf.receivingDepartment} by ${trf.receivedBy}.`
          : alloc?.releaseNotes || "Pending hospital release.",
      },
      {
        stage: "6. Bedside Transfusion & Hemovigilance Disposition",
        completed: Boolean(trf),
        timestamp: trf?.recordedAt || "Pending Final Disposition",
        location: trf
          ? `${trf.receivingHospital} • Case ${trf.patientCaseRef}`
          : "—",
        detail: trf
          ? `${trf.outcome} — Reaction report: ${trf.adverseReaction}. ${trf.adverseReactionDetails}`
          : "Awaiting post-transfusion clinical outcome & hemovigilance return.",
      },
    ];
    return steps;
  }, [
    selectedTraceUnitId,
    data.collections,
    data.inventory,
    data.allocations,
    data.transfusions,
  ]);

  return (
    <div className="space-y-6">
      {/* End-to-End Blood Unit Traceability Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-[#172B4D]">
              Vein-to-Vein Blood Unit Traceability Timeline
            </h3>
            <p className="text-xs text-slate-500">
              Complete chain-of-custody tracking from voluntary donor collection to bedside clinical outcome
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Select Blood Unit for Traceability"
              value={selectedTraceUnitId}
              onChange={(e) => setSelectedTraceUnitId(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-[#F5F6F8] border border-slate-300 rounded-lg text-[#172B4D]"
            >
              {data.inventory.map((u) => (
                <option key={u.id} value={u.unitId}>
                  {u.unitId} ({u.bloodType} {u.component} — {u.status})
                </option>
              ))}
            </select>
            <BLButton
              size="sm"
              variant="primary"
              onClick={() => setLogModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> Log Transfusion / Reaction
            </BLButton>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          {traceabilityTimeline.map((step, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                step.completed
                  ? "bg-emerald-50/40 border-emerald-200"
                  : "bg-[#F5F6F8] border-slate-200 opacity-80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className={`h-6 w-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      step.completed
                        ? "bg-[#2E7D32] text-white"
                        : "bg-slate-300 text-slate-700"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                    {step.timestamp}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#172B4D] leading-snug">
                  {step.stage.replace(/^\d+\.\s*/, "")}
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  {step.detail}
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] font-semibold text-slate-500 truncate">
                {step.location}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transfusion Monitoring & Hemovigilance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-[#172B4D]">
            Hospital Transfusion Monitoring & Adverse Reaction Registry
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Blood Unit ID</th>
                <th className="px-4 py-3">Receiving Hospital & Dept</th>
                <th className="px-4 py-3">Release Date</th>
                <th className="px-4 py-3">Received By</th>
                <th className="px-4 py-3">Transfusion Record</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Adverse Reaction</th>
                <th className="px-4 py-3 text-right">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleTransfusions.map((tr) => (
                <tr key={tr.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <BloodTypeBadge bloodType={tr.bloodType} />
                      <span className="font-bold text-[#172B4D] tabular-nums">
                        {tr.unitId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tr.component}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#172B4D]">
                      {tr.receivingHospital}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tr.receivingDepartment}
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">
                    {tr.releaseDate}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{tr.receivedBy}</td>
                  <td className="px-4 py-3 max-w-xs text-slate-600">
                    <div className="font-semibold text-[#172B4D]">
                      Case: {tr.patientCaseRef}
                    </div>
                    <div className="text-[11px] line-clamp-2">
                      {tr.transfusionRecord}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tr.outcome} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={tr.adverseReaction} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BLButton
                      size="xs"
                      variant="secondary"
                      onClick={() => setSelectedTraceUnitId(tr.unitId)}
                    >
                      Inspect Timeline
                    </BLButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transfusion & Adverse Reaction Modal */}
      <BLModal
        open={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="Log Bedside Transfusion & Hemovigilance Outcome"
        subtitle="Record unit administration completion or report any suspected transfusion reaction."
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onMutate({
              action: "record_transfusion",
              unitId,
              receivingHospital: scopedHospitalName || receivingHospital,
              receivingDepartment: receivingDept,
              receivedBy,
              patientCaseRef,
              transfusionRecord,
              outcome,
              adverseReaction,
              adverseReactionDetails: adverseDetails,
              attendingPhysician: receivedBy,
            });
            setSelectedTraceUnitId(unitId);
            setLogModalOpen(false);
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Released / Reserved Blood Unit ID"
              value={unitId}
              onChange={setUnitId}
              options={data.inventory.map((u) => ({
                label: `${u.unitId} (${u.bloodType} ${u.component})`,
                value: u.unitId,
              }))}
            />
            <FormInput
              label="Patient Case Reference (De-identified)"
              required
              value={patientCaseRef}
              onChange={setPatientCaseRef}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Receiving Hospital"
              required
              value={scopedHospitalName || receivingHospital}
              onChange={setReceivingHospital}
            />
            <FormInput
              label="Receiving Ward / Department"
              required
              value={receivingDept}
              onChange={setReceivingDept}
            />
          </div>

          <FormInput
            label="Received & Verified By (Physician / RN)"
            required
            value={receivedBy}
            onChange={setReceivedBy}
          />

          <FormInput
            label="Transfusion Administration Record"
            required
            value={transfusionRecord}
            onChange={setTransfusionRecord}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              label="Transfusion Outcome"
              value={outcome}
              onChange={setOutcome}
              options={[
                {
                  label: "Completed Uneventfully",
                  value: "Completed Uneventfully",
                },
                { label: "In Progress", value: "In Progress" },
                {
                  label: "Discontinued - Reaction",
                  value: "Discontinued - Reaction",
                },
              ]}
            />
            <FormSelect
              label="Adverse Reaction Reporting"
              value={adverseReaction}
              onChange={setAdverseReaction}
              options={[
                { label: "None Reported", value: "None Reported" },
                {
                  label: "Mild Febrile Non-Hemolytic",
                  value: "Mild Febrile Non-Hemolytic",
                },
                {
                  label: "Allergic Urticarial Reaction",
                  value: "Allergic Urticarial Reaction",
                },
                {
                  label: "Suspected Hemolytic — Immediate Lab Investigation",
                  value: "Suspected Hemolytic Reaction",
                },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Hemovigilance & Post-Transfusion Vitals Summary
            </label>
            <textarea
              rows={2}
              value={adverseDetails}
              onChange={(e) => setAdverseDetails(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <BLButton
              variant="secondary"
              onClick={() => setLogModalOpen(false)}
            >
              Cancel
            </BLButton>
            <BLButton type="submit" variant="primary">
              Submit Transfusion Record
            </BLButton>
          </div>
        </form>
      </BLModal>
    </div>
  );
}

/* ============================================================================
 * SECTION 13: REPORTS AND ANALYTICS
 * ========================================================================== */
export function ReportsAndAnalyticsView({ data }: { data: BloodLinkDataset }) {
  const [dateFrom, setDateFrom] = useState("2026-01-01");
  const [dateTo, setDateTo] = useState("2026-04-30");
  const [activeReport, setActiveReport] = useState("monthly_donations");

  const reportCategories = [
    { id: "monthly_donations", label: "Monthly Blood Donations" },
    { id: "inventory_by_type", label: "Blood Inventory by Blood Type" },
    { id: "component_dist", label: "Blood Component Distribution" },
    { id: "hospital_requests", label: "Hospital Blood Requests" },
    { id: "emergency_requests", label: "Emergency Requests" },
    { id: "expiration", label: "Blood Unit Expiration" },
    { id: "center_perf", label: "Donation Center Performance" },
    { id: "utilization", label: "Blood Unit Utilization" },
    { id: "traceability", label: "Blood Unit Traceability" },
  ];

  // Monthly Donations deterministic historical statistics
  const monthlyDonations = [
    { month: "Nov 2025", wholeBlood: 142, apheresis: 38, total: 180 },
    { month: "Dec 2025", wholeBlood: 168, apheresis: 44, total: 212 },
    { month: "Jan 2026", wholeBlood: 195, apheresis: 51, total: 246 },
    { month: "Feb 2026", wholeBlood: 176, apheresis: 49, total: 225 },
    { month: "Mar 2026", wholeBlood: 210, apheresis: 58, total: 268 },
    { month: "Apr 2026 (MTD)", wholeBlood: 134, apheresis: 39, total: 173 },
  ];

  // Export CSV / Excel compatible spreadsheet
  const handleExportExcelCsv = () => {
    const headers = [
      "Unit ID",
      "Blood Type",
      "Component",
      "Collection Date",
      "Expiration Date",
      "Center",
      "Storage Location",
      "Status",
    ];
    const rows = data.inventory.map((u) => [
      u.unitId,
      u.bloodType,
      u.component,
      u.collectionDate,
      u.expirationDate,
      `"${u.centerName}"`,
      `"${u.storageLocation}"`,
      u.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BloodLink_${activeReport}_${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Date Filter & Export Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end justify-between gap-4 shadow-2xs no-print">
        <div className="flex flex-wrap items-end gap-3">
          <FormInput
            label="Report Start Date"
            type="date"
            value={dateFrom}
            onChange={setDateFrom}
          />
          <FormInput
            label="Report End Date"
            type="date"
            value={dateTo}
            onChange={setDateTo}
          />
          <FormSelect
            label="Report Module"
            value={activeReport}
            onChange={setActiveReport}
            options={reportCategories.map((c) => ({
              label: c.label,
              value: c.id,
            }))}
          />
        </div>

        <div className="flex items-center gap-2.5">
          <BLButton variant="secondary" onClick={handleExportExcelCsv}>
            <FileSpreadsheet className="h-4 w-4 text-[#2E7D32]" />
            Export Excel (.CSV)
          </BLButton>
          <BLButton variant="primary" onClick={() => window.print()}>
            <Download className="h-4 w-4" />
            Download PDF Report
          </BLButton>
        </div>
      </div>

      {/* 9 Report Category Quick Pills */}
      <div className="flex flex-wrap gap-1.5 no-print">
        {reportCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveReport(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              activeReport === cat.id
                ? "bg-[#172B4D] text-white border-[#172B4D]"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Printable Institutional Report Sheet */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#C62828]">
              BloodLink Institutional Healthcare Report
            </div>
            <h2 className="text-lg font-bold text-[#172B4D] mt-0.5">
              {reportCategories.find((r) => r.id === activeReport)?.label}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Reporting Period: {dateFrom} to {dateTo} • Generated for Philippine Red Cross & DOH Blood Services Audit
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 tabular-nums">
            <div>Total Units Audited: {data.inventory.length}</div>
            <div> Utilization Rate: 94.2%</div>
          </div>
        </div>

        {/* Monthly Blood Donations Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Monthly Voluntary Blood Donations Volume
            </h3>
            <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 px-2 border-b border-slate-200">
              {monthlyDonations.map((m) => (
                <div key={m.month} className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-[#172B4D] tabular-nums mb-1">
                    {m.total}
                  </span>
                  <div
                    style={{ height: `${Math.round((m.total / 280) * 125)}px` }}
                    className="w-full max-w-[36px] rounded-t-md bg-[#C62828]"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-3 pt-2 text-center text-[11px] font-semibold text-slate-600">
              {monthlyDonations.map((m) => (
                <span key={m.month}>{m.month.split(" ")[0]}</span>
              ))}
            </div>
          </div>

          {/* Center Performance & Utilization Summary */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Donation Center Collection Performance
            </h3>
            {data.bloodCenters.map((bc) => {
              const pct = Math.min(
                100,
                Math.round((bc.driveCollectedUnits / Math.max(1, bc.driveTargetUnits)) * 100)
              );
              return (
                <div key={bc.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172B4D] truncate pr-2">
                      {bc.name}
                    </span>
                    <span className="font-bold text-[#172B4D] tabular-nums shrink-0">
                      {bc.driveCollectedUnits}/{bc.driveTargetUnits} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F5F6F8] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#2E7D32]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Report Data Table based on activeReport */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Detailed Tabular Audit Breakdown
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            {activeReport === "hospital_requests" ||
            activeReport === "emergency_requests" ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Request Code</th>
                    <th className="px-4 py-2.5">Hospital</th>
                    <th className="px-4 py-2.5">Type & Component</th>
                    <th className="px-4 py-2.5">Fulfilled / Req</th>
                    <th className="px-4 py-2.5">Urgency</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.requests
                    .filter(
                      (r) =>
                        activeReport !== "emergency_requests" ||
                        r.urgency === "Emergency"
                    )
                    .map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 font-bold tabular-nums">
                          {r.requestCode}
                        </td>
                        <td className="px-4 py-2.5">{r.hospitalName}</td>
                        <td className="px-4 py-2.5">
                          {r.bloodType} • {r.component}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {r.unitsFulfilled} / {r.unitsRequested}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={r.urgency} />
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Blood Unit ID</th>
                    <th className="px-4 py-2.5">Blood Type</th>
                    <th className="px-4 py-2.5">Component</th>
                    <th className="px-4 py-2.5">Collection Date</th>
                    <th className="px-4 py-2.5">Expiration Date</th>
                    <th className="px-4 py-2.5">Days Remaining</th>
                    <th className="px-4 py-2.5">Disposition Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.inventory.slice(0, 12).map((u) => {
                    const d = daysUntilExpiration(u.expirationDate);
                    return (
                      <tr key={u.id}>
                        <td className="px-4 py-2.5 font-bold tabular-nums">
                          {u.unitId}
                        </td>
                        <td className="px-4 py-2.5">
                          <BloodTypeBadge bloodType={u.bloodType} />
                        </td>
                        <td className="px-4 py-2.5">{u.component}</td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {u.collectionDate}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {u.expirationDate}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {d < 0 ? "Expired" : `${d} days`}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={u.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * BLOOD CENTERS, USER MANAGEMENT & SYSTEM PRIVACY SETTINGS MODULES
 * ========================================================================== */
export function BloodCentersManagementView({
  data,
  onMutate,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [chapter, setChapter] = useState("Manila Chapter");
  const [facilityType, setFacilityType] = useState("Mobile Collection Drive");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Manila");
  const [driveTitle, setDriveTitle] = useState("");
  const [driveDate, setDriveDate] = useState("2026-04-25 • 08:00 AM – 04:00 PM");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#172B4D]">
            Accredited Blood Service Facilities & Collection Drives
          </h3>
          <p className="text-xs text-slate-500">
            Philippine Red Cross blood banks, regional blood stations, and active community mobile drives
          </p>
        </div>
        <BLButton variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Register Drive / Facility
        </BLButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.bloodCenters.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-[#C62828] uppercase">
                  {c.facilityType} • {c.centerCode}
                </span>
                <h4 className="text-base font-bold text-[#172B4D] mt-0.5">
                  {c.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{c.address}</p>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div className="p-3 rounded-lg bg-[#F5F6F8] border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-[#172B4D]">
                Active Drive: {c.activeDriveTitle}
              </div>
              <div className="text-slate-600">{c.driveDate}</div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 tabular-nums">
                <span>
                  Collected: <strong>{c.driveCollectedUnits}</strong> /{" "}
                  {c.driveTargetUnits} units
                </span>
                <span>Cold Storage: {c.storageCapacityStatus}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{c.operatingHours}</span>
              <span className="font-semibold text-[#172B4D] tabular-nums">
                {c.contactPhone}
              </span>
            </div>
          </div>
        ))}
      </div>

      <BLModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Blood Center or Mobile Collection Drive"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onMutate({
              action: "add_blood_center",
              name,
              chapter,
              facilityType,
              address,
              city,
              activeDriveTitle: driveTitle,
              driveDate,
            });
            setModalOpen(false);
          }}
          className="space-y-3.5"
        >
          <FormInput
            label="Facility / Drive Name"
            required
            value={name}
            onChange={setName}
            placeholder="e.g., PRC Pasay City Hall Mobile Blood Drive"
          />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Chapter" required value={chapter} onChange={setChapter} />
            <FormSelect
              label="Facility Type"
              value={facilityType}
              onChange={setFacilityType}
              options={[
                { label: "Mobile Collection Drive", value: "Mobile Collection Drive" },
                { label: "Chapter Blood Bank", value: "Chapter Blood Bank" },
                { label: "National Blood Center", value: "National Blood Center" },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Street / Venue Address" required value={address} onChange={setAddress} />
            <FormInput label="City" required value={city} onChange={setCity} />
          </div>
          <FormInput
            label="Active Campaign Title"
            required
            value={driveTitle}
            onChange={setDriveTitle}
          />
          <FormInput
            label="Schedule Window"
            required
            value={driveDate}
            onChange={setDriveDate}
          />
          <div className="flex justify-end gap-2 pt-2">
            <BLButton variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </BLButton>
            <BLButton type="submit" variant="primary">
              Publish Facility / Drive
            </BLButton>
          </div>
        </form>
      </BLModal>
    </div>
  );
}

export function UserManagementView({
  data,
  onMutate,
}: {
  data: BloodLinkDataset;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Pathologist / MedTech");
  const [facility, setFacility] = useState(
    "PRC National Blood Center - Port Area"
  );
  const [department, setDepartment] = useState("Immunohematology Lab");

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#172B4D]">
            Role-Based Healthcare Personnel Access Control
          </h3>
          <p className="text-xs text-slate-500">
            Authorized blood center administrators, medical technologists, and hospital blood bank officers
          </p>
        </div>
        <BLButton variant="primary" onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4" /> Provision Staff Account
        </BLButton>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F6F8] text-slate-500 uppercase text-[11px] border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Staff ID</th>
              <th className="px-4 py-3">Personnel Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Assigned Facility & Dept</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-bold text-[#172B4D] tabular-nums">
                  {u.staffCode}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#172B4D]">{u.fullName}</div>
                  <div className="text-[11px] text-slate-500">{u.email}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-[#172B4D]">
                  {u.role}
                </td>
                <td className="px-4 py-3">
                  <div>{u.facility}</div>
                  <div className="text-[11px] text-slate-500">{u.department}</div>
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600">
                  {u.lastLogin}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {u.status !== "Verified" ? (
                    <BLButton
                      size="xs"
                      variant="success"
                      onClick={() =>
                        onMutate({
                          action: "update_user_status",
                          id: u.id,
                          status: "Verified",
                        })
                      }
                    >
                      Verify Access
                    </BLButton>
                  ) : (
                    <BLButton
                      size="xs"
                      variant="secondary"
                      onClick={() =>
                        onMutate({
                          action: "update_user_status",
                          id: u.id,
                          status: "Inactive",
                        })
                      }
                    >
                      Suspend
                    </BLButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BLModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision Institutional Staff Account"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onMutate({
              action: "add_user",
              fullName,
              email,
              role,
              facility,
              department,
            });
            setModalOpen(false);
          }}
          className="space-y-3.5"
        >
          <FormInput
            label="Full Name & Credentials"
            required
            value={fullName}
            onChange={setFullName}
            placeholder="e.g., Maria Clara Reyes, RMT"
          />
          <FormInput
            label="Institutional Email"
            type="email"
            required
            value={email}
            onChange={setEmail}
          />
          <FormSelect
            label="Authorized System Role"
            value={role}
            onChange={setRole}
            options={[
              { label: "Administrator", value: "Administrator" },
              {
                label: "Pathologist / MedTech",
                value: "Pathologist / MedTech",
              },
              { label: "Blood Center Staff", value: "Blood Center Staff" },
              { label: "Hospital Coordinator", value: "Hospital Coordinator" },
            ]}
          />
          <FormInput
            label="Facility"
            required
            value={facility}
            onChange={setFacility}
          />
          <FormInput
            label="Department"
            required
            value={department}
            onChange={setDepartment}
          />
          <div className="flex justify-end gap-2 pt-2">
            <BLButton variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </BLButton>
            <BLButton type="submit" variant="primary">
              Create Staff Account
            </BLButton>
          </div>
        </form>
      </BLModal>
    </div>
  );
}

export function SystemSettingsView() {
  const [fuzzKm, setFuzzKm] = useState("1.5");
  const [expiryAlertDays, setExpiryAlertDays] = useState("7");
  const [requireDualRmt, setRequireDualRmt] = useState(true);
  const [maskDonorBloodTypeRadar, setMaskDonorBloodTypeRadar] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-[#172B4D]">
            Healthcare Governance, Cold-Chain & Privacy Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Conventional rule-based parameters aligned with DOH Administrative Order 2008-0008 and Philippine Data Privacy Act (RA 10173).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            label="Radar Coordinate Fuzzing Offset (KM)"
            type="number"
            value={fuzzKm}
            onChange={setFuzzKm}
            helperText="Prevents pinpointing exact residential addresses"
          />
          <FormInput
            label="FEFO Expiration Warning Threshold (Days)"
            type="number"
            value={expiryAlertDays}
            onChange={setExpiryAlertDays}
            helperText="Flags platelets and RBCs nearing shelf-life limit"
          />
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={maskDonorBloodTypeRadar}
              onChange={(e) => setMaskDonorBloodTypeRadar(e.target.checked)}
              disabled
              className="mt-0.5"
            />
            <div>
              <div className="font-bold text-[#172B4D]">
                Enforce Strict Radar Blood Type & Identity Redaction (Locked Mandatory Policy)
              </div>
              <div className="text-slate-500 mt-0.5">
                Donor Proximity Radar never renders blood types, donor names, or contact numbers on map markers or summary panels.
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={requireDualRmt}
              onChange={(e) => setRequireDualRmt(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <div className="font-bold text-[#172B4D]">
                Require Licensed RMT Crossmatch Verification Before Release Slip Issuance
              </div>
              <div className="text-slate-500 mt-0.5">
                Blocks automated clinical compatibility decisions; mandates human serologic sign-off.
              </div>
            </div>
          </label>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] font-semibold">
            Institutional configuration saved to audit log.
          </div>
        )}

        <div className="flex justify-end">
          <BLButton variant="primary" onClick={() => setSaved(true)}>
            Save Governance Settings
          </BLButton>
        </div>
      </div>
    </div>
  );
}
