"use client";

import React, { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Compass,
  Crosshair,
  Layers,
  Lock,
  Map as MapIcon,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  BLButton,
  BLModal,
  FormInput,
  FormSelect,
  StatusBadge,
} from "@/components/ui/BloodLinkUI";
import {
  BLOOD_COMPONENTS,
  haversineKm,
  PARTNER_HOSPITALS,
} from "@/lib/bloodlink-utils";
import type {
  BloodCenter,
  RadarAnonymousMarker,
  RadarBroadcast,
  RadarResponse,
} from "@/types/bloodlink";

const RADIUS_OPTIONS = [5, 10, 15, 20, 30] as const;

interface OriginHub {
  name: string;
  type: "Hospital" | "Blood Center";
  city: string;
  lat: number;
  lng: number;
}

interface MarkerWithDist extends RadarAnonymousMarker {
  distanceKm: number;
  inRadius: boolean;
}

interface ClusterGroup {
  id: string;
  lat: number;
  lng: number;
  count: number;
  optedInCount: number;
  sectorHint: string;
  members: MarkerWithDist[];
}

export function DonorProximityRadar({
  markers,
  bloodCenters,
  broadcasts,
  responses,
  defaultHospitalName,
  actorName,
  onSendBroadcast,
}: {
  markers: RadarAnonymousMarker[];
  bloodCenters: BloodCenter[];
  broadcasts: RadarBroadcast[];
  responses: RadarResponse[];
  defaultHospitalName?: string;
  actorName: string;
  onSendBroadcast: (payload: {
    referenceNumber: string;
    hospitalName: string;
    originLat: number;
    originLng: number;
    radiusKm: number;
    requestedComponent: string;
    requiredQuantity: number;
    urgency: string;
    requiredDate: string;
    invitationMessage: string;
    createdBy: string;
  }) => Promise<void>;
}) {
  // Build selectable Hospital & Blood Center origin hubs
  const originHubs = useMemo<OriginHub[]>(() => {
    const hospHubs: OriginHub[] = PARTNER_HOSPITALS.map((h) => ({
      name: h.name,
      type: "Hospital",
      city: h.city,
      lat: h.lat,
      lng: h.lng,
    }));
    const centerHubs: OriginHub[] = bloodCenters.map((c) => ({
      name: c.name,
      type: "Blood Center",
      city: c.city,
      lat: c.lat,
      lng: c.lng,
    }));
    return [...hospHubs, ...centerHubs];
  }, [bloodCenters]);

  const initialHub =
    originHubs.find((h) => h.name === defaultHospitalName) || originHubs[0];

  const [selectedHubName, setSelectedHubName] = useState<string>(
    initialHub?.name || "Philippine General Hospital (PGH)"
  );
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [mapStyle, setMapStyle] = useState<"map" | "satellite">("map");
  const [clusteringEnabled, setClusteringEnabled] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.25);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedAnonymousMarker, setSelectedAnonymousMarker] =
    useState<MarkerWithDist | null>(null);

  // Emergency Broadcast Modal State
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastToast, setBroadcastToast] = useState("");
  const [refNumber, setRefNumber] = useState("RDR-EMG-2026-104");
  const [reqComponent, setReqComponent] = useState<string>("Packed RBC");
  const [reqQuantity, setReqQuantity] = useState<string>("4");
  const [reqUrgency, setReqUrgency] = useState<string>("Emergency");
  const [reqDate, setReqDate] = useState<string>("2026-04-12 • Within 6 Hours");
  const [inviteMsg, setInviteMsg] = useState<string>(
    "Urgent hospital need for voluntary blood donation. Your identity, blood type, and exact location remain strictly confidential. Please respond only if healthy and available for screening at an accredited blood center."
  );

  // Consented Responders Modal
  const [respondersModalOpen, setRespondersModalOpen] = useState(false);

  const activeHub = useMemo(() => {
    return (
      originHubs.find((h) => h.name === selectedHubName) || {
        name: "Philippine General Hospital (PGH)",
        type: "Hospital" as const,
        city: "Ermita, Manila",
        lat: 14.5777,
        lng: 120.9854,
      }
    );
  }, [originHubs, selectedHubName]);

  // Filter hubs when user searches location
  const matchingHubs = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return [];
    return originHubs.filter(
      (h) =>
        h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q)
    );
  }, [locationQuery, originHubs]);

  // Compute distance from active hub for each anonymous donor marker
  const computedMarkers = useMemo<MarkerWithDist[]>(() => {
    return markers.map((m) => {
      const dist = haversineKm(
        activeHub.lat,
        activeHub.lng,
        m.approxLat,
        m.approxLng
      );
      return {
        ...m,
        distanceKm: dist,
        inRadius: dist <= radiusKm,
      };
    });
  }, [markers, activeHub, radiusKm]);

  const nearbyMarkers = useMemo(
    () => computedMarkers.filter((m) => m.inRadius),
    [computedMarkers]
  );

  const optedInContactCount = useMemo(
    () => nearbyMarkers.filter((m) => m.contactInvitationOptIn).length,
    [nearbyMarkers]
  );

  const totalResponsesCount = useMemo(() => {
    return responses.filter((r) => r.responseStatus !== "Pending").length;
  }, [responses]);

  const consentedAcceptedResponses = useMemo(() => {
    return responses.filter(
      (r) => r.responseStatus === "Accepted" && r.consentToShareDetails
    );
  }, [responses]);

  // Project lat/lng onto local SVG canvas centered on activeHub (800x560 viewBox)
  // 1 degree lat ≈ 111.1 km; 1 degree lng at 14.6°N ≈ 107.5 km
  const kmToPx = 11.2 * zoom;

  const projectCoord = (lat: number, lng: number) => {
    const dxKm = (lng - activeHub.lng) * 107.5;
    const dyKm = (activeHub.lat - lat) * 111.1;
    return {
      x: 400 + dxKm * kmToPx + pan.x,
      y: 280 + dyKm * kmToPx + pan.y,
    };
  };

  // Optional marker clustering when enabled and zoom < 1.85
  const renderedClustersOrMarkers = useMemo(() => {
    if (!clusteringEnabled || zoom >= 1.85) {
      return { clusters: [] as ClusterGroup[], singles: computedMarkers };
    }
    const thresholdKm = zoom <= 1.0 ? 4.2 : 2.6;
    const clusters: ClusterGroup[] = [];
    const singles: MarkerWithDist[] = [];
    const visited = new Set<number>();

    for (const m of computedMarkers) {
      if (visited.has(m.id)) continue;
      const neighbors = computedMarkers.filter(
        (other) =>
          !visited.has(other.id) &&
          haversineKm(m.approxLat, m.approxLng, other.approxLat, other.approxLng) <=
            thresholdKm
      );
      if (neighbors.length >= 2) {
        neighbors.forEach((n) => visited.add(n.id));
        const avgLat =
          neighbors.reduce((acc, n) => acc + n.approxLat, 0) / neighbors.length;
        const avgLng =
          neighbors.reduce((acc, n) => acc + n.approxLng, 0) / neighbors.length;
        clusters.push({
          id: `CL-${m.id}`,
          lat: avgLat,
          lng: avgLng,
          count: neighbors.length,
          optedInCount: neighbors.filter((n) => n.contactInvitationOptIn).length,
          sectorHint: m.sectorLabel,
          members: neighbors,
        });
      } else {
        visited.add(m.id);
        singles.push(m);
      }
    }
    return { clusters, singles };
  }, [clusteringEnabled, zoom, computedMarkers]);

  const openBroadcastModal = () => {
    const nextNum = Math.floor(110 + Math.random() * 880);
    setRefNumber(`RDR-EMG-2026-${nextNum}`);
    setBroadcastModalOpen(true);
  };

  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBroadcast(true);
    try {
      await onSendBroadcast({
        referenceNumber: refNumber,
        hospitalName: activeHub.name,
        originLat: activeHub.lat,
        originLng: activeHub.lng,
        radiusKm,
        requestedComponent: reqComponent,
        requiredQuantity: Number(reqQuantity) || 4,
        urgency: reqUrgency,
        requiredDate: reqDate,
        invitationMessage: inviteMsg,
        createdBy: actorName,
      });
      setBroadcastModalOpen(false);
      setBroadcastToast(
        `Emergency invitation ${refNumber} transmitted to ${optedInContactCount} opted-in anonymous donors within ${radiusKm} KM.`
      );
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  // Metro Manila geographic district reference labels for realistic cartography
  const metroLabels = [
    { name: "MANILA", lat: 14.5995, lng: 120.9842 },
    { name: "QUEZON CITY", lat: 14.6507, lng: 121.0494 },
    { name: "MAKATI", lat: 14.5547, lng: 121.0244 },
    { name: "PASIG", lat: 14.5764, lng: 121.0851 },
    { name: "TAGUIG / BGC", lat: 14.5243, lng: 121.0542 },
    { name: "MANDALUYONG", lat: 14.5794, lng: 121.0359 },
    { name: "PASAY", lat: 14.5378, lng: 121.0014 },
    { name: "SAN JUAN", lat: 14.6019, lng: 121.0355 },
    { name: "MARIKINA", lat: 14.6507, lng: 121.1029 },
    { name: "PARAÑAQUE", lat: 14.4793, lng: 121.0198 },
    { name: "CALOOCAN", lat: 14.6571, lng: 120.9841 },
    { name: "MUNTINLUPA", lat: 14.4181, lng: 121.0415 },
  ];

  // Major highway corridors (EDSA, C-5, Taft/R-2, Commonwealth/Quezon Ave)
  const edsaCoords: [number, number][] = [
    [14.6575, 120.988],
    [14.654, 121.031],
    [14.621, 121.051],
    [14.585, 121.056],
    [14.554, 121.028],
    [14.537, 120.992],
  ];
  const c5Coords: [number, number][] = [
    [14.668, 121.069],
    [14.612, 121.079],
    [14.572, 121.072],
    [14.532, 121.055],
    [14.485, 121.038],
  ];
  const pasigRiverCoords: [number, number][] = [
    [14.595, 120.958],
    [14.593, 120.985],
    [14.584, 121.012],
    [14.568, 121.038],
    [14.562, 121.068],
    [14.551, 121.095],
  ];

  const toPath = (pts: [number, number][]) =>
    pts
      .map(([lat, lng], i) => {
        const p = projectCoord(lat, lng);
        return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ");

  const hubPx = projectCoord(activeHub.lat, activeHub.lng);
  const radiusPx = radiusKm * kmToPx;

  return (
    <div className="space-y-4">
      {/* Top Action & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-3">
          {/* Origin Hospital / Blood Center Selector */}
          <div className="min-w-[260px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Monitoring Origin (Hospital / Blood Center)
            </label>
            <select
              value={selectedHubName}
              onChange={(e) => {
                setSelectedHubName(e.target.value);
                setPan({ x: 0, y: 0 });
                setSelectedAnonymousMarker(null);
              }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-[#F5F6F8] border border-slate-300 rounded-lg text-[#172B4D] focus:outline-none focus:border-[#C62828]"
            >
              {originHubs.map((hub) => (
                <option key={hub.name} value={hub.name}>
                  [{hub.type}] {hub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Location Input */}
          <div className="relative min-w-[210px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Location
            </label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Search hospital or city..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-[#172B4D] focus:outline-none focus:border-[#C62828]"
              />
            </div>
            {matchingHubs.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-lg border border-slate-200 shadow-lg max-h-48 overflow-y-auto">
                {matchingHubs.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => {
                      setSelectedHubName(m.name);
                      setLocationQuery("");
                      setPan({ x: 0, y: 0 });
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center justify-between border-b border-slate-100 last:border-none cursor-pointer"
                  >
                    <span className="font-semibold text-[#172B4D] truncate">{m.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2 shrink-0">{m.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selectable Distance Radius Filters: 5, 10, 15, 20, 30 KM */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Search Radius Filter
            </label>
            <div className="inline-flex items-center bg-[#F5F6F8] p-0.5 rounded-lg border border-slate-200">
              {RADIUS_OPTIONS.map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setRadiusKm(km)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md tabular-nums transition-colors cursor-pointer ${
                    radiusKm === km
                      ? "bg-[#172B4D] text-white shadow-2xs"
                      : "text-slate-600 hover:text-[#172B4D]"
                  }`}
                >
                  {km} KM
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Request Activation Button */}
        <div className="flex items-center gap-2.5 self-start xl:self-end">
          <BLButton
            variant="secondary"
            size="md"
            onClick={() => setRespondersModalOpen(true)}
          >
            <Users className="h-4 w-4 text-[#2E7D32]" />
            Consented Responders ({consentedAcceptedResponses.length})
          </BLButton>
          <BLButton variant="primary" size="md" onClick={openBroadcastModal}>
            <Radio className="h-4 w-4" />
            Activate Emergency Donor Invitation
          </BLButton>
        </div>
      </div>

      {broadcastToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-[#2E7D32] font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{broadcastToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setBroadcastToast("")}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 70% Map / 30% Aggregated Information Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 70% Interactive Map Canvas (8 of 12 cols on lg+) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          {/* Map Header Bar & View Controls */}
          <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2E7D32]" />
              <span className="text-xs font-bold text-[#172B4D]">
                Donor Proximity Radar — Approximate Sector View
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/70 text-[10px] font-semibold text-[#172B4D]">
                <Lock className="h-3 w-3" /> Zero PII / Blood Type Masked
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Clustering Toggle */}
              <button
                type="button"
                onClick={() => setClusteringEnabled(!clusteringEnabled)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                  clusteringEnabled
                    ? "bg-[#172B4D] text-white border-[#172B4D]"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Clustering: {clusteringEnabled ? "On" : "Off"}
              </button>

              {/* Map vs Satellite View Toggle */}
              <div className="inline-flex rounded-md border border-slate-300 overflow-hidden bg-white text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMapStyle("map")}
                  className={`px-2.5 py-1 inline-flex items-center gap-1 cursor-pointer ${
                    mapStyle === "map"
                      ? "bg-[#C62828] text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MapIcon className="h-3 w-3" /> Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapStyle("satellite")}
                  className={`px-2.5 py-1 inline-flex items-center gap-1 cursor-pointer ${
                    mapStyle === "satellite"
                      ? "bg-[#C62828] text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Compass className="h-3 w-3" /> Satellite
                </button>
              </div>
            </div>
          </div>

          {/* Interactive SVG Cartographic Viewport */}
          <div
            className={`relative h-[500px] sm:h-[560px] select-none overflow-hidden ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            } ${mapStyle === "satellite" ? "bg-[#0F1B2D]" : "bg-[#EEF2F6]"}`}
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragOrigin({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            }}
            onMouseMove={(e) => {
              if (!isDragging) return;
              setPan({
                x: e.clientX - dragOrigin.x,
                y: e.clientY - dragOrigin.y,
              });
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <svg
              viewBox="0 0 800 560"
              className="w-full h-full block"
              aria-label="Donor Proximity Radar Interactive Map"
            >
              {/* Coordinate Grid */}
              <defs>
                <pattern
                  id="radarGrid"
                  width="48"
                  height="48"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 48 0 L 0 0 0 48"
                    fill="none"
                    stroke={
                      mapStyle === "satellite"
                        ? "rgba(148, 163, 184, 0.12)"
                        : "rgba(15, 23, 42, 0.06)"
                    }
                    strokeWidth="1"
                  />
                </pattern>
              </defs>

              {/* Manila Bay Western Coastline Polygon */}
              {(() => {
                const bayPts: [number, number][] = [
                  [14.75, 120.82],
                  [14.72, 120.945],
                  [14.63, 120.958],
                  [14.585, 120.968],
                  [14.55, 120.98],
                  [14.51, 120.982],
                  [14.44, 120.965],
                  [14.35, 120.92],
                  [14.35, 120.82],
                ];
                const d =
                  bayPts
                    .map(([lat, lng], i) => {
                      const p = projectCoord(lat, lng);
                      return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                    })
                    .join(" ") + " Z";
                return (
                  <path
                    d={d}
                    fill={mapStyle === "satellite" ? "#091322" : "#CBDDF0"}
                  />
                );
              })()}

              {/* Laguna de Bay Southeastern Shoreline */}
              {(() => {
                const lakePts: [number, number][] = [
                  [14.54, 121.095],
                  [14.51, 121.072],
                  [14.44, 121.055],
                  [14.37, 121.055],
                  [14.37, 121.22],
                  [14.55, 121.22],
                ];
                const d =
                  lakePts
                    .map(([lat, lng], i) => {
                      const p = projectCoord(lat, lng);
                      return `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
                    })
                    .join(" ") + " Z";
                return (
                  <path
                    d={d}
                    fill={mapStyle === "satellite" ? "#0A1526" : "#D2E3F3"}
                  />
                );
              })()}

              <rect width="800" height="560" fill="url(#radarGrid)" />

              {/* Pasig River Waterway */}
              <path
                d={toPath(pasigRiverCoords)}
                fill="none"
                stroke={mapStyle === "satellite" ? "#1E3A5F" : "#B4CFE8"}
                strokeWidth={Math.max(4, 5 * zoom)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Major Arterial Corridors (EDSA & C-5) */}
              <path
                d={toPath(edsaCoords)}
                fill="none"
                stroke={
                  mapStyle === "satellite"
                    ? "rgba(251, 191, 36, 0.32)"
                    : "rgba(255, 255, 255, 0.9)"
                }
                strokeWidth={Math.max(2.5, 3.5 * zoom)}
                strokeLinecap="round"
              />
              <path
                d={toPath(c5Coords)}
                fill="none"
                stroke={
                  mapStyle === "satellite"
                    ? "rgba(251, 191, 36, 0.24)"
                    : "rgba(255, 255, 255, 0.75)"
                }
                strokeWidth={Math.max(2, 2.8 * zoom)}
                strokeLinecap="round"
              />

              {/* District Labels */}
              {metroLabels.map((lbl) => {
                const pos = projectCoord(lbl.lat, lbl.lng);
                return (
                  <text
                    key={lbl.name}
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    fill={
                      mapStyle === "satellite"
                        ? "rgba(203, 213, 225, 0.42)"
                        : "rgba(23, 43, 77, 0.36)"
                    }
                    fontSize="10"
                    fontWeight="700"
                    letterSpacing="1.2"
                  >
                    {lbl.name}
                  </text>
                );
              })}

              {/* Manila Bay Label */}
              {(() => {
                const bayText = projectCoord(14.565, 120.935);
                return (
                  <text
                    x={bayText.x}
                    y={bayText.y}
                    textAnchor="middle"
                    fill={
                      mapStyle === "satellite"
                        ? "rgba(125, 211, 252, 0.35)"
                        : "rgba(30, 64, 175, 0.35)"
                    }
                    fontSize="11"
                    fontStyle="italic"
                    fontWeight="600"
                  >
                    Manila Bay
                  </text>
                );
              })()}

              {/* Inner Half-Radius Guide Ring */}
              <circle
                cx={hubPx.x}
                cy={hubPx.y}
                r={radiusPx / 2}
                fill="none"
                stroke={
                  mapStyle === "satellite"
                    ? "rgba(239, 68, 68, 0.28)"
                    : "rgba(198, 40, 40, 0.2)"
                }
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Active Search Radius Visualization Circle */}
              <circle
                cx={hubPx.x}
                cy={hubPx.y}
                r={radiusPx}
                fill={
                  mapStyle === "satellite"
                    ? "rgba(198, 40, 40, 0.11)"
                    : "rgba(198, 40, 40, 0.07)"
                }
                stroke="#C62828"
                strokeWidth="2"
                strokeDasharray="7 5"
              />

              {/* Radius Rim Label */}
              <g transform={`translate(${hubPx.x}, ${hubPx.y - radiusPx - 8})`}>
                <rect
                  x="-36"
                  y="-11"
                  width="72"
                  height="18"
                  rx="9"
                  fill="#C62828"
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="700"
                >
                  {radiusKm} KM RING
                </text>
              </g>

              {/* PRC Blood Center Hub Icons */}
              {bloodCenters.map((bc) => {
                const p = projectCoord(bc.lat, bc.lng);
                return (
                  <g
                    key={bc.id}
                    transform={`translate(${p.x}, ${p.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedHubName(bc.name);
                      setPan({ x: 0, y: 0 });
                    }}
                  >
                    <rect
                      x="-8"
                      y="-8"
                      width="16"
                      height="16"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#172B4D"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M -3.5 0 H 3.5 M 0 -3.5 V 3.5"
                      stroke="#C62828"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Anonymous Clustered Donor Groups (NO Blood Types, NO Names) */}
              {renderedClustersOrMarkers.clusters.map((cl) => {
                const p = projectCoord(cl.lat, cl.lng);
                const distFromHub = haversineKm(
                  activeHub.lat,
                  activeHub.lng,
                  cl.lat,
                  cl.lng
                );
                const inRange = distFromHub <= radiusKm;
                return (
                  <g
                    key={cl.id}
                    transform={`translate(${p.x}, ${p.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom((z) => Math.min(3.2, z + 0.75));
                    }}
                  >
                    <circle
                      r="18"
                      fill={
                        inRange
                          ? "rgba(198, 40, 40, 0.2)"
                          : "rgba(100, 116, 139, 0.2)"
                      }
                    />
                    <circle
                      r="13"
                      fill={inRange ? "#C62828" : "#64748B"}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="700"
                    >
                      {cl.count}
                    </text>
                  </g>
                );
              })}

              {/* Anonymous Individual Donor Markers (Strictly Approximate & Privacy-Preserving) */}
              {renderedClustersOrMarkers.singles.map((m) => {
                const p = projectCoord(m.approxLat, m.approxLng);
                const isSelected = selectedAnonymousMarker?.id === m.id;
                const fill = !m.inRadius
                  ? "#94A3B8"
                  : m.contactInvitationOptIn
                  ? "#C62828"
                  : "#475569";

                return (
                  <g
                    key={m.id}
                    transform={`translate(${p.x}, ${p.y})`}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAnonymousMarker(m);
                    }}
                  >
                    {m.inRadius && (
                      <circle
                        r={isSelected ? "14" : "10"}
                        fill={
                          m.contactInvitationOptIn
                            ? "rgba(198, 40, 40, 0.2)"
                            : "rgba(71, 85, 105, 0.18)"
                        }
                      />
                    )}
                    <circle
                      r={isSelected ? "7" : "5.5"}
                      fill={fill}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </g>
                );
              })}

              {/* Active Origin Hospital / Blood Center Pin */}
              <g transform={`translate(${hubPx.x}, ${hubPx.y})`}>
                <circle r="20" fill="rgba(23, 43, 77, 0.16)" />
                <circle
                  r="11"
                  fill="#172B4D"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
                <circle r="4" fill="#FFFFFF" />
                <g transform="translate(0, 24)">
                  <rect
                    x="-92"
                    y="-9"
                    width="184"
                    height="18"
                    rx="5"
                    fill="#172B4D"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="700"
                  >
                    {activeHub.name.slice(0, 28)}
                  </text>
                </g>
              </g>
            </svg>

            {/* Floating Zoom & Recenter Map Controls (Top-Right of Map) */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-white/95 backdrop-blur-xs p-1.5 rounded-xl border border-slate-200 shadow-md">
              <button
                type="button"
                title="Zoom In"
                onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.35).toFixed(2)))}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#172B4D] hover:bg-slate-100 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Zoom Out"
                onClick={() => setZoom((z) => Math.max(0.65, +(z - 0.35).toFixed(2)))}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#172B4D] hover:bg-slate-100 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="h-px bg-slate-200 my-0.5" />
              <button
                type="button"
                title="Recenter on Hospital / Blood Center"
                onClick={() => {
                  setPan({ x: 0, y: 0 });
                  setZoom(1.25);
                }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-[#C62828] hover:bg-red-50 cursor-pointer"
              >
                <Crosshair className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Anonymous Marker Privacy Popover (Bottom-Left) */}
            {selectedAnonymousMarker && (
              <div className="absolute bottom-3 left-3 max-w-xs bg-white/98 backdrop-blur-xs rounded-xl border border-slate-200 shadow-lg p-3.5 text-xs">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="font-bold text-[#172B4D] tabular-nums">
                    Token: {selectedAnonymousMarker.anonymousToken}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAnonymousMarker(null)}
                    className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1 text-slate-600">
                  <div>
                    Approximate Sector:{" "}
                    <strong className="text-[#172B4D]">
                      {selectedAnonymousMarker.sectorLabel}
                    </strong>
                  </div>
                  <div className="tabular-nums">
                    Approx. Distance:{" "}
                    <strong className="text-[#172B4D]">
                      ~{selectedAnonymousMarker.distanceKm} km from hub
                    </strong>
                  </div>
                  <div>
                    Contact Invitation Opt-In:{" "}
                    <strong
                      className={
                        selectedAnonymousMarker.contactInvitationOptIn
                          ? "text-[#2E7D32]"
                          : "text-slate-500"
                      }
                    >
                      {selectedAnonymousMarker.contactInvitationOptIn
                        ? "Opted In"
                        : "Discovery Only"}
                    </strong>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2E7D32] shrink-0" />
                  Identity, phone & blood type hidden per BloodLink Privacy Protocol.
                </div>
              </div>
            )}

            {/* Map Legend (Bottom-Right) */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs rounded-xl border border-slate-200 shadow-sm px-3 py-2 text-[11px] text-[#172B4D] flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="h-3 w-3 rounded-full bg-[#C62828] inline-block" />
                Opted-In Donor
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="h-3 w-3 rounded-full bg-slate-600 inline-block" />
                Discovery Only
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="h-3 w-3 rounded-full bg-[#172B4D] inline-block" />
                Selected Hub
              </span>
            </div>
          </div>
        </div>

        {/* 30% Right-Side Aggregated Information Panel (Strictly NO Blood Types or PII) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">
                  Proximity Radar Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated anonymous donor telemetry around{" "}
                  <strong className="text-[#172B4D]">{activeHub.name}</strong>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#172B4D] text-white text-xs font-bold tabular-nums">
                {radiusKm} KM
              </span>
            </div>

            {/* 4 Required Aggregated Metrics (Zero Blood Types Displayed!) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">
                  Anonymous Nearby Donors
                </div>
                <div className="mt-1 text-2xl font-bold text-[#172B4D] tabular-nums">
                  {nearbyMarkers.length}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  Within {radiusKm} KM radius
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-100">
                <div className="text-[11px] font-semibold text-[#8E1B1B]">
                  Opted Into Invitations
                </div>
                <div className="mt-1 text-2xl font-bold text-[#C62828] tabular-nums">
                  {optedInContactCount}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  Reachable via push invite
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-[11px] font-semibold text-[#2E7D32]">
                  Invitation Responses
                </div>
                <div className="mt-1 text-2xl font-bold text-[#2E7D32] tabular-nums">
                  {totalResponsesCount}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  Voluntary donor replies
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F5F6F8] border border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500">
                  Selected Search Radius
                </div>
                <div className="mt-1 text-2xl font-bold text-[#172B4D] tabular-nums">
                  {radiusKm} km
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500">
                  Geodesic sector ring
                </div>
              </div>
            </div>

            {/* Privacy Safeguard Callout */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#172B4D]">
                <ShieldCheck className="h-4 w-4 text-[#2E7D32]" />
                Donor Privacy & Clinical Verification Protocol
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                This radar intentionally omits blood types, donor names, phone numbers, and exact home addresses. Compatibility and medical eligibility are verified strictly by qualified blood center personnel after voluntary donor response.
              </p>
            </div>

            <BLButton
              variant="primary"
              size="md"
              className="w-full"
              onClick={openBroadcastModal}
            >
              <Send className="h-4 w-4" />
              Send Invitation to {optedInContactCount} Opted-In Donors
            </BLButton>
          </div>

          {/* Active Emergency Broadcast Log */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Active Emergency Donor Broadcasts
            </h4>
            <div className="space-y-2.5 max-h-[225px] overflow-y-auto pr-1">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg border border-slate-200 bg-[#F5F6F8]/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#172B4D] tabular-nums">
                      {b.referenceNumber}
                    </span>
                    <StatusBadge status={b.urgency} />
                  </div>
                  <div className="text-xs font-medium text-[#172B4D]">
                    {b.hospitalName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 tabular-nums">
                    <span>
                      {b.requestedComponent} • {b.requiredQuantity} units •{" "}
                      {b.radiusKm} KM
                    </span>
                    <span className="font-semibold text-[#2E7D32]">
                      {b.acceptedCount} accepted / {b.invitedDonorsCount} invited
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* E. Emergency Broadcast Modal */}
      <BLModal
        open={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="Emergency Donor Invitation Broadcast"
        subtitle="Transmit an anonymous voluntary donation invitation to opted-in donors within the selected radius."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleDispatchBroadcast} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormInput
              label="Request Reference Number"
              required
              value={refNumber}
              onChange={setRefNumber}
            />
            <FormSelect
              label="Requested Blood Component"
              required
              value={reqComponent}
              onChange={setReqComponent}
              options={BLOOD_COMPONENTS.map((c) => ({ label: c, value: c }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#172B4D] mb-1">
                Hospital / Center Location
              </label>
              <div className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-[#172B4D] flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#C62828] shrink-0" />
                <span className="truncate">{activeHub.name}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormInput
                label="Required Qty"
                type="number"
                required
                value={reqQuantity}
                onChange={setReqQuantity}
              />
              <FormSelect
                label="Radius"
                value={String(radiusKm)}
                onChange={(v) => setRadiusKm(Number(v))}
                options={RADIUS_OPTIONS.map((r) => ({
                  label: `${r} KM`,
                  value: String(r),
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormSelect
              label="Request Urgency"
              value={reqUrgency}
              onChange={setReqUrgency}
              options={[
                { label: "Emergency (Immediate STAT)", value: "Emergency" },
                { label: "Urgent (Within 12 Hours)", value: "Urgent" },
                { label: "Priority Standby", value: "Priority" },
              ]}
            />
            <FormInput
              label="Required Date / Window"
              value={reqDate}
              onChange={setReqDate}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Voluntary Donor Invitation Message
            </label>
            <textarea
              rows={3}
              required
              value={inviteMsg}
              onChange={(e) => setInviteMsg(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-[#172B4D] focus:outline-none focus:border-[#C62828]"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {optedInContactCount} anonymous opted-in donors within {radiusKm} KM will receive this push invitation in the BloodLink Donor Mobile App.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <BLButton
              variant="secondary"
              onClick={() => setBroadcastModalOpen(false)}
            >
              Cancel
            </BLButton>
            <BLButton
              type="submit"
              variant="primary"
              disabled={submittingBroadcast}
            >
              <Send className="h-4 w-4" />
              {submittingBroadcast ? "Sending Invitations..." : "Send Invitation"}
            </BLButton>
          </div>
        </form>
      </BLModal>

      {/* Authorized Consented Responders Modal */}
      <BLModal
        open={respondersModalOpen}
        onClose={() => setRespondersModalOpen(false)}
        title="Voluntary Donor Invitation Responses (Consented Only)"
        subtitle="Only donors who voluntarily accepted an emergency invitation and granted explicit contact consent appear here for center scheduling."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {consentedAcceptedResponses.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No consented voluntary responses recorded yet.
            </p>
          ) : (
            consentedAcceptedResponses.map((resp) => (
              <div
                key={resp.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-[#F5F6F8]/60 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172B4D] tabular-nums">
                      Donor Ref: {resp.donorCode} ({resp.anonymousToken})
                    </span>
                    <StatusBadge status="Accepted & Consented" />
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Broadcast <strong>{resp.referenceNumber}</strong> • Approx.{" "}
                    <strong className="tabular-nums">{resp.approxDistanceKm} km</strong>{" "}
                    • Routed to <strong>{resp.assignedVerificationCenter}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Responded at {resp.respondedAt} • Eligibility & blood compatibility to be verified on-site by licensed RMT.
                  </div>
                </div>
                <Building2 className="h-5 w-5 text-[#2E7D32] shrink-0" />
              </div>
            ))
          )}
          <div className="flex justify-end pt-2">
            <BLButton
              variant="secondary"
              onClick={() => setRespondersModalOpen(false)}
            >
              Close
            </BLButton>
          </div>
        </div>
      </BLModal>
    </div>
  );
}
