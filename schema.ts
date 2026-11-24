import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export interface StockMovementEntry {
  timestamp: string;
  action: string;
  actor: string;
  location: string;
  notes: string;
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  staffCode: text("staff_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // Administrator | Blood Center Staff | Pathologist / MedTech | Hospital Coordinator | Donor
  facility: text("facility").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull().default("Verified"), // Verified | Pending Verification | Inactive
  lastLogin: text("last_login").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bloodCenters = pgTable("blood_centers", {
  id: serial("id").primaryKey(),
  centerCode: text("center_code").notNull().unique(),
  name: text("name").notNull(),
  chapter: text("chapter").notNull(),
  facilityType: text("facility_type").notNull(), // National Blood Center | Chapter Blood Bank | Mobile Collection Drive
  address: text("address").notNull(),
  city: text("city").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  contactPhone: text("contact_phone").notNull(),
  operatingHours: text("operating_hours").notNull(),
  activeDriveTitle: text("active_drive_title").notNull(),
  driveDate: text("drive_date").notNull(),
  driveTargetUnits: integer("drive_target_units").notNull().default(100),
  driveCollectedUnits: integer("drive_collected_units").notNull().default(0),
  storageCapacityStatus: text("storage_capacity_status").notNull().default("Optimal (68%)"),
  status: text("status").notNull().default("Active"),
});

export const donors = pgTable("donors", {
  id: serial("id").primaryKey(),
  donorCode: text("donor_code").notNull().unique(),
  anonymousToken: text("anonymous_token").notNull().unique(),
  fullName: text("full_name").notNull(),
  birthday: text("birthday").notNull(),
  sex: text("sex").notNull(),
  bloodType: text("blood_type").notNull(), // A+ | A- | B+ | B- | AB+ | AB- | O+ | O- | Unverified
  bloodTypeVerified: boolean("blood_type_verified").notNull().default(true),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  sectorLabel: text("sector_label").notNull(), // Approximate area label for privacy
  approxLat: doublePrecision("approx_lat").notNull(),
  approxLng: doublePrecision("approx_lng").notNull(),
  emergencyContactName: text("emergency_contact_name").notNull(),
  emergencyContactPhone: text("emergency_contact_phone").notNull(),
  lastDonationDate: text("last_donation_date").notNull(),
  totalDonations: integer("total_donations").notNull().default(0),
  registrationStatus: text("registration_status").notNull().default("Verified"), // Verified | Pending Screening | Deferred
  medicalScreeningNotes: text("medical_screening_notes").notNull().default("Passed standard DOH/PRC donor history questionnaire."),
  hemoglobinGdl: doublePrecision("hemoglobin_gdl").notNull().default(14.2),
  bloodPressure: text("blood_pressure").notNull().default("120/80 mmHg"),
  weightKg: doublePrecision("weight_kg").notNull().default(65),
  consentDataProcessing: boolean("consent_data_processing").notNull().default(true),
  locationSharingEnabled: boolean("location_sharing_enabled").notNull().default(true),
  contactInvitationOptIn: boolean("contact_invitation_opt_in").notNull().default(true),
  notifyReminders: boolean("notify_reminders").notNull().default(true),
  notifyCampaigns: boolean("notify_campaigns").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const donationAppointments = pgTable("donation_appointments", {
  id: serial("id").primaryKey(),
  appointmentCode: text("appointment_code").notNull().unique(),
  donorId: integer("donor_id").notNull(),
  donorCode: text("donor_code").notNull(),
  donorName: text("donor_name").notNull(),
  centerId: integer("center_id").notNull(),
  centerName: text("center_name").notNull(),
  centerAddress: text("center_address").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  timeSlot: text("time_slot").notNull(),
  donationType: text("donation_type").notNull().default("Whole Blood"),
  status: text("status").notNull().default("Scheduled"), // Scheduled | Checked In | Completed | Rescheduled | Cancelled
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bloodCollections = pgTable("blood_collections", {
  id: serial("id").primaryKey(),
  unitId: text("unit_id").notNull().unique(),
  donorId: integer("donor_id").notNull(),
  donorCode: text("donor_code").notNull(),
  centerName: text("center_name").notNull(),
  collectionDate: text("collection_date").notNull(),
  bloodType: text("blood_type").notNull(),
  volumeMl: integer("volume_ml").notNull().default(450),
  component: text("component").notNull(), // Whole Blood | Packed RBC | Platelet Concentrate | Fresh Frozen Plasma | Cryoprecipitate
  testingStatus: text("testing_status").notNull().default("Pending Serology"), // Cleared / Negative | Pending Serology | Reactive / Quarantined
  processingStatus: text("processing_status").notNull().default("Awaiting Verification"), // Processed & Labeled | Centrifugation | Awaiting Verification | Quarantined
  verifiedBy: text("verified_by").notNull().default("Pending MedTech Review"),
  verifiedAt: text("verified_at").notNull().default("—"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bloodInventory = pgTable("blood_inventory", {
  id: serial("id").primaryKey(),
  unitId: text("unit_id").notNull().unique(),
  bloodType: text("blood_type").notNull(),
  component: text("component").notNull(),
  volumeMl: integer("volume_ml").notNull().default(450),
  collectionDate: text("collection_date").notNull(),
  expirationDate: text("expiration_date").notNull(),
  centerName: text("center_name").notNull(),
  storageLocation: text("storage_location").notNull(),
  quarantineStatus: text("quarantine_status").notNull().default("Cleared"), // Cleared | Under Quarantine | Quarantine Released
  status: text("status").notNull().default("Available"), // Available | Reserved | Released | Expired | Quarantined
  reservedForRequestCode: text("reserved_for_request_code").notNull().default(""),
  donorReference: text("donor_reference").notNull().default("BL-DNR-2026-0101"),
  stockMovementLog: jsonb("stock_movement_log").$type<StockMovementEntry[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hospitalRequests = pgTable("hospital_requests", {
  id: serial("id").primaryKey(),
  requestCode: text("request_code").notNull().unique(),
  hospitalName: text("hospital_name").notNull(),
  hospitalLat: doublePrecision("hospital_lat").notNull().default(14.5777),
  hospitalLng: doublePrecision("hospital_lng").notNull().default(120.9854),
  department: text("department").notNull(),
  bloodType: text("blood_type").notNull(),
  component: text("component").notNull(),
  unitsRequested: integer("units_requested").notNull(),
  unitsFulfilled: integer("units_fulfilled").notNull().default(0),
  requiredDateTime: text("required_date_time").notNull(),
  urgency: text("urgency").notNull(), // Routine | Urgent | Emergency
  medicalJustification: text("medical_justification").notNull(),
  requestingPersonnel: text("requesting_personnel").notNull(),
  licenseNumber: text("license_number").notNull().default("PRC-MD-0119482"),
  status: text("status").notNull().default("Pending"), // Pending | Under Review | Approved | Partially Fulfilled | Ready for Release | Released | Completed | Rejected
  compatibilityVerified: boolean("compatibility_verified").notNull().default(false),
  crossmatchStatus: text("crossmatch_status").notNull().default("Pending Crossmatch"), // Pending Crossmatch | Compatible - Verified | Incompatible
  verifiedByMedTech: text("verified_by_med_tech").notNull().default("—"),
  releaseDocNumber: text("release_doc_number").notNull().default("—"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bloodAllocations = pgTable("blood_allocations", {
  id: serial("id").primaryKey(),
  allocationCode: text("allocation_code").notNull().unique(),
  requestCode: text("request_code").notNull(),
  unitId: text("unit_id").notNull(),
  bloodType: text("blood_type").notNull(),
  component: text("component").notNull(),
  hospitalName: text("hospital_name").notNull(),
  department: text("department").notNull(),
  compatibilityStatus: text("compatibility_status").notNull(), // Verified Compatible | Pending Verification
  crossmatchVerifiedBy: text("crossmatch_verified_by").notNull(),
  crossmatchTimestamp: text("crossmatch_timestamp").notNull(),
  allocatedBy: text("allocated_by").notNull(),
  releaseStatus: text("release_status").notNull().default("Ready for Release"), // Allocated | Ready for Release | Released
  releaseDocNumber: text("release_doc_number").notNull(),
  releaseNotes: text("release_notes").notNull().default(""),
  releasedAt: text("released_at").notNull(),
});

export const transfusions = pgTable("transfusions", {
  id: serial("id").primaryKey(),
  transfusionCode: text("transfusion_code").notNull().unique(),
  unitId: text("unit_id").notNull(),
  bloodType: text("blood_type").notNull(),
  component: text("component").notNull(),
  receivingHospital: text("receiving_hospital").notNull(),
  receivingDepartment: text("receiving_department").notNull(),
  releaseDate: text("release_date").notNull(),
  receivedBy: text("received_by").notNull(),
  patientCaseRef: text("patient_case_ref").notNull(),
  transfusionRecord: text("transfusion_record").notNull(),
  outcome: text("outcome").notNull(), // Completed Uneventfully | In Progress | Discontinued - Reaction
  adverseReaction: text("adverse_reaction").notNull().default("None Reported"),
  adverseReactionDetails: text("adverse_reaction_details").notNull().default("No adverse clinical reaction observed during 4-hour post-transfusion monitoring."),
  attendingPhysician: text("attending_physician").notNull(),
  recordedAt: text("recorded_at").notNull(),
});

export const radarBroadcasts = pgTable("radar_broadcasts", {
  id: serial("id").primaryKey(),
  referenceNumber: text("reference_number").notNull().unique(),
  hospitalName: text("hospital_name").notNull(),
  originLat: doublePrecision("origin_lat").notNull(),
  originLng: doublePrecision("origin_lng").notNull(),
  radiusKm: integer("radius_km").notNull(),
  requestedComponent: text("requested_component").notNull(),
  requiredQuantity: integer("required_quantity").notNull(),
  urgency: text("urgency").notNull(), // Emergency | Urgent | Priority
  requiredDate: text("required_date").notNull(),
  invitationMessage: text("invitation_message").notNull(),
  invitedDonorsCount: integer("invited_donors_count").notNull().default(0),
  responsesCount: integer("responses_count").notNull().default(0),
  acceptedCount: integer("accepted_count").notNull().default(0),
  status: text("status").notNull().default("Active"), // Active | Closed
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const radarResponses = pgTable("radar_responses", {
  id: serial("id").primaryKey(),
  broadcastId: integer("broadcast_id").notNull(),
  referenceNumber: text("reference_number").notNull(),
  donorId: integer("donor_id").notNull(),
  donorCode: text("donor_code").notNull(),
  anonymousToken: text("anonymous_token").notNull(),
  approxDistanceKm: doublePrecision("approx_distance_km").notNull(),
  responseStatus: text("response_status").notNull().default("Pending"), // Pending | Accepted | Declined
  consentToShareDetails: boolean("consent_to_share_details").notNull().default(false),
  assignedVerificationCenter: text("assigned_verification_center").notNull().default("PRC National Blood Center - Port Area, Manila"),
  respondedAt: text("responded_at").notNull().default("—"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  targetPortal: text("target_portal").notNull(), // Admin | Hospital | Donor
  donorId: integer("donor_id"),
  hospitalName: text("hospital_name").notNull().default(""),
  category: text("category").notNull(), // Emergency Invitation | Appointment Reminder | Donation Confirmation | Campaign Announcement | Request Update | Account Update
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  referenceCode: text("reference_code").notNull().default(""),
  createdAtLabel: text("created_at_label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
