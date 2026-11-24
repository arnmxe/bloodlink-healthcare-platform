"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Inbox,
  Loader2,
  MapPin,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

/**
 * Clean, hospital-grade BloodLink Brand Logo
 */
export function BloodLinkLogo({
  variant = "dark",
  size = "md",
  showTagline = false,
}: {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) {
  const iconBox =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const textClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${iconBox} rounded-lg bg-[#C62828] flex items-center justify-center text-white shadow-sm shrink-0`}
      >
        <Droplets className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} strokeWidth={2.3} />
      </div>
      <div className="leading-tight">
        <div
          className={`font-bold tracking-tight ${textClass} ${
            variant === "light" ? "text-white" : "text-[#172B4D]"
          }`}
        >
          Blood<span className={variant === "light" ? "text-red-300" : "text-[#C62828]"}>Link</span>
        </div>
        {showTagline && (
          <div
            className={`text-[11px] font-medium ${
              variant === "light" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Connecting Donors. Saving Lives.
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Reusable Buttons
 */
export function BLButton({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  className = "",
  title,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "navy" | "ghost" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const sizeStyles = {
    xs: "px-2.5 py-1 text-xs rounded-md gap-1",
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-sm rounded-lg gap-2",
  }[size];

  const variantStyles = {
    primary:
      "bg-[#C62828] hover:bg-[#8E1B1B] active:bg-[#8E1B1B] text-white shadow-xs border border-transparent",
    secondary:
      "bg-white hover:bg-[#F5F6F8] text-[#172B4D] border border-slate-300 shadow-2xs",
    navy:
      "bg-[#172B4D] hover:bg-[#0F1E36] text-white border border-transparent shadow-xs",
    ghost:
      "bg-transparent hover:bg-slate-100 text-[#172B4D] border border-transparent",
    danger:
      "bg-red-50 hover:bg-red-100 text-[#C62828] border border-red-200",
    success:
      "bg-[#2E7D32] hover:bg-green-800 text-white border border-transparent shadow-xs",
  }[variant];

  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Reusable Status Badge with strict Healthcare Color Semantics
 */
export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();

  let bg = "bg-slate-100 text-[#172B4D] border-slate-200";
  let dot = "bg-slate-500";

  if (
    s.includes("available") ||
    s.includes("verified") ||
    s.includes("cleared") ||
    s.includes("completed") ||
    s.includes("accepted") ||
    s.includes("approved") ||
    s.includes("active") ||
    s.includes("compatible") ||
    s.includes("none reported")
  ) {
    bg = "bg-emerald-50 text-[#2E7D32] border-emerald-200";
    dot = "bg-[#2E7D32]";
  } else if (
    s.includes("pending") ||
    s.includes("review") ||
    s.includes("reserved") ||
    s.includes("scheduled") ||
    s.includes("partially") ||
    s.includes("urgent") ||
    s.includes("awaiting") ||
    s.includes("checked in") ||
    s.includes("rescheduled") ||
    s.includes("mild")
  ) {
    bg = "bg-amber-50 text-[#B46900] border-amber-200";
    dot = "bg-[#ED8B00]";
  } else if (
    s.includes("emergency") ||
    s.includes("stat") ||
    s.includes("expired") ||
    s.includes("quarantin") ||
    s.includes("rejected") ||
    s.includes("declined") ||
    s.includes("deferred") ||
    s.includes("reactive") ||
    s.includes("cancelled") ||
    s.includes("discontinued") ||
    s.includes("incompatible")
  ) {
    bg = "bg-red-50 text-[#C62828] border-red-200";
    dot = "bg-[#C62828]";
  } else if (s.includes("released") || s.includes("ready")) {
    bg = "bg-blue-50 text-[#172B4D] border-blue-200";
    dot = "bg-[#172B4D]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${bg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

/**
 * Blood Type Pill Badge (Authorized View Only)
 */
export function BloodTypeBadge({
  bloodType,
  masked = false,
}: {
  bloodType: string;
  masked?: boolean;
}) {
  if (masked) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
        Restricted
      </span>
    );
  }
  const isRare = bloodType.includes("-");
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-md text-xs font-bold tabular-nums border ${
        isRare
          ? "bg-[#C62828]/10 text-[#8E1B1B] border-[#C62828]/25"
          : "bg-[#172B4D]/8 text-[#172B4D] border-[#172B4D]/20"
      }`}
    >
      {bloodType}
    </span>
  );
}

/**
 * Reusable KPI Stat Card
 */
export function StatCard({
  label,
  value,
  subtext,
  icon,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  tone?: "neutral" | "red" | "green" | "orange" | "navy";
  onClick?: () => void;
}) {
  const iconTone = {
    neutral: "bg-slate-100 text-[#172B4D]",
    red: "bg-red-50 text-[#C62828]",
    green: "bg-emerald-50 text-[#2E7D32]",
    orange: "bg-amber-50 text-[#ED8B00]",
    navy: "bg-[#172B4D]/10 text-[#172B4D]",
  }[tone];

  const borderTone =
    tone === "red"
      ? "border-red-200 hover:border-[#C62828]/50"
      : "border-slate-200/90 hover:border-slate-300";

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border ${borderTone} p-4 shadow-2xs transition-all ${
        onClick ? "cursor-pointer hover:shadow-sm" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-[#172B4D] tabular-nums">
            {value}
          </p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconTone}`}>
          {icon}
        </div>
      </div>
      <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">{subtext}</p>
    </div>
  );
}

/**
 * Reusable Search Input
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search records...",
  className = "",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-lg text-[#172B4D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Reusable Text Input Field
 */
export function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  helperText,
}: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#172B4D] mb-1">
        {label} {required && <span className="text-[#C62828]">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-[#172B4D] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"
      />
      {helperText && <p className="mt-1 text-[11px] text-slate-500">{helperText}</p>}
    </div>
  );
}

/**
 * Reusable Dropdown Selector
 */
export function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  required?: boolean;
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[#172B4D] mb-1">
          {label} {required && <span className="text-[#C62828]">*</span>}
        </label>
      )}
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 focus:border-[#C62828]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Reusable Modal Dialog
 */
export function BLModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172B4D]/55 backdrop-blur-[1px]">
      <div
        className={`bg-white rounded-xl border border-slate-200 shadow-xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-white">
          <div>
            <h3 className="text-base font-bold text-[#172B4D]">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#172B4D] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/**
 * Reusable Confirmation Dialog
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm Action",
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <BLModal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              danger ? "bg-red-50 text-[#C62828]" : "bg-amber-50 text-[#ED8B00]"
            }`}
          >
            <ShieldAlert className="h-5 w-5" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <BLButton variant="secondary" onClick={onClose}>
            Cancel
          </BLButton>
          <BLButton
            variant={danger ? "primary" : "navy"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </BLButton>
        </div>
      </div>
    </BLModal>
  );
}

/**
 * Reusable Pagination Controls
 */
export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (next: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
      <span className="tabular-nums">
        Showing <strong className="text-[#172B4D]">{start}</strong>–
        <strong className="text-[#172B4D]">{end}</strong> of{" "}
        <strong className="text-[#172B4D]">{totalItems}</strong> records
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white text-[#172B4D] font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>
        <span className="px-2 font-semibold text-[#172B4D] tabular-nums">
          Page {page} / {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white text-[#172B4D] font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Empty State, Loading State, and Error Banner
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-12 px-6 text-center bg-white rounded-xl border border-dashed border-slate-300">
      <div className="h-11 w-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
        <Inbox className="h-5 w-5" />
      </div>
      <h4 className="text-sm font-bold text-[#172B4D]">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Synchronizing clinical blood bank records..." }: { label?: string }) {
  return (
    <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
      <Loader2 className="h-7 w-7 text-[#C62828] animate-spin mb-3" />
      <p className="text-sm font-semibold text-[#172B4D]">{label}</p>
      <p className="text-xs text-slate-500 mt-1">Encrypted connection to BloodLink PostgreSQL Registry</p>
    </div>
  );
}

export function ErrorAlert({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-xs text-[#8E1B1B] font-medium">
        <AlertCircle className="h-4 w-4 text-[#C62828] shrink-0" />
        <span>{message}</span>
      </div>
      {onRetry && (
        <BLButton size="xs" variant="secondary" onClick={onRetry}>
          Retry
        </BLButton>
      )}
    </div>
  );
}

/**
 * Part D: Reusable Design System Interactive Showcase
 */
export function DesignSystemShowcase() {
  const [sampleSearch, setSampleSearch] = React.useState("");
  const [sampleDate, setSampleDate] = React.useState("2026-04-14");
  const [sampleSelect, setSampleSelect] = React.useState("Packed RBC");
  const [demoModal, setDemoModal] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-[#172B4D]">
          BloodLink Healthcare UI Design System (Part D)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Standardized hospital-grade tokens, color semantics, reusable form controls, privacy-preserving map markers, and status indicators shared across Web Admin, Hospital Portal, and Donor Mobile App.
        </p>

        {/* Color Palette */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { name: "Primary Red", hex: "#C62828", bg: "bg-[#C62828]", text: "text-white", use: "Primary Actions" },
            { name: "Dark Red", hex: "#8E1B1B", bg: "bg-[#8E1B1B]", text: "text-white", use: "Active / Emphasis" },
            { name: "Navy", hex: "#172B4D", bg: "bg-[#172B4D]", text: "text-white", use: "Sidebar & Headings" },
            { name: "Verified Green", hex: "#2E7D32", bg: "bg-[#2E7D32]", text: "text-white", use: "Cleared / Available" },
            { name: "Warning Orange", hex: "#ED8B00", bg: "bg-[#ED8B00]", text: "text-white", use: "Pending / Reserved" },
            { name: "Light Gray", hex: "#F5F6F8", bg: "bg-[#F5F6F8] border border-slate-200", text: "text-[#172B4D]", use: "Canvas Background" },
            { name: "Pure White", hex: "#FFFFFF", bg: "bg-white border border-slate-200", text: "text-[#172B4D]", use: "Card Surfaces" },
          ].map((c) => (
            <div key={c.hex} className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              <div className={`h-12 ${c.bg} ${c.text} flex items-end px-2.5 py-1.5 text-[11px] font-bold tabular-nums`}>
                {c.hex}
              </div>
              <div className="p-2.5">
                <div className="text-xs font-bold text-[#172B4D]">{c.name}</div>
                <div className="text-[11px] text-slate-500">{c.use}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons, Badges & Map Markers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#172B4D]">Buttons & Interactive Dialogs</h3>
          <div className="flex flex-wrap gap-2.5">
            <BLButton variant="primary">Primary Action</BLButton>
            <BLButton variant="secondary">Secondary Outline</BLButton>
            <BLButton variant="navy">Clinical Navy</BLButton>
            <BLButton variant="success">Verify & Clear</BLButton>
            <BLButton variant="danger">Quarantine Alert</BLButton>
            <BLButton variant="secondary" onClick={() => setDemoModal(true)}>
              Open Sample Modal
            </BLButton>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2.5">Status Badges</h4>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Available" />
              <StatusBadge status="Verified" />
              <StatusBadge status="Pending" />
              <StatusBadge status="Reserved" />
              <StatusBadge status="Released" />
              <StatusBadge status="Quarantined" />
              <StatusBadge status="Expired" />
              <StatusBadge status="Emergency" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#172B4D]">Inputs, Selectors, Date Pickers & Radar Markers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchBar value={sampleSearch} onChange={setSampleSearch} placeholder="Search unit or donor ID..." />
            <FormInput label="Collection Date Picker" type="date" value={sampleDate} onChange={setSampleDate} />
            <FormSelect
              label="Blood Component Selector"
              value={sampleSelect}
              onChange={setSampleSelect}
              options={[
                { label: "Packed RBC", value: "Packed RBC" },
                { label: "Platelet Concentrate", value: "Platelet Concentrate" },
                { label: "Fresh Frozen Plasma", value: "Fresh Frozen Plasma" },
              ]}
            />
            <div>
              <span className="block text-xs font-semibold text-[#172B4D] mb-1.5">Anonymous Radar Markers</span>
              <div className="flex items-center gap-4 pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="h-3.5 w-3.5 rounded-full bg-[#C62828] ring-4 ring-[#C62828]/20 inline-block" />
                  Opted-In Donor
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="h-3.5 w-3.5 rounded-full bg-slate-500 ring-4 ring-slate-300/50 inline-block" />
                  Discovery Only
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#172B4D]">
                  <MapPin className="h-4 w-4 text-[#172B4D]" /> Hospital Hub
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback & Empty States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#172B4D]">Notification & Clinical Alert States</h3>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-[#2E7D32] font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Crossmatching verified manually by licensed Medical Technologist.
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-[#B46900] font-medium">
            <Clock className="h-4 w-4 shrink-0" />
            Cold-chain transport validation expires in 35 minutes.
          </div>
          <ErrorAlert message="Sample Error State: Unable to verify barcode scan checksum." />
        </div>
        <EmptyState
          title="Sample Empty State Component"
          description="Displayed when filtered blood inventory queries or donor search filters return zero matching records."
        />
      </div>

      <BLModal
        open={demoModal}
        onClose={() => setDemoModal(false)}
        title="Reusable Clinical Modal Dialog"
        subtitle="Standardized accessible dialog container used across BloodLink modules."
      >
        <p className="text-sm text-slate-600">
          All BloodLink forms, release slips, screening verifications, and emergency radar broadcasts use this consistent modal hierarchy.
        </p>
        <div className="mt-4 flex justify-end">
          <BLButton onClick={() => setDemoModal(false)}>Close Preview</BLButton>
        </div>
      </BLModal>
    </div>
  );
}
