"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Droplets,
  HeartHandshake,
  Home,
  Lock,
  MapPin,
  Radio,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  UserPlus,
  X,
} from "lucide-react";
import {
  BLButton,
  BloodLinkLogo,
  BloodTypeBadge,
  StatusBadge,
} from "@/components/ui/BloodLinkUI";
import { BLOOD_TYPES } from "@/lib/bloodlink-utils";
import type {
  BloodLinkDataset,
  MobileTabKey,
  RadarResponse,
} from "@/types/bloodlink";

type MobileOverlayFlow = "none" | "onboarding" | "register";

export function DonorMobileApp({
  data,
  activeDonorId,
  onSelectDonor,
  onMutate,
}: {
  data: BloodLinkDataset;
  activeDonorId: number;
  onSelectDonor: (id: number) => void;
  onMutate: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<MobileTabKey>("home");
  const [overlayFlow, setOverlayFlow] = useState<MobileOverlayFlow>("none");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [frameMode, setFrameMode] = useState<"phone" | "responsive">("phone");

  // Appointment Booking / Reschedule State
  const [bookingCenterId, setBookingCenterId] = useState<number | null>(null);
  const [bookDate, setBookDate] = useState("2026-04-20");
  const [bookSlot, setBookSlot] = useState("09:30 AM – 10:15 AM");
  const [bookType, setBookType] = useState("Whole Blood");
  const [confirmedApptCode, setConfirmedApptCode] = useState<string | null>(null);
  const [reschedulingApptId, setReschedulingApptId] = useState<number | null>(null);

  // Emergency Radar Invitation Response Sheet
  const [respondingInvite, setRespondingInvite] = useState<RadarResponse | null>(
    null
  );
  const [consentShareCenter, setConsentShareCenter] = useState(true);
  const [acceptedNextStepsRef, setAcceptedNextStepsRef] = useState<string | null>(
    null
  );

  // Donor Registration Form State (Screen 2)
  const [regName, setRegName] = useState("");
  const [regBirthday, setRegBirthday] = useState("1999-03-18");
  const [regSex, setRegSex] = useState("Female");
  const [regPhone, setRegPhone] = useState("+63 917 ");
  const [regEmail, setRegEmail] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regEmergContact, setRegEmergContact] = useState("");
  const [regBloodType, setRegBloodType] = useState("Unverified");
  const [regScreeningInfo, setRegScreeningInfo] = useState(
    "Healthy adult, weight > 50kg, no recent surgery, tattoos, or travel deferrals in past 6 months."
  );
  const [regConsentPrivacy, setRegConsentPrivacy] = useState(true);
  const [regLocationOptIn, setRegLocationOptIn] = useState(true);

  const donor = useMemo(
    () =>
      data.donors.find((d) => d.id === activeDonorId) || data.donors[0] || null,
    [data.donors, activeDonorId]
  );

  const myAppointments = useMemo(
    () =>
      donor
        ? data.appointments.filter(
            (a) => a.donorId === donor.id || a.donorCode === donor.donorCode
          )
        : [],
    [data.appointments, donor]
  );

  const myDonations = useMemo(
    () =>
      donor
        ? data.collections.filter(
            (c) => c.donorId === donor.id || c.donorCode === donor.donorCode
          )
        : [],
    [data.collections, donor]
  );

  const myRadarInvitations = useMemo(() => {
    if (!donor) return [];
    return data.radarResponses.filter((r) => r.donorId === donor.id);
  }, [data.radarResponses, donor]);

  const myNotifications = useMemo(() => {
    if (!donor) return [];
    return data.notifications.filter(
      (n) =>
        n.targetPortal === "Donor" &&
        (n.donorId === null || n.donorId === donor.id)
    );
  }, [data.notifications, donor]);

  const pendingInvites = myRadarInvitations.filter(
    (r) => r.responseStatus === "Pending"
  );

  if (!donor) return null;

  const onboardingSlides = [
    {
      title: "Discover Blood Donation Opportunities",
      desc: "Browse verified Philippine Red Cross chapters, hospital blood stations, and community mobile drives in real time.",
      icon: <Compass className="h-10 w-10 text-[#C62828]" />,
      stepTag: "Step 1 of 3",
    },
    {
      title: "Find Nearby Blood Donation Centers",
      desc: "Opt into privacy-preserving approximate location discovery so nearby centers can send voluntary emergency alerts without exposing your identity or blood type.",
      icon: <MapPin className="h-10 w-10 text-[#172B4D]" />,
      stepTag: "Step 2 of 3",
    },
    {
      title: "Help Save Lives Through Voluntary Donation",
      desc: "Book convenient appointments, track your verified donation history, and support patients across partner hospitals.",
      icon: <HeartHandshake className="h-10 w-10 text-[#2E7D32]" />,
      stepTag: "Step 3 of 3",
    },
  ];

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regConsentPrivacy) return;
    await onMutate({
      action: "add_donor",
      fullName: regName,
      birthday: regBirthday,
      sex: regSex,
      phone: regPhone,
      email: regEmail,
      address: regAddress,
      sectorLabel: `${regAddress.slice(0, 18) || "Metro Manila"} Approx. Sector`,
      emergencyContactName: regEmergContact,
      emergencyContactPhone: regPhone,
      bloodType: regBloodType,
      bloodTypeVerified: false,
      medicalScreeningNotes: regScreeningInfo,
      consentDataProcessing: regConsentPrivacy,
      locationSharingEnabled: regLocationOptIn,
      contactInvitationOptIn: regLocationOptIn,
      registrationStatus: "Pending Screening",
    });
    setOverlayFlow("none");
    setActiveTab("profile");
  };

  return (
    <div className="min-h-[calc(100vh-3.25rem)] bg-[#F5F6F8] py-4 px-2 sm:px-6 flex flex-col items-center">
      {/* Top Preview Controls Bar (Desktop Evaluator Convenience) */}
      <div className="w-full max-w-4xl mb-4 bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs no-print">
        <div className="flex items-center gap-2 text-xs">
          <Smartphone className="h-4 w-4 text-[#C62828]" />
          <span className="font-bold text-[#172B4D]">
            BloodLink Donor Mobile App (Part B)
          </span>
          <select
            aria-label="Switch Active Mobile Donor"
            value={donor.id}
            onChange={(e) => onSelectDonor(Number(e.target.value))}
            className="ml-1 px-2 py-1 rounded-md bg-[#F5F6F8] border border-slate-300 text-xs font-semibold text-[#172B4D]"
          >
            {data.donors.slice(0, 8).map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.donorCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <BLButton
            size="xs"
            variant="secondary"
            onClick={() => {
              setOnboardingStep(0);
              setOverlayFlow("onboarding");
            }}
          >
            Screen 1: Onboarding
          </BLButton>
          <BLButton
            size="xs"
            variant="secondary"
            onClick={() => setOverlayFlow("register")}
          >
            <UserPlus className="h-3.5 w-3.5" /> Screen 2: Donor Registration
          </BLButton>
          <button
            type="button"
            onClick={() =>
              setFrameMode(frameMode === "phone" ? "responsive" : "phone")
            }
            className="hidden sm:inline-flex px-2.5 py-1 rounded-md border border-slate-300 text-xs font-semibold text-[#172B4D] hover:bg-slate-50 cursor-pointer"
          >
            {frameMode === "phone" ? "Expand Width" : "Phone Frame"}
          </button>
        </div>
      </div>

      {/* Mobile Device Viewport Container */}
      <div
        className={`w-full ${
          frameMode === "phone"
            ? "max-w-[420px] sm:rounded-[2rem] sm:border-[6px] sm:border-[#172B4D] sm:shadow-xl"
            : "max-w-2xl rounded-2xl border border-slate-200 shadow-sm"
        } bg-[#F5F6F8] overflow-hidden flex flex-col min-h-[730px] max-h-[840px] relative`}
      >
        {/* Mobile App Top Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <BloodLinkLogo size="sm" />
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                donor.locationSharingEnabled
                  ? "bg-emerald-50 text-[#2E7D32] border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              <Radio className="h-3 w-3" />
              {donor.locationSharingEnabled ? "Radar On" : "Radar Off"}
            </span>
          </div>
        </div>

        {/* SCREEN 1 OVERLAY: 3-STEP ONBOARDING */}
        {overlayFlow === "onboarding" && (
          <div className="absolute inset-0 z-30 bg-white flex flex-col justify-between p-6">
            <div className="flex items-center justify-between">
              <BloodLinkLogo size="sm" />
              <button
                type="button"
                onClick={() => setOverlayFlow("none")}
                className="text-xs font-semibold text-slate-500 hover:text-[#172B4D] cursor-pointer"
              >
                Skip
              </button>
            </div>

            <div className="my-auto text-center px-2 space-y-5">
              <div className="h-24 w-24 rounded-3xl bg-[#F5F6F8] border border-slate-200 flex items-center justify-center mx-auto shadow-2xs">
                {onboardingSlides[onboardingStep].icon}
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-[#C62828] text-xs font-bold">
                {onboardingSlides[onboardingStep].stepTag}
              </span>
              <h2 className="text-xl font-bold text-[#172B4D] leading-snug">
                {onboardingSlides[onboardingStep].title}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                {onboardingSlides[onboardingStep].desc}
              </p>

              {/* Carousel Dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {[0, 1, 2].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setOnboardingStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      onboardingStep === idx
                        ? "w-7 bg-[#C62828]"
                        : "w-2 bg-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {onboardingStep < 2 ? (
                <BLButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </BLButton>
              ) : (
                <>
                  <BLButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setOverlayFlow("register")}
                  >
                    Register as Voluntary Donor
                  </BLButton>
                  <BLButton
                    variant="secondary"
                    size="md"
                    className="w-full"
                    onClick={() => setOverlayFlow("none")}
                  >
                    Continue to Donor Home
                  </BLButton>
                </>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 2 OVERLAY: DONOR REGISTRATION */}
        {overlayFlow === "register" && (
          <div className="absolute inset-0 z-30 bg-white flex flex-col">
            <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#172B4D]">
                  Voluntary Donor Registration
                </h2>
                <p className="text-[11px] text-slate-500">
                  Confidential medical & contact intake
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOverlayFlow("none")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handleRegisterSubmit}
              className="flex-1 overflow-y-auto p-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Birthday *
                  </label>
                  <input
                    type="date"
                    required
                    value={regBirthday}
                    onChange={(e) => setRegBirthday(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Sex *
                  </label>
                  <select
                    value={regSex}
                    onChange={(e) => setRegSex(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Contact Number *
                  </label>
                  <input
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">
                    Blood Type (Optional)
                  </label>
                  <select
                    value={regBloodType}
                    onChange={(e) => setRegBloodType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Unverified">Unknown (Verify at Lab)</option>
                    {BLOOD_TYPES.map((bt) => (
                      <option key={bt} value={bt}>
                        {bt} (Subject to Verification)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="donor@email.ph"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  City / Address *
                </label>
                <input
                  required
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Brgy., City, Metro Manila"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Emergency Contact Name & Phone *
                </label>
                <input
                  required
                  value={regEmergContact}
                  onChange={(e) => setRegEmergContact(e.target.value)}
                  placeholder="Maria Dela Cruz • +63 918..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">
                  Pre-Screening Health Declaration
                </label>
                <textarea
                  rows={2}
                  value={regScreeningInfo}
                  onChange={(e) => setRegScreeningInfo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Consent & Privacy Disclosures */}
              <div className="p-3 rounded-xl bg-[#F5F6F8] border border-slate-200 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={regConsentPrivacy}
                    onChange={(e) => setRegConsentPrivacy(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-[11px] text-slate-600">
                    I consent to confidential medical screening and blood bank recordkeeping under RA 10173 (Data Privacy Act). *
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regLocationOptIn}
                    onChange={(e) => setRegLocationOptIn(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-[11px] text-slate-600">
                    Allow my approximate location to be used for anonymous nearby donor discovery (can be disabled anytime).
                  </span>
                </label>
              </div>

              <BLButton type="submit" variant="primary" size="lg" className="w-full">
                Submit Donor Registration
              </BLButton>
            </form>
          </div>
        )}

        {/* MAIN SCROLLABLE MOBILE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {/* SCREEN 3: HOME DASHBOARD */}
          {activeTab === "home" && (
            <div className="space-y-4">
              {/* Personalized Greeting & Donor Status Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Mabuhay, Voluntary Donor
                    </p>
                    <h1 className="text-lg font-bold text-[#172B4D]">
                      {donor.fullName}
                    </h1>
                    <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                      ID: {donor.donorCode}
                    </p>
                  </div>
                  <StatusBadge status={donor.registrationStatus} />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-[#F5F6F8] text-center">
                    <div className="text-[10px] text-slate-500">Donations</div>
                    <div className="text-base font-bold text-[#172B4D] tabular-nums mt-0.5">
                      {donor.totalDonations}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F5F6F8] text-center">
                    <div className="text-[10px] text-slate-500">Blood Group</div>
                    <div className="text-base font-bold text-[#C62828] tabular-nums mt-0.5">
                      {donor.bloodType}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F5F6F8] text-center">
                    <div className="text-[10px] text-slate-500">Last Donated</div>
                    <div className="text-[11px] font-bold text-[#172B4D] tabular-nums mt-1">
                      {donor.lastDonationDate}
                    </div>
                  </div>
                </div>

                {/* Prominent Red Button: "Find Nearby Donation Centers" */}
                <button
                  type="button"
                  onClick={() => setActiveTab("drives")}
                  className="w-full py-3 px-4 rounded-xl bg-[#C62828] hover:bg-[#8E1B1B] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <MapPin className="h-4 w-4" />
                  Find Nearby Donation Centers
                </button>
              </div>

              {/* Emergency Donation Invitations (Connected to Donor Proximity Radar!) */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#C62828]">
                      Emergency Donor Invitations ({pendingInvites.length})
                    </h2>
                    <span className="text-[10px] text-slate-500">Identity Protected</span>
                  </div>
                  {pendingInvites.map((inv) => {
                    const bcast = data.radarBroadcasts.find(
                      (b) => b.id === inv.broadcastId
                    );
                    return (
                      <div
                        key={inv.id}
                        className="bg-white rounded-2xl border-2 border-red-200 p-4 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <StatusBadge status={bcast?.urgency || "Emergency"} />
                          <span className="text-[11px] font-bold text-slate-600 tabular-nums">
                            ~{inv.approxDistanceKm} km away
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[#172B4D]">
                          {bcast?.hospitalName || "Partner Hospital"}
                        </div>
                        <div className="text-xs text-slate-600">
                          Component Needed:{" "}
                          <strong>{bcast?.requestedComponent || "Packed RBC"}</strong>{" "}
                          • Required: {bcast?.requiredDate || "Today"}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Lock className="h-3 w-3 text-[#2E7D32]" />
                            Hospital cannot see your identity
                          </span>
                          <BLButton
                            size="xs"
                            variant="primary"
                            onClick={() => setRespondingInvite(inv)}
                          >
                            Respond
                          </BLButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Upcoming Donation Appointments */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Upcoming Appointments
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("drives")}
                    className="text-xs font-bold text-[#C62828] cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
                {myAppointments.filter(
                  (a) => a.status !== "Completed" && a.status !== "Cancelled"
                ).length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No active appointments booked. Tap &ldquo;Find Nearby Donation Centers&rdquo; to schedule.
                  </p>
                ) : (
                  myAppointments
                    .filter(
                      (a) => a.status !== "Completed" && a.status !== "Cancelled"
                    )
                    .map((ap) => (
                      <div
                        key={ap.id}
                        className="p-3 rounded-xl bg-[#F5F6F8] border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#172B4D]">
                            {ap.centerName}
                          </span>
                          <StatusBadge status={ap.status} />
                        </div>
                        <div className="text-slate-600 tabular-nums">
                          {ap.scheduledDate} • {ap.timeSlot}
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Nearby Blood Donation Drives */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Nearby Blood Donation Drives
                </h2>
                {data.bloodCenters.slice(0, 3).map((center) => (
                  <div
                    key={center.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#172B4D] truncate">
                        {center.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {center.activeDriveTitle}
                      </div>
                      <div className="text-[10px] text-[#2E7D32] font-semibold mt-0.5">
                        {center.driveDate}
                      </div>
                    </div>
                    <BLButton
                      size="xs"
                      variant="secondary"
                      onClick={() => {
                        setBookingCenterId(center.id);
                        setActiveTab("drives");
                      }}
                    >
                      Book
                    </BLButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 4: FIND DRIVES & DONATION APPOINTMENTS */}
          {activeTab === "drives" && (
            <div className="space-y-4">
              {confirmedApptCode && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Appointment Confirmed!
                  </div>
                  <p>
                    Confirmation Pass: <strong>{confirmedApptCode}</strong>. Present your valid ID at reception.
                  </p>
                </div>
              )}

              {/* My Scheduled Appointments (Reschedule / Cancel) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h2 className="text-sm font-bold text-[#172B4D]">
                  My Appointments
                </h2>
                {myAppointments.length === 0 ? (
                  <p className="text-xs text-slate-500">No appointments yet.</p>
                ) : (
                  myAppointments.map((ap) => (
                    <div
                      key={ap.id}
                      className="p-3 rounded-xl bg-[#F5F6F8] border border-slate-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172B4D] tabular-nums">
                          {ap.appointmentCode}
                        </span>
                        <StatusBadge status={ap.status} />
                      </div>
                      <div>
                        <div className="font-semibold text-[#172B4D]">
                          {ap.centerName}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          {ap.scheduledDate} • {ap.timeSlot} ({ap.donationType})
                        </div>
                      </div>

                      {reschedulingApptId === ap.id ? (
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <input
                            type="date"
                            value={bookDate}
                            onChange={(e) => setBookDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                          <div className="flex gap-2">
                            <BLButton
                              size="xs"
                              variant="primary"
                              onClick={async () => {
                                await onMutate({
                                  action: "update_appointment",
                                  id: ap.id,
                                  scheduledDate: bookDate,
                                  status: "Rescheduled",
                                });
                                setReschedulingApptId(null);
                              }}
                            >
                              Save New Date
                            </BLButton>
                            <BLButton
                              size="xs"
                              variant="secondary"
                              onClick={() => setReschedulingApptId(null)}
                            >
                              Cancel
                            </BLButton>
                          </div>
                        </div>
                      ) : (
                        ap.status !== "Completed" &&
                        ap.status !== "Cancelled" && (
                          <div className="flex gap-2 pt-1">
                            <BLButton
                              size="xs"
                              variant="secondary"
                              onClick={() => setReschedulingApptId(ap.id)}
                            >
                              Reschedule
                            </BLButton>
                            <BLButton
                              size="xs"
                              variant="danger"
                              onClick={() =>
                                onMutate({
                                  action: "update_appointment",
                                  id: ap.id,
                                  status: "Cancelled",
                                })
                              }
                            >
                              Cancel Slot
                            </BLButton>
                          </div>
                        )
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Browse Available Blood Donation Drives */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[#172B4D]">
                  Available Blood Centers & Mobile Drives
                </h2>
                {data.bloodCenters.map((c) => {
                  const isBooking = bookingCenterId === c.id;
                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#C62828]">
                            {c.facilityType}
                          </span>
                          <h3 className="text-sm font-bold text-[#172B4D]">
                            {c.name}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            {c.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 bg-[#F5F6F8] p-2.5 rounded-lg">
                        <div className="font-semibold text-[#172B4D]">
                          {c.activeDriveTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {c.driveDate}
                        </div>
                      </div>

                      {isBooking ? (
                        <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={bookDate}
                              onChange={(e) => setBookDate(e.target.value)}
                              className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                            />
                            <select
                              value={bookSlot}
                              onChange={(e) => setBookSlot(e.target.value)}
                              className="px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                            >
                              <option value="08:30 AM – 09:15 AM">08:30 AM</option>
                              <option value="09:30 AM – 10:15 AM">09:30 AM</option>
                              <option value="01:30 PM – 02:15 PM">01:30 PM</option>
                            </select>
                          </div>
                          <select
                            value={bookType}
                            onChange={(e) => setBookType(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                          >
                            <option value="Whole Blood">Whole Blood Donation</option>
                            <option value="Platelet Apheresis">
                              Platelet Apheresis
                            </option>
                            <option value="Packed RBC">Packed RBC</option>
                          </select>
                          <div className="flex gap-2">
                            <BLButton
                              size="sm"
                              variant="primary"
                              className="flex-1"
                              onClick={async () => {
                                await onMutate({
                                  action: "create_appointment",
                                  donorId: donor.id,
                                  donorCode: donor.donorCode,
                                  donorName: donor.fullName,
                                  centerId: c.id,
                                  centerName: c.name,
                                  centerAddress: c.address,
                                  scheduledDate: bookDate,
                                  timeSlot: bookSlot,
                                  donationType: bookType,
                                });
                                setBookingCenterId(null);
                                setConfirmedApptCode(
                                  `APT-2026-${Math.floor(5200 + Math.random() * 900)}`
                                );
                              }}
                            >
                              Confirm Booking
                            </BLButton>
                            <BLButton
                              size="sm"
                              variant="secondary"
                              onClick={() => setBookingCenterId(null)}
                            >
                              Cancel
                            </BLButton>
                          </div>
                        </div>
                      ) : (
                        <BLButton
                          size="sm"
                          variant="primary"
                          className="w-full"
                          onClick={() => setBookingCenterId(c.id)}
                        >
                          Book Donation Appointment
                        </BLButton>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 5: MY DONATIONS */}
          {activeTab === "donations" && (
            <div className="space-y-4">
              <div className="bg-[#172B4D] text-white rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300">
                    Total Recorded Donations
                  </div>
                  <div className="text-3xl font-bold tabular-nums mt-1">
                    {donor.totalDonations}
                  </div>
                  <div className="text-[11px] text-emerald-300 mt-1">
                    Last Donation: {donor.lastDonationDate}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Droplets className="h-6 w-6 text-red-300" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h2 className="text-sm font-bold text-[#172B4D]">
                  Verified Donation History
                </h2>
                {myDonations.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Your verified phlebotomy collections will appear here after your visit.
                  </p>
                ) : (
                  myDonations.map((col) => (
                    <div
                      key={col.id}
                      className="p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172B4D] tabular-nums">
                          {col.unitId}
                        </span>
                        <StatusBadge status={col.processingStatus} />
                      </div>
                      <div className="font-medium text-slate-700">
                        {col.centerName}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                        <span>
                          {col.component} ({col.volumeMl} mL)
                        </span>
                        <span>Date: {col.collectionDate}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SCREEN 6: NOTIFICATIONS & EMERGENCY INVITATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              {acceptedNextStepsRef && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Voluntary Response Recorded ({acceptedNextStepsRef})
                  </div>
                  <p className="leading-relaxed">
                    Next Steps: Please visit <strong>PRC National Blood Center - Port Area, Manila</strong> (Hotline: (02) 8790-2300) with a valid government ID. Qualified personnel will perform confidential medical screening and compatibility verification.
                  </p>
                </div>
              )}

              {/* Section 15: Emergency Donor Invitations Cards */}
              {myRadarInvitations.length > 0 && (
                <div className="space-y-2.5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#C62828]">
                    Emergency Proximity Radar Invitations
                  </h2>
                  {myRadarInvitations.map((inv) => {
                    const bcast = data.radarBroadcasts.find(
                      (b) => b.id === inv.broadcastId
                    );
                    return (
                      <div
                        key={inv.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <StatusBadge status={bcast?.urgency || "Emergency"} />
                          <StatusBadge status={inv.responseStatus} />
                        </div>
                        <div className="text-sm font-bold text-[#172B4D]">
                          {bcast?.hospitalName || "Partner Hospital"}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-[#F5F6F8] p-2.5 rounded-lg">
                          <div>
                            Approx. Distance:{" "}
                            <strong className="tabular-nums">
                              ~{inv.approxDistanceKm} km
                            </strong>
                          </div>
                          <div>
                            Component:{" "}
                            <strong>{bcast?.requestedComponent || "Packed RBC"}</strong>
                          </div>
                          <div className="col-span-2">
                            Required Date:{" "}
                            <strong>{bcast?.requiredDate || "Today"}</strong>
                          </div>
                        </div>

                        {inv.responseStatus === "Pending" && (
                          <BLButton
                            size="sm"
                            variant="primary"
                            className="w-full"
                            onClick={() => setRespondingInvite(inv)}
                          >
                            Respond to Emergency Invitation
                          </BLButton>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* General Mobile Notifications Feed */}
              <div className="space-y-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Activity & Campaign Updates
                </h2>
                {myNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-[#C62828]">
                        {n.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {n.createdAtLabel}
                      </span>
                    </div>
                    <div className="font-bold text-[#172B4D]">{n.title}</div>
                    <p className="text-slate-600 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 7: DONOR PROFILE & PRIVACY SETTINGS (SECTION 15) */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#172B4D]">
                      {donor.fullName}
                    </h2>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {donor.donorCode} • {donor.phone}
                    </p>
                  </div>
                  <BloodTypeBadge bloodType={donor.bloodType} />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F6F8] text-xs">
                  <span className="text-slate-600">Blood Type Verification:</span>
                  <StatusBadge
                    status={
                      donor.bloodTypeVerified
                        ? "Lab Verified"
                        : "Pending Center Verification"
                    }
                  />
                </div>
              </div>

              {/* Dedicated Donor Proximity Radar Privacy Control (Section 15) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#2E7D32]" />
                  <h3 className="text-sm font-bold text-[#172B4D]">
                    Location Discovery & Privacy Settings
                  </h3>
                </div>

                {/* Required Exact Toggle Label */}
                <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-[#172B4D] leading-snug">
                      Allow my approximate location to be used for nearby donor discovery.
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={donor.locationSharingEnabled}
                      onClick={() =>
                        onMutate({
                          action: "update_donor",
                          id: donor.id,
                          locationSharingEnabled: !donor.locationSharingEnabled,
                        })
                      }
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 shrink-0 cursor-pointer ${
                        donor.locationSharingEnabled
                          ? "bg-[#2E7D32]"
                          : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
                          donor.locationSharingEnabled
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    How your location is used: Only an anonymous sector dot ({donor.anonymousToken} in {donor.sectorLabel}) is counted on the Donor Proximity Radar. Your name, phone number, exact home address, and blood type are never shown on the map. You can disable sharing at any time.
                  </p>
                </div>

                {/* Permission to receive emergency donor invitations */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="font-bold text-[#172B4D]">
                      Receive Emergency Donor Invitations
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Voluntary push alerts when nearby hospitals need blood
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={donor.contactInvitationOptIn}
                    onChange={(e) =>
                      onMutate({
                        action: "update_donor",
                        id: donor.id,
                        contactInvitationOptIn: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#C62828] cursor-pointer"
                  />
                </div>

                {/* Notification Preferences */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="font-bold text-[#172B4D]">
                      Appointment & Campaign Reminders
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Receive drive announcements and booking reminders
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={donor.notifyReminders}
                    onChange={(e) =>
                      onMutate({
                        action: "update_donor",
                        id: donor.id,
                        notifyReminders: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-[#C62828] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* VOLUNTARY EMERGENCY INVITATION RESPONSE MODAL SHEET */}
        {respondingInvite && (
          <div className="absolute inset-0 z-40 bg-[#172B4D]/60 flex items-end">
            <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#C62828]">
                    Voluntary Emergency Response
                  </span>
                  <h3 className="text-base font-bold text-[#172B4D]">
                    Respond to {respondingInvite.referenceNumber}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRespondingInvite(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Responding does <strong>not</strong> automatically expose your identity or blood type to the requesting hospital. Screening and verification are conducted by{" "}
                <strong>{respondingInvite.assignedVerificationCenter}</strong>.
              </p>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F5F6F8] border border-slate-200 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentShareCenter}
                  onChange={(e) => setConsentShareCenter(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I voluntarily consent to allow authorized blood center staff to view my donor reference for screening coordination.
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <BLButton
                  variant="secondary"
                  onClick={async () => {
                    await onMutate({
                      action: "respond_radar_invitation",
                      responseId: respondingInvite.id,
                      decision: "Declined",
                      consentToShareDetails: false,
                    });
                    setRespondingInvite(null);
                  }}
                >
                  Decline
                </BLButton>
                <BLButton
                  variant="primary"
                  onClick={async () => {
                    const ref = respondingInvite.referenceNumber;
                    await onMutate({
                      action: "respond_radar_invitation",
                      responseId: respondingInvite.id,
                      decision: "Accepted",
                      consentToShareDetails: consentShareCenter,
                    });
                    setRespondingInvite(null);
                    setAcceptedNextStepsRef(ref);
                    setActiveTab("notifications");
                  }}
                >
                  Accept Invitation
                </BLButton>
              </div>
            </div>
          </div>
        )}

        {/* 5-TAB BOTTOM NAVIGATION BAR */}
        <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 px-2 py-2 grid grid-cols-5 z-20">
          {(
            [
              { key: "home", label: "Home", icon: Home },
              { key: "drives", label: "Find Drives", icon: MapPin },
              { key: "donations", label: "My Donations", icon: Droplets },
              {
                key: "notifications",
                label: "Notifications",
                icon: Bell,
                badge: pendingInvites.length,
              },
              { key: "profile", label: "Profile", icon: User },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`flex flex-col items-center justify-center py-1 rounded-lg relative cursor-pointer ${
                  active ? "text-[#C62828]" : "text-slate-500 hover:text-[#172B4D]"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.9} />
                  {"badge" in item && item.badge ? (
                    <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-[#C62828] text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-[10px] font-semibold mt-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
