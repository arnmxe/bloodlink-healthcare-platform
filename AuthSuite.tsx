"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from "lucide-react";
import { BloodLinkLogo, BLButton, FormInput } from "@/components/ui/BloodLinkUI";
import type { PortalMode } from "@/types/bloodlink";

type AuthScreen = "login" | "forgot" | "reset" | "verify";

export function AuthSuite({
  onAuthenticated,
}: {
  onAuthenticated: (portal: PortalMode, roleLabel: string, hospitalName?: string) => void;
}) {
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [selectedPortal, setSelectedPortal] = useState<"admin" | "hospital" | "mobile">("admin");
  const [email, setEmail] = useState("admin@bloodlink.ph");
  const [password, setPassword] = useState("••••••••••••");
  const [rememberMe, setRememberMe] = useState(true);
  const [hospitalChoice, setHospitalChoice] = useState("Philippine General Hospital (PGH)");
  const [otpDigits, setOtpDigits] = useState(["4", "8", "2", "9", "1", "6"]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusNotice, setStatusNotice] = useState("");

  const applyPreset = (portal: "admin" | "hospital" | "mobile") => {
    setSelectedPortal(portal);
    setStatusNotice("");
    if (portal === "admin") {
      setEmail("admin@bloodlink.ph");
      setPassword("••••••••••••");
    } else if (portal === "hospital") {
      setEmail("transfusion@pgh.gov.ph");
      setPassword("••••••••••••");
    } else {
      setEmail("jmdelacruz@donor.bloodlink.ph");
      setPassword("••••••••••••");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPortal === "admin") {
      onAuthenticated("admin", "Dr. Elena Santos-Reyes, MD (Blood Center Admin)");
    } else if (selectedPortal === "hospital") {
      onAuthenticated("hospital", "Dr. Rafael Bautista, MD (Hospital Transfusion Officer)", hospitalChoice);
    } else {
      onAuthenticated("mobile", "Juan Miguel Dela Cruz (Verified Voluntary Donor)");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left Side: BloodLink Branding & Healthcare Institutional Visual */}
      <div className="lg:col-span-6 bg-[#172B4D] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle clean clinical grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />

        <div className="relative z-10">
          <BloodLinkLogo variant="light" size="lg" showTagline />

          <div className="mt-10 max-w-lg">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-red-300" />
              DOH & Philippine Red Cross Aligned Coordination Standard
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
              Centralized Blood Donation, Inventory & Transfusion Coordination.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Connect voluntary blood donors, regional blood service facilities, and partner hospital blood banks through a secure, privacy-preserving healthcare network.
            </p>
          </div>

          {/* Clean Healthcare System Architecture Visual Card */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-xl">
            <div className="rounded-xl bg-white/8 border border-white/12 p-4">
              <div className="text-xs font-semibold text-red-300 uppercase tracking-wider">
                Cold-Chain Visibility
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums">ISBT-128</div>
              <div className="mt-1 text-xs text-slate-300">
                Full unit traceability from phlebotomy to bedside transfusion
              </div>
            </div>
            <div className="rounded-xl bg-white/8 border border-white/12 p-4">
              <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Donor Privacy
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums">RA 10173</div>
              <div className="mt-1 text-xs text-slate-300">
                Zero blood type or identity exposure on Donor Proximity Radar
              </div>
            </div>
            <div className="rounded-xl bg-white/8 border border-white/12 p-4">
              <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                Clinical Safety
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums">100% RMT</div>
              <div className="mt-1 text-xs text-slate-300">
                Mandatory licensed MedTech crossmatching verification
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-10 pt-6 border-t border-white/12 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>BloodLink Clinical Platform v4.2 • Conventional Deterministic Healthcare System</span>
          <span>24/7 National Blood Service Hotline: (02) 8790-2300</span>
        </div>
      </div>

      {/* Right Side: Authentication Forms */}
      <div className="lg:col-span-6 bg-[#F5F6F8] flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {/*Auth Screen Switcher Pills for UX Demonstration */}
          <div className="flex items-center justify-between gap-1 bg-[#F5F6F8] p-1 rounded-lg border border-slate-200 mb-6 text-[11px] font-semibold">
            {(
              [
                { id: "login", label: "Sign In" },
                { id: "forgot", label: "Forgot Password" },
                { id: "reset", label: "Reset Password" },
                { id: "verify", label: "Verify Account" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setScreen(tab.id);
                  setStatusNotice("");
                }}
                className={`flex-1 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                  screen === tab.id
                    ? "bg-white text-[#172B4D] shadow-2xs"
                    : "text-slate-500 hover:text-[#172B4D]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {screen === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#172B4D]">Sign in to BloodLink</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Select your authorized healthcare role or sign in with institutional credentials.
                </p>
              </div>

              {/* Role-Based Access Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] mb-1.5">
                  Role-Based Portal Access
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset("admin")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPortal === "admin"
                        ? "border-[#C62828] bg-red-50/50 text-[#172B4D]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <UserCheck
                      className={`h-4 w-4 mb-1 ${
                        selectedPortal === "admin" ? "text-[#C62828]" : "text-slate-400"
                      }`}
                    />
                    <div className="text-xs font-bold leading-tight">Blood Center</div>
                    <div className="text-[10px] text-slate-500">Admin & MedTech</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("hospital")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPortal === "hospital"
                        ? "border-[#C62828] bg-red-50/50 text-[#172B4D]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building2
                      className={`h-4 w-4 mb-1 ${
                        selectedPortal === "hospital" ? "text-[#C62828]" : "text-slate-400"
                      }`}
                    />
                    <div className="text-xs font-bold leading-tight">Hospital Portal</div>
                    <div className="text-[10px] text-slate-500">Blood Bank Staff</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("mobile")}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPortal === "mobile"
                        ? "border-[#C62828] bg-red-50/50 text-[#172B4D]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone
                      className={`h-4 w-4 mb-1 ${
                        selectedPortal === "mobile" ? "text-[#C62828]" : "text-slate-400"
                      }`}
                    />
                    <div className="text-xs font-bold leading-tight">Donor App</div>
                    <div className="text-[10px] text-slate-500">Mobile Experience</div>
                  </button>
                </div>
              </div>

              {selectedPortal === "hospital" && (
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                    Assigned Partner Hospital
                  </label>
                  <select
                    value={hospitalChoice}
                    onChange={(e) => setHospitalChoice(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-[#172B4D]"
                  >
                    <option value="Philippine General Hospital (PGH)">
                      Philippine General Hospital (PGH)
                    </option>
                    <option value="St. Luke's Medical Center - Quezon City">
                      St. Luke&apos;s Medical Center - Quezon City
                    </option>
                    <option value="National Kidney and Transplant Institute (NKTI)">
                      National Kidney and Transplant Institute (NKTI)
                    </option>
                    <option value="Makati Medical Center">Makati Medical Center</option>
                  </select>
                </div>
              )}

              <FormInput
                label="Institutional Email Address"
                type="email"
                required
                value={email}
                onChange={setEmail}
                placeholder="name@institution.gov.ph"
              />

              <FormInput
                label="Password"
                type="password"
                required
                value={password}
                onChange={setPassword}
                placeholder="Enter password"
              />

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#C62828] focus:ring-[#C62828]"
                  />
                  Remember me on this workstation
                </label>
                <button
                  type="button"
                  onClick={() => setScreen("forgot")}
                  className="font-semibold text-[#C62828] hover:text-[#8E1B1B] cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <BLButton type="submit" variant="primary" size="lg" className="w-full">
                Sign In to{" "}
                {selectedPortal === "admin"
                  ? "Administrator Dashboard"
                  : selectedPortal === "hospital"
                  ? "Hospital Portal"
                  : "Donor Mobile App"}
              </BLButton>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Need institutional verification?</span>
                <button
                  type="button"
                  onClick={() => setScreen("verify")}
                  className="font-semibold text-[#172B4D] hover:underline cursor-pointer"
                >
                  Verify Account Code →
                </button>
              </div>
            </form>
          )}

          {screen === "forgot" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStatusNotice(
                  `Password recovery instructions dispatched to ${email}. Proceed to Reset Password to complete.`
                );
              }}
              className="space-y-4"
            >
              <div className="h-10 w-10 rounded-xl bg-red-50 text-[#C62828] flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#172B4D]">Forgot Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your verified institutional or donor email address to receive a time-limited password reset link.
                </p>
              </div>

              <FormInput
                label="Registered Email Address"
                type="email"
                required
                value={email}
                onChange={setEmail}
              />

              {statusNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{statusNotice}</span>
                </div>
              )}

              <BLButton type="submit" variant="primary" size="lg" className="w-full">
                Send Recovery Link
              </BLButton>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScreen("login")}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#172B4D] font-semibold cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusNotice("");
                    setScreen("reset");
                  }}
                  className="text-[#C62828] font-semibold hover:underline cursor-pointer"
                >
                  Open Reset Password →
                </button>
              </div>
            </form>
          )}

          {screen === "reset" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStatusNotice("Password updated successfully. You may now sign in with your new credentials.");
              }}
              className="space-y-4"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-[#172B4D] flex items-center justify-center">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#172B4D]">Reset Password</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a strong hospital-grade password (minimum 12 characters, mixed case & symbol).
                </p>
              </div>

              <FormInput
                label="New Password"
                type="password"
                required
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
              />
              <FormInput
                label="Confirm New Password"
                type="password"
                required
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter new password"
              />

              {statusNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{statusNotice}</span>
                </div>
              )}

              <BLButton type="submit" variant="primary" size="lg" className="w-full">
                Save New Password
              </BLButton>

              <button
                type="button"
                onClick={() => setScreen("login")}
                className="w-full text-center text-xs font-semibold text-slate-600 hover:text-[#172B4D] cursor-pointer"
              >
                Return to Sign In
              </button>
            </form>
          )}

          {screen === "verify" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStatusNotice(
                  "Account PRC-MT-014 verified against DOH / PRC Registry. Role-based access enabled."
                );
              }}
              className="space-y-4"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#172B4D]">Account Verification</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit security verification code sent to your institutional email or SMS number.
                </p>
              </div>

              <div className="grid grid-cols-6 gap-2 py-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const copy = [...otpDigits];
                      copy[i] = e.target.value.slice(-1);
                      setOtpDigits(copy);
                    }}
                    className="h-12 text-center text-lg font-bold tabular-nums rounded-lg border border-slate-300 text-[#172B4D] focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 focus:outline-none"
                  />
                ))}
              </div>

              {statusNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#2E7D32] flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{statusNotice}</span>
                </div>
              )}

              <BLButton type="submit" variant="success" size="lg" className="w-full">
                Verify Institutional Account
              </BLButton>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStatusNotice("A fresh 6-digit verification code has been dispatched.")}
                  className="text-[#C62828] font-semibold hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => setScreen("login")}
                  className="text-slate-600 font-semibold hover:text-[#172B4D] cursor-pointer"
                >
                  Proceed to Sign In →
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
