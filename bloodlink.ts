export interface StockMovementEntry {
  timestamp: string;
  action: string;
  actor: string;
  location: string;
  notes: string;
}

export interface StaffUser {
  id: number;
  staffCode: string;
  fullName: string;
  email: string;
  role: string;
  facility: string;
  department: string;
  status: string;
  lastLogin: string;
}

export interface BloodCenter {
  id: number;
  centerCode: string;
  name: string;
  chapter: string;
  facilityType: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  contactPhone: string;
  operatingHours: string;
  activeDriveTitle: string;
  driveDate: string;
  driveTargetUnits: number;
  driveCollectedUnits: number;
  storageCapacityStatus: string;
  status: string;
}

export interface DonorRecord {
  id: number;
  donorCode: string;
  anonymousToken: string;
  fullName: string;
  birthday: string;
  sex: string;
  bloodType: string;
  bloodTypeVerified: boolean;
  phone: string;
  email: string;
  address: string;
  sectorLabel: string;
  approxLat: number;
  approxLng: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  lastDonationDate: string;
  totalDonations: number;
  registrationStatus: string;
  medicalScreeningNotes: string;
  hemoglobinGdl: number;
  bloodPressure: string;
  weightKg: number;
  consentDataProcessing: boolean;
  locationSharingEnabled: boolean;
  contactInvitationOptIn: boolean;
  notifyReminders: boolean;
  notifyCampaigns: boolean;
}

/**
 * Strictly anonymized marker for Donor Proximity Radar.
 * NEVER includes bloodType, fullName, phone, email, or exact residential address.
 */
export interface RadarAnonymousMarker {
  id: number;
  anonymousToken: string;
  sectorLabel: string;
  approxLat: number;
  approxLng: number;
  contactInvitationOptIn: boolean;
}

export interface DonationAppointment {
  id: number;
  appointmentCode: string;
  donorId: number;
  donorCode: string;
  donorName: string;
  centerId: number;
  centerName: string;
  centerAddress: string;
  scheduledDate: string;
  timeSlot: string;
  donationType: string;
  status: string;
  notes: string;
}

export interface BloodCollectionRecord {
  id: number;
  unitId: string;
  donorId: number;
  donorCode: string;
  centerName: string;
  collectionDate: string;
  bloodType: string;
  volumeMl: number;
  component: string;
  testingStatus: string;
  processingStatus: string;
  verifiedBy: string;
  verifiedAt: string;
  notes: string;
}

export interface BloodInventoryUnit {
  id: number;
  unitId: string;
  bloodType: string;
  component: string;
  volumeMl: number;
  collectionDate: string;
  expirationDate: string;
  centerName: string;
  storageLocation: string;
  quarantineStatus: string;
  status: string;
  reservedForRequestCode: string;
  donorReference: string;
  stockMovementLog: StockMovementEntry[];
}

export interface HospitalBloodRequest {
  id: number;
  requestCode: string;
  hospitalName: string;
  hospitalLat: number;
  hospitalLng: number;
  department: string;
  bloodType: string;
  component: string;
  unitsRequested: number;
  unitsFulfilled: number;
  requiredDateTime: string;
  urgency: string;
  medicalJustification: string;
  requestingPersonnel: string;
  licenseNumber: string;
  status: string;
  compatibilityVerified: boolean;
  crossmatchStatus: string;
  verifiedByMedTech: string;
  releaseDocNumber: string;
}

export interface BloodAllocationRecord {
  id: number;
  allocationCode: string;
  requestCode: string;
  unitId: string;
  bloodType: string;
  component: string;
  hospitalName: string;
  department: string;
  compatibilityStatus: string;
  crossmatchVerifiedBy: string;
  crossmatchTimestamp: string;
  allocatedBy: string;
  releaseStatus: string;
  releaseDocNumber: string;
  releaseNotes: string;
  releasedAt: string;
}

export interface TransfusionRecord {
  id: number;
  transfusionCode: string;
  unitId: string;
  bloodType: string;
  component: string;
  receivingHospital: string;
  receivingDepartment: string;
  releaseDate: string;
  receivedBy: string;
  patientCaseRef: string;
  transfusionRecord: string;
  outcome: string;
  adverseReaction: string;
  adverseReactionDetails: string;
  attendingPhysician: string;
  recordedAt: string;
}

export interface RadarBroadcast {
  id: number;
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
  invitedDonorsCount: number;
  responsesCount: number;
  acceptedCount: number;
  status: string;
  createdBy: string;
}

export interface RadarResponse {
  id: number;
  broadcastId: number;
  referenceNumber: string;
  donorId: number;
  donorCode: string;
  anonymousToken: string;
  approxDistanceKm: number;
  responseStatus: string;
  consentToShareDetails: boolean;
  assignedVerificationCenter: string;
  respondedAt: string;
}

export interface AppNotification {
  id: number;
  targetPortal: string;
  donorId: number | null;
  hospitalName: string;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceCode: string;
  createdAtLabel: string;
}

export interface BloodLinkDataset {
  users: StaffUser[];
  bloodCenters: BloodCenter[];
  donors: DonorRecord[];
  radarMarkers: RadarAnonymousMarker[];
  appointments: DonationAppointment[];
  collections: BloodCollectionRecord[];
  inventory: BloodInventoryUnit[];
  requests: HospitalBloodRequest[];
  allocations: BloodAllocationRecord[];
  transfusions: TransfusionRecord[];
  radarBroadcasts: RadarBroadcast[];
  radarResponses: RadarResponse[];
  notifications: AppNotification[];
}

export type PortalMode = "auth" | "admin" | "hospital" | "mobile";

export type AdminModuleKey =
  | "dashboard"
  | "donors"
  | "collection"
  | "inventory"
  | "radar"
  | "requests"
  | "allocation"
  | "transfusion"
  | "centers"
  | "reports"
  | "users"
  | "settings"
  | "design_system";

export type HospitalModuleKey =
  | "dashboard"
  | "submit_request"
  | "request_history"
  | "radar"
  | "allocation"
  | "transfusion"
  | "notifications"
  | "profile";

export type MobileTabKey =
  | "home"
  | "drives"
  | "donations"
  | "notifications"
  | "profile";
