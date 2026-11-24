export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const BLOOD_COMPONENTS = [
  "Whole Blood",
  "Packed RBC",
  "Platelet Concentrate",
  "Fresh Frozen Plasma",
  "Cryoprecipitate",
] as const;

export const REQUEST_STATUSES = [
  "Pending",
  "Under Review",
  "Approved",
  "Partially Fulfilled",
  "Ready for Release",
  "Released",
  "Completed",
  "Rejected",
] as const;

export interface PartnerHospitalRef {
  name: string;
  shortName: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  dohLevel: string;
  bloodBankHead: string;
  contactPhone: string;
}

export const PARTNER_HOSPITALS: PartnerHospitalRef[] = [
  {
    name: "Philippine General Hospital (PGH)",
    shortName: "PGH Manila",
    city: "Ermita, Manila",
    address: "Taft Avenue, Ermita, Manila 1000",
    lat: 14.5777,
    lng: 120.9854,
    dohLevel: "DOH Level III • Tertiary National Referral Hospital",
    bloodBankHead: "Dr. Rafael Bautista, MD, FPSP",
    contactPhone: "(02) 8554-8400 loc. 3205",
  },
  {
    name: "St. Luke's Medical Center - Quezon City",
    shortName: "SLMC Quezon City",
    city: "New Manila, Quezon City",
    address: "279 E. Rodriguez Sr. Ave, Quezon City 1112",
    lat: 14.6227,
    lng: 121.0233,
    dohLevel: "DOH Level III • Accredited Hospital Blood Bank",
    bloodBankHead: "Patricia Lim-Chua, RMT",
    contactPhone: "(02) 8723-0101 loc. 4188",
  },
  {
    name: "National Kidney and Transplant Institute (NKTI)",
    shortName: "NKTI Diliman",
    city: "Diliman, Quezon City",
    address: "East Avenue, Diliman, Quezon City 1101",
    lat: 14.6462,
    lng: 121.0475,
    dohLevel: "DOH Specialty Center • Tertiary Blood Bank",
    bloodBankHead: "Dr. Jerome Pangilinan, MD",
    contactPhone: "(02) 8981-0300 loc. 2410",
  },
  {
    name: "Makati Medical Center",
    shortName: "Makati Med",
    city: "Legazpi Village, Makati",
    address: "2 Amorsolo Street, Legazpi Village, Makati 1229",
    lat: 14.5591,
    lng: 121.0146,
    dohLevel: "DOH Level III • Tertiary Hospital Blood Bank",
    bloodBankHead: "Dr. Victoriano Sy, MD",
    contactPhone: "(02) 8888-8999 loc. 7120",
  },
  {
    name: "The Medical City - Ortigas",
    shortName: "TMC Ortigas",
    city: "Ortigas, Pasig City",
    address: "Ortigas Avenue, Pasig City 1605",
    lat: 14.5896,
    lng: 121.0693,
    dohLevel: "DOH Level III • Tertiary Blood Service Facility",
    bloodBankHead: "Dr. Marissa Sandoval, MD",
    contactPhone: "(02) 8988-1000 loc. 6214",
  },
  {
    name: "East Avenue Medical Center",
    shortName: "EAMC Quezon City",
    city: "Diliman, Quezon City",
    address: "East Avenue, Diliman, Quezon City 1100",
    lat: 14.6413,
    lng: 121.0484,
    dohLevel: "DOH Level III • Regional Trauma Center",
    bloodBankHead: "Dr. Arnel Velasco, MD",
    contactPhone: "(02) 8928-0611 loc. 409",
  },
];

/**
 * Calculates great-circle distance in kilometers between two coordinates.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Computes days until expiration relative to reference date (2026-04-12).
 */
export function daysUntilExpiration(expirationDate: string, refDateStr = "2026-04-12"): number {
  const exp = new Date(`${expirationDate}T00:00:00`);
  const ref = new Date(`${refDateStr}T00:00:00`);
  if (Number.isNaN(exp.getTime())) return 30;
  return Math.round((exp.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeDefaultExpiration(collectionDate: string, component: string): string {
  const base = new Date(`${collectionDate}T00:00:00`);
  const validBase = Number.isNaN(base.getTime()) ? new Date("2026-04-12T00:00:00") : base;
  let daysToAdd = 35;
  if (component === "Packed RBC") daysToAdd = 42;
  else if (component === "Platelet Concentrate") daysToAdd = 5;
  else if (component === "Fresh Frozen Plasma" || component === "Cryoprecipitate") daysToAdd = 365;

  validBase.setDate(validBase.getDate() + daysToAdd);
  return validBase.toISOString().slice(0, 10);
}
