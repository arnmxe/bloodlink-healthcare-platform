import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  bloodCenters,
  donors,
  donationAppointments,
  bloodCollections,
  bloodInventory,
  hospitalRequests,
  bloodAllocations,
  transfusions,
  radarBroadcasts,
  radarResponses,
  notifications,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc, eq } from "drizzle-orm";
import { computeDefaultExpiration, haversineKm, PARTNER_HOSPITALS } from "@/lib/bloodlink-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();

    const [
      allUsers,
      allCenters,
      allDonors,
      allAppointments,
      allCollections,
      allInventory,
      allRequests,
      allAllocations,
      allTransfusions,
      allBroadcasts,
      allResponses,
      allNotifications,
    ] = await Promise.all([
      db.select().from(users).orderBy(desc(users.id)),
      db.select().from(bloodCenters).orderBy(bloodCenters.id),
      db.select().from(donors).orderBy(donors.id),
      db.select().from(donationAppointments).orderBy(desc(donationAppointments.id)),
      db.select().from(bloodCollections).orderBy(desc(bloodCollections.id)),
      db.select().from(bloodInventory).orderBy(desc(bloodInventory.id)),
      db.select().from(hospitalRequests).orderBy(desc(hospitalRequests.id)),
      db.select().from(bloodAllocations).orderBy(desc(bloodAllocations.id)),
      db.select().from(transfusions).orderBy(desc(transfusions.id)),
      db.select().from(radarBroadcasts).orderBy(desc(radarBroadcasts.id)),
      db.select().from(radarResponses).orderBy(desc(radarResponses.id)),
      db.select().from(notifications).orderBy(desc(notifications.id)),
    ]);

    // Strictly privacy-filtered radar markers: NO bloodType, NO fullName, NO phone, NO exact address!
    const radarMarkers = allDonors
      .filter((d) => d.locationSharingEnabled)
      .map((d) => ({
        id: d.id,
        anonymousToken: d.anonymousToken,
        sectorLabel: d.sectorLabel,
        approxLat: d.approxLat,
        approxLng: d.approxLng,
        contactInvitationOptIn: d.contactInvitationOptIn,
      }));

    return NextResponse.json({
      users: allUsers,
      bloodCenters: allCenters,
      donors: allDonors,
      radarMarkers,
      appointments: allAppointments,
      collections: allCollections,
      inventory: allInventory,
      requests: allRequests,
      allocations: allAllocations,
      transfusions: allTransfusions,
      radarBroadcasts: allBroadcasts,
      radarResponses: allResponses,
      notifications: allNotifications,
    });
  } catch (error) {
    console.error("GET /api/bloodlink failed:", error);
    return NextResponse.json(
      { error: "Failed to load BloodLink clinical data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "add_donor": {
        const suffix = Math.floor(1000 + Math.random() * 8999);
        const hex = Math.floor(4096 + Math.random() * 60000)
          .toString(16)
          .toUpperCase()
          .slice(0, 4);
        // Generate fuzzed Metro Manila sector coordinates if not supplied
        const approxLat = Number(body.approxLat) || 14.585 + (Math.random() - 0.5) * 0.08;
        const approxLng = Number(body.approxLng) || 121.015 + (Math.random() - 0.5) * 0.08;

        const [created] = await db
          .insert(donors)
          .values({
            donorCode: `BL-DNR-2026-${suffix}`,
            anonymousToken: `ANON-${hex}`,
            fullName: String(body.fullName || "Voluntary Donor"),
            birthday: String(body.birthday || "1996-05-15"),
            sex: String(body.sex || "Female"),
            bloodType: String(body.bloodType || "Unverified"),
            bloodTypeVerified: Boolean(body.bloodTypeVerified ?? false),
            phone: String(body.phone || "+63 917 000 0000"),
            email: String(body.email || `donor${suffix}@bloodlink.ph`),
            address: String(body.address || "Metro Manila"),
            sectorLabel: String(body.sectorLabel || "Metro Manila Approximate Sector"),
            approxLat,
            approxLng,
            emergencyContactName: String(body.emergencyContactName || "Authorized Contact"),
            emergencyContactPhone: String(body.emergencyContactPhone || "+63 918 000 0000"),
            lastDonationDate: String(body.lastDonationDate || "First-Time Applicant"),
            totalDonations: Number(body.totalDonations || 0),
            registrationStatus: String(body.registrationStatus || "Pending Screening"),
            medicalScreeningNotes: String(
              body.medicalScreeningNotes ||
                "Initial donor registration submitted; awaiting center lab blood typing & physical screening."
            ),
            hemoglobinGdl: Number(body.hemoglobinGdl || 13.8),
            bloodPressure: String(body.bloodPressure || "120/80 mmHg"),
            weightKg: Number(body.weightKg || 62),
            consentDataProcessing: Boolean(body.consentDataProcessing ?? true),
            locationSharingEnabled: Boolean(body.locationSharingEnabled ?? false),
            contactInvitationOptIn: Boolean(body.contactInvitationOptIn ?? false),
          })
          .returning();

        await db.insert(notifications).values({
          targetPortal: "Admin",
          donorId: created.id,
          hospitalName: "",
          category: "Account Update",
          title: `New Voluntary Donor Registered — ${created.donorCode}`,
          message: `${created.fullName} registered and is queued for medical screening & blood type verification.`,
          isRead: false,
          referenceCode: created.donorCode,
          createdAtLabel: "Just now",
        });

        return NextResponse.json({ ok: true, donor: created });
      }

      case "update_donor": {
        const donorId = Number(body.id);
        const existing = await db.select().from(donors).where(eq(donors.id, donorId));
        if (!existing[0]) {
          return NextResponse.json({ error: "Donor not found" }, { status: 404 });
        }
        const cur = existing[0];
        const [updated] = await db
          .update(donors)
          .set({
            fullName: body.fullName !== undefined ? String(body.fullName) : cur.fullName,
            phone: body.phone !== undefined ? String(body.phone) : cur.phone,
            email: body.email !== undefined ? String(body.email) : cur.email,
            address: body.address !== undefined ? String(body.address) : cur.address,
            sectorLabel: body.sectorLabel !== undefined ? String(body.sectorLabel) : cur.sectorLabel,
            bloodType: body.bloodType !== undefined ? String(body.bloodType) : cur.bloodType,
            bloodTypeVerified:
              body.bloodTypeVerified !== undefined ? Boolean(body.bloodTypeVerified) : cur.bloodTypeVerified,
            registrationStatus:
              body.registrationStatus !== undefined ? String(body.registrationStatus) : cur.registrationStatus,
            medicalScreeningNotes:
              body.medicalScreeningNotes !== undefined
                ? String(body.medicalScreeningNotes)
                : cur.medicalScreeningNotes,
            hemoglobinGdl:
              body.hemoglobinGdl !== undefined ? Number(body.hemoglobinGdl) : cur.hemoglobinGdl,
            bloodPressure:
              body.bloodPressure !== undefined ? String(body.bloodPressure) : cur.bloodPressure,
            weightKg: body.weightKg !== undefined ? Number(body.weightKg) : cur.weightKg,
            consentDataProcessing:
              body.consentDataProcessing !== undefined
                ? Boolean(body.consentDataProcessing)
                : cur.consentDataProcessing,
            locationSharingEnabled:
              body.locationSharingEnabled !== undefined
                ? Boolean(body.locationSharingEnabled)
                : cur.locationSharingEnabled,
            contactInvitationOptIn:
              body.contactInvitationOptIn !== undefined
                ? Boolean(body.contactInvitationOptIn)
                : cur.contactInvitationOptIn,
            notifyReminders:
              body.notifyReminders !== undefined ? Boolean(body.notifyReminders) : cur.notifyReminders,
            notifyCampaigns:
              body.notifyCampaigns !== undefined ? Boolean(body.notifyCampaigns) : cur.notifyCampaigns,
          })
          .where(eq(donors.id, donorId))
          .returning();

        return NextResponse.json({ ok: true, donor: updated });
      }

      case "delete_donor": {
        const donorId = Number(body.id);
        await db.delete(donors).where(eq(donors.id, donorId));
        return NextResponse.json({ ok: true });
      }

      case "create_appointment": {
        const suffix = Math.floor(5100 + Math.random() * 4800);
        const [created] = await db
          .insert(donationAppointments)
          .values({
            appointmentCode: `APT-2026-${suffix}`,
            donorId: Number(body.donorId || 1),
            donorCode: String(body.donorCode || "BL-DNR-2026-0101"),
            donorName: String(body.donorName || "Juan Miguel Dela Cruz"),
            centerId: Number(body.centerId || 1),
            centerName: String(body.centerName || "PRC National Blood Center - Port Area"),
            centerAddress: String(body.centerAddress || "Port Area Complex, Manila"),
            scheduledDate: String(body.scheduledDate || "2026-04-18"),
            timeSlot: String(body.timeSlot || "10:00 AM – 10:45 AM"),
            donationType: String(body.donationType || "Whole Blood"),
            status: "Scheduled",
            notes: String(body.notes || "Booked via BloodLink Appointment Scheduler."),
          })
          .returning();

        await db.insert(notifications).values({
          targetPortal: "Donor",
          donorId: created.donorId,
          hospitalName: "",
          category: "Appointment Reminder",
          title: `Appointment Confirmed — ${created.appointmentCode}`,
          message: `${created.donationType} appointment scheduled at ${created.centerName} on ${created.scheduledDate} (${created.timeSlot}).`,
          isRead: false,
          referenceCode: created.appointmentCode,
          createdAtLabel: "Just now",
        });

        return NextResponse.json({ ok: true, appointment: created });
      }

      case "update_appointment": {
        const id = Number(body.id);
        const curList = await db
          .select()
          .from(donationAppointments)
          .where(eq(donationAppointments.id, id));
        if (!curList[0]) {
          return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
        }
        const cur = curList[0];
        const [updated] = await db
          .update(donationAppointments)
          .set({
            scheduledDate:
              body.scheduledDate !== undefined ? String(body.scheduledDate) : cur.scheduledDate,
            timeSlot: body.timeSlot !== undefined ? String(body.timeSlot) : cur.timeSlot,
            status: body.status !== undefined ? String(body.status) : cur.status,
            notes: body.notes !== undefined ? String(body.notes) : cur.notes,
          })
          .where(eq(donationAppointments.id, id))
          .returning();

        return NextResponse.json({ ok: true, appointment: updated });
      }

      case "record_collection": {
        const suffix = Math.floor(88440 + Math.random() * 1500);
        const unitId = String(body.unitId || `PRC-2026-${suffix}`);
        const donorId = Number(body.donorId || 1);
        const donorRows = await db.select().from(donors).where(eq(donors.id, donorId));
        const donor = donorRows[0];
        const collectionDate = String(body.collectionDate || "2026-04-12");
        const bloodType = String(body.bloodType || donor?.bloodType || "O+");
        const component = String(body.component || "Packed RBC");
        const volumeMl = Number(body.volumeMl || 450);
        const centerName = String(body.centerName || "PRC National Blood Center - Port Area");

        const [created] = await db
          .insert(bloodCollections)
          .values({
            unitId,
            donorId,
            donorCode: donor?.donorCode || String(body.donorCode || "BL-DNR-2026-0101"),
            centerName,
            collectionDate,
            bloodType,
            volumeMl,
            component,
            testingStatus: "Pending Serology",
            processingStatus: "Awaiting Verification",
            verifiedBy: "Pending MedTech Review",
            verifiedAt: "—",
            notes: String(body.notes || "Collected per standard aseptic phlebotomy SOP."),
          })
          .returning();

        // Also place unit into Inventory in Quarantined state pending MedTech TTI verification
        await db.insert(bloodInventory).values({
          unitId,
          bloodType,
          component,
          volumeMl,
          collectionDate,
          expirationDate: computeDefaultExpiration(collectionDate, component),
          centerName,
          storageLocation: "Quarantine Hold Ref-Q1 (+4°C)",
          quarantineStatus: "Under Quarantine",
          status: "Quarantined",
          reservedForRequestCode: "",
          donorReference: created.donorCode,
          stockMovementLog: [
            {
              timestamp: `${collectionDate} 09:30 AM`,
              action: "Phlebotomy Collection Recorded",
              actor: "Clarisse Mendoza, RN",
              location: centerName,
              notes: `Unit ${unitId} (${volumeMl} mL ${component}) placed in initial quarantine pending TTI serology verification.`,
            },
          ],
        });

        if (donor) {
          await db
            .update(donors)
            .set({
              lastDonationDate: collectionDate,
              totalDonations: donor.totalDonations + 1,
            })
            .where(eq(donors.id, donor.id));

          await db.insert(notifications).values({
            targetPortal: "Donor",
            donorId: donor.id,
            hospitalName: "",
            category: "Donation Confirmation",
            title: `Donation Recorded — Unit ${unitId}`,
            message: `Thank you for donating ${volumeMl} mL (${component}) at ${centerName} on ${collectionDate}.`,
            isRead: false,
            referenceCode: unitId,
            createdAtLabel: "Just now",
          });
        }

        return NextResponse.json({ ok: true, collection: created });
      }

      case "verify_collection": {
        const id = Number(body.id);
        const verifier = String(body.verifiedBy || "Marco Villanueva, RMT");
        const testingStatus = String(body.testingStatus || "Cleared / Negative");
        const isCleared = testingStatus === "Cleared / Negative";

        const [updatedCollection] = await db
          .update(bloodCollections)
          .set({
            testingStatus,
            processingStatus: isCleared ? "Processed & Labeled" : "Quarantined",
            verifiedBy: verifier,
            verifiedAt: "2026-04-12 10:45 AM",
          })
          .where(eq(bloodCollections.id, id))
          .returning();

        if (updatedCollection) {
          const invRows = await db
            .select()
            .from(bloodInventory)
            .where(eq(bloodInventory.unitId, updatedCollection.unitId));
          if (invRows[0]) {
            const existingLog = invRows[0].stockMovementLog || [];
            await db
              .update(bloodInventory)
              .set({
                quarantineStatus: isCleared ? "Quarantine Released" : "Under Quarantine",
                status: isCleared ? "Available" : "Quarantined",
                storageLocation: isCleared
                  ? String(body.storageLocation || "Ref-A1 • Verified Shelf 1 (+4°C)")
                  : "Bio-Quarantine Hold Vault",
                stockMovementLog: [
                  ...existingLog,
                  {
                    timestamp: "2026-04-12 10:45 AM",
                    action: isCleared
                      ? "TTI Serology Cleared & Released to Available Stock"
                      : "Flagged Reactive — Retained in Quarantine",
                    actor: verifier,
                    location: updatedCollection.centerName,
                    notes: `Testing status verified as ${testingStatus}.`,
                  },
                ],
              })
              .where(eq(bloodInventory.id, invRows[0].id));
          }
        }

        return NextResponse.json({ ok: true, collection: updatedCollection });
      }

      case "update_inventory_unit": {
        const id = Number(body.id);
        const rows = await db.select().from(bloodInventory).where(eq(bloodInventory.id, id));
        if (!rows[0]) {
          return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }
        const unit = rows[0];
        const nextStatus = body.status !== undefined ? String(body.status) : unit.status;
        const nextLocation =
          body.storageLocation !== undefined ? String(body.storageLocation) : unit.storageLocation;
        const nextQuarantine =
          body.quarantineStatus !== undefined
            ? String(body.quarantineStatus)
            : unit.quarantineStatus;

        const [updated] = await db
          .update(bloodInventory)
          .set({
            status: nextStatus,
            storageLocation: nextLocation,
            quarantineStatus: nextQuarantine,
            stockMovementLog: [
              ...(unit.stockMovementLog || []),
              {
                timestamp: "2026-04-12 11:05 AM",
                action: `Inventory Status Updated → ${nextStatus}`,
                actor: String(body.actor || "Marco Villanueva, RMT"),
                location: nextLocation,
                notes: String(body.notes || `Quarantine: ${nextQuarantine}`),
              },
            ],
          })
          .where(eq(bloodInventory.id, id))
          .returning();

        return NextResponse.json({ ok: true, unit: updated });
      }

      case "create_hospital_request": {
        const suffix = Math.floor(410 + Math.random() * 580);
        const hospitalName = String(body.hospitalName || "Philippine General Hospital (PGH)");
        const matchedHospital = PARTNER_HOSPITALS.find((h) => h.name === hospitalName);
        const urgency = String(body.urgency || "Urgent");

        const [created] = await db
          .insert(hospitalRequests)
          .values({
            requestCode: `REQ-2026-0${suffix}`,
            hospitalName,
            hospitalLat: matchedHospital?.lat ?? 14.5777,
            hospitalLng: matchedHospital?.lng ?? 120.9854,
            department: String(body.department || "Emergency Medicine"),
            bloodType: String(body.bloodType || "O+"),
            component: String(body.component || "Packed RBC"),
            unitsRequested: Number(body.unitsRequested || 2),
            unitsFulfilled: 0,
            requiredDateTime: String(body.requiredDateTime || "2026-04-13 • 08:00 AM"),
            urgency,
            medicalJustification: String(
              body.medicalJustification || "Acute clinical transfusion requirement verified by attending physician."
            ),
            requestingPersonnel: String(body.requestingPersonnel || "Dr. Rafael Bautista, MD"),
            licenseNumber: String(body.licenseNumber || "PRC-MD-0119482"),
            status: "Pending",
          })
          .returning();

        await db.insert(notifications).values({
          targetPortal: "Admin",
          donorId: null,
          hospitalName,
          category: urgency === "Emergency" ? "Emergency Invitation" : "Request Update",
          title: `${urgency === "Emergency" ? "STAT EMERGENCY" : "New"} Blood Request — ${created.requestCode}`,
          message: `${hospitalName} (${created.department}) requested ${created.unitsRequested} unit(s) of ${created.bloodType} ${created.component}.`,
          isRead: false,
          referenceCode: created.requestCode,
          createdAtLabel: "Just now",
        });

        return NextResponse.json({ ok: true, request: created });
      }

      case "update_request_status": {
        const id = Number(body.id);
        const nextStatus = String(body.status);
        const [updated] = await db
          .update(hospitalRequests)
          .set({
            status: nextStatus,
          })
          .where(eq(hospitalRequests.id, id))
          .returning();

        if (updated) {
          await db.insert(notifications).values({
            targetPortal: "Hospital",
            donorId: null,
            hospitalName: updated.hospitalName,
            category: "Request Update",
            title: `Request ${updated.requestCode} → ${nextStatus}`,
            message: `Blood Center updated status of ${updated.bloodType} ${updated.component} request to "${nextStatus}".`,
            isRead: false,
            referenceCode: updated.requestCode,
            createdAtLabel: "Just now",
          });
        }

        return NextResponse.json({ ok: true, request: updated });
      }

      case "allocate_blood_unit": {
        const requestId = Number(body.requestId);
        const inventoryId = Number(body.inventoryId);
        const medTech = String(body.crossmatchVerifiedBy || "Marco Villanueva, RMT (PRC #0084120)");
        const releaseNow = Boolean(body.releaseNow ?? true);

        const reqRows = await db
          .select()
          .from(hospitalRequests)
          .where(eq(hospitalRequests.id, requestId));
        const invRows = await db
          .select()
          .from(bloodInventory)
          .where(eq(bloodInventory.id, inventoryId));

        if (!reqRows[0] || !invRows[0]) {
          return NextResponse.json({ error: "Request or Inventory Unit not found" }, { status: 404 });
        }

        const reqItem = reqRows[0];
        const invItem = invRows[0];
        const allocSuffix = Math.floor(3200 + Math.random() * 6000);
        const relDoc = `REL-PRC-2026-${Math.floor(9920 + Math.random() * 800)}`;

        const [allocation] = await db
          .insert(bloodAllocations)
          .values({
            allocationCode: `ALC-2026-${allocSuffix}`,
            requestCode: reqItem.requestCode,
            unitId: invItem.unitId,
            bloodType: invItem.bloodType,
            component: invItem.component,
            hospitalName: reqItem.hospitalName,
            department: reqItem.department,
            compatibilityStatus: String(
              body.compatibilityStatus || "Verified Compatible (AHG Gel Crossmatch)"
            ),
            crossmatchVerifiedBy: medTech,
            crossmatchTimestamp: "2026-04-12 11:20 AM",
            allocatedBy: String(body.allocatedBy || "Dr. Elena Santos-Reyes, MD"),
            releaseStatus: releaseNow ? "Released" : "Ready for Release",
            releaseDocNumber: relDoc,
            releaseNotes: String(
              body.releaseNotes || "Validated cold-chain transport container; clinical compatibility verified manually."
            ),
            releasedAt: releaseNow ? "2026-04-12 11:25 AM" : "Pending Hospital Courier",
          })
          .returning();

        // Update inventory unit
        await db
          .update(bloodInventory)
          .set({
            status: releaseNow ? "Released" : "Reserved",
            reservedForRequestCode: reqItem.requestCode,
            storageLocation: releaseNow
              ? `Released to ${reqItem.hospitalName}`
              : "Crossmatch Release Hold Rack (+4°C)",
            stockMovementLog: [
              ...(invItem.stockMovementLog || []),
              {
                timestamp: "2026-04-12 11:20 AM",
                action: releaseNow
                  ? `Crossmatched & Released (${relDoc})`
                  : `Crossmatched & Reserved (${relDoc})`,
                actor: medTech,
                location: reqItem.hospitalName,
                notes: `Allocated to ${reqItem.requestCode} (${reqItem.department}). Compatibility verified manually.`,
              },
            ],
          })
          .where(eq(bloodInventory.id, invItem.id));

        const newFulfilled = reqItem.unitsFulfilled + 1;
        const nextReqStatus =
          newFulfilled >= reqItem.unitsRequested
            ? releaseNow
              ? "Released"
              : "Ready for Release"
            : "Partially Fulfilled";

        await db
          .update(hospitalRequests)
          .set({
            unitsFulfilled: newFulfilled,
            status: nextReqStatus,
            compatibilityVerified: true,
            crossmatchStatus: "Compatible - Verified",
            verifiedByMedTech: medTech,
            releaseDocNumber: relDoc,
          })
          .where(eq(hospitalRequests.id, reqItem.id));

        await db.insert(notifications).values({
          targetPortal: "Hospital",
          donorId: null,
          hospitalName: reqItem.hospitalName,
          category: "Request Update",
          title: `Unit ${invItem.unitId} ${releaseNow ? "Released" : "Ready for Release"} (${relDoc})`,
          message: `${invItem.bloodType} ${invItem.component} passed crossmatching by ${medTech} for ${reqItem.requestCode}.`,
          isRead: false,
          referenceCode: reqItem.requestCode,
          createdAtLabel: "Just now",
        });

        return NextResponse.json({ ok: true, allocation });
      }

      case "record_transfusion": {
        const suffix = Math.floor(7800 + Math.random() * 1900);
        const unitId = String(body.unitId);
        const invRows = await db
          .select()
          .from(bloodInventory)
          .where(eq(bloodInventory.unitId, unitId));
        const invUnit = invRows[0];

        const [created] = await db
          .insert(transfusions)
          .values({
            transfusionCode: `TRF-2026-${suffix}`,
            unitId,
            bloodType: String(body.bloodType || invUnit?.bloodType || "O+"),
            component: String(body.component || invUnit?.component || "Packed RBC"),
            receivingHospital: String(
              body.receivingHospital || "Philippine General Hospital (PGH)"
            ),
            receivingDepartment: String(body.receivingDepartment || "Acute Care Ward"),
            releaseDate: String(body.releaseDate || "2026-04-12 11:25 AM"),
            receivedBy: String(body.receivedBy || "Dr. Rafael Bautista, MD"),
            patientCaseRef: String(body.patientCaseRef || `INP-2026-${suffix}`),
            transfusionRecord: String(
              body.transfusionRecord || "Infused over 3 hours via standard blood administration set; vital signs monitored q15m."
            ),
            outcome: String(body.outcome || "Completed Uneventfully"),
            adverseReaction: String(body.adverseReaction || "None Reported"),
            adverseReactionDetails: String(
              body.adverseReactionDetails || "No adverse reactions observed during bedside hemovigilance window."
            ),
            attendingPhysician: String(body.attendingPhysician || "Dr. Rafael Bautista, MD"),
            recordedAt: "2026-04-12 03:30 PM",
          })
          .returning();

        if (invUnit) {
          await db
            .update(bloodInventory)
            .set({
              status: "Released",
              stockMovementLog: [
                ...(invUnit.stockMovementLog || []),
                {
                  timestamp: "2026-04-12 03:30 PM",
                  action: `Bedside Transfusion Logged (${created.outcome})`,
                  actor: created.attendingPhysician,
                  location: `${created.receivingHospital} • ${created.receivingDepartment}`,
                  notes: `Case ${created.patientCaseRef}. Reaction status: ${created.adverseReaction}.`,
                },
              ],
            })
            .where(eq(bloodInventory.id, invUnit.id));
        }

        return NextResponse.json({ ok: true, transfusion: created });
      }

      case "send_radar_broadcast": {
        const suffix = Math.floor(100 + Math.random() * 899);
        const refNum = String(body.referenceNumber || `RDR-EMG-2026-${suffix}`);
        const originLat = Number(body.originLat || 14.5777);
        const originLng = Number(body.originLng || 120.9854);
        const radiusKm = Number(body.radiusKm || 10);
        const hospitalName = String(body.hospitalName || "Philippine General Hospital (PGH)");
        const requestedComponent = String(body.requestedComponent || "Packed RBC");
        const urgency = String(body.urgency || "Emergency");
        const requiredQuantity = Number(body.requiredQuantity || 4);
        const requiredDate = String(body.requiredDate || "2026-04-12 • Within 12 Hours");
        const invitationMessage = String(
          body.invitationMessage ||
            `Voluntary donor call-out from ${hospitalName}: ${requestedComponent} urgently needed. Your identity and medical info remain private.`
        );

        const allDonors = await db.select().from(donors);
        const eligibleInRadius = allDonors.filter((d) => {
          if (!d.locationSharingEnabled || !d.contactInvitationOptIn) return false;
          const dist = haversineKm(originLat, originLng, d.approxLat, d.approxLng);
          return dist <= radiusKm;
        });

        const [broadcast] = await db
          .insert(radarBroadcasts)
          .values({
            referenceNumber: refNum,
            hospitalName,
            originLat,
            originLng,
            radiusKm,
            requestedComponent,
            requiredQuantity,
            urgency,
            requiredDate,
            invitationMessage,
            invitedDonorsCount: eligibleInRadius.length,
            responsesCount: 0,
            acceptedCount: 0,
            status: "Active",
            createdBy: String(body.createdBy || "Authorized BloodLink Coordinator"),
          })
          .returning();

        // Dispatch anonymous invitations to up to 6 opted-in donors in radius (always include primary mobile donor #1 if opted in!)
        const primaryDonor = allDonors[0];
        const targetDonors = eligibleInRadius.slice(0, 6);
        if (
          primaryDonor &&
          primaryDonor.locationSharingEnabled &&
          primaryDonor.contactInvitationOptIn &&
          !targetDonors.some((d) => d.id === primaryDonor.id)
        ) {
          targetDonors.unshift(primaryDonor);
        }

        for (const d of targetDonors) {
          const approxDist = haversineKm(originLat, originLng, d.approxLat, d.approxLng);
          await db.insert(radarResponses).values({
            broadcastId: broadcast.id,
            referenceNumber: broadcast.referenceNumber,
            donorId: d.id,
            donorCode: d.donorCode,
            anonymousToken: d.anonymousToken,
            approxDistanceKm: approxDist,
            responseStatus: "Pending",
            consentToShareDetails: false,
            assignedVerificationCenter: "PRC National Blood Center - Port Area, Manila",
            respondedAt: "—",
          });

          await db.insert(notifications).values({
            targetPortal: "Donor",
            donorId: d.id,
            hospitalName,
            category: "Emergency Invitation",
            title: `Emergency Donor Invitation — ${hospitalName} (~${approxDist} km)`,
            message: `${requestedComponent} (${urgency}) needed by ${requiredDate}. Respond voluntarily in the app; your blood type and identity are never automatically exposed.`,
            isRead: false,
            referenceCode: broadcast.referenceNumber,
            createdAtLabel: "Just now",
          });
        }

        return NextResponse.json({
          ok: true,
          broadcast,
          invitedCount: eligibleInRadius.length,
        });
      }

      case "respond_radar_invitation": {
        const responseId = Number(body.responseId);
        const decision = String(body.decision); // Accepted | Declined
        const consentToShareDetails = Boolean(body.consentToShareDetails ?? false);

        const respRows = await db
          .select()
          .from(radarResponses)
          .where(eq(radarResponses.id, responseId));
        if (!respRows[0]) {
          return NextResponse.json({ error: "Invitation response record not found" }, { status: 404 });
        }
        const curResp = respRows[0];

        const [updatedResp] = await db
          .update(radarResponses)
          .set({
            responseStatus: decision,
            consentToShareDetails: decision === "Accepted" ? consentToShareDetails : false,
            respondedAt: "2026-04-12 11:40 AM",
          })
          .where(eq(radarResponses.id, responseId))
          .returning();

        // Recompute broadcast counters accurately
        const siblingResponses = await db
          .select()
          .from(radarResponses)
          .where(eq(radarResponses.broadcastId, curResp.broadcastId));

        const answeredCount = siblingResponses.filter((r) => r.responseStatus !== "Pending").length;
        const acceptedTotal = siblingResponses.filter((r) => r.responseStatus === "Accepted").length;

        const [updatedBroadcast] = await db
          .update(radarBroadcasts)
          .set({
            responsesCount: answeredCount,
            acceptedCount: acceptedTotal,
          })
          .where(eq(radarBroadcasts.id, curResp.broadcastId))
          .returning();

        if (decision === "Accepted" && updatedBroadcast) {
          await db.insert(notifications).values({
            targetPortal: "Admin",
            donorId: null,
            hospitalName: updatedBroadcast.hospitalName,
            category: "Emergency Invitation",
            title: `Voluntary Donor Accepted Radar Call-Out (${curResp.referenceNumber})`,
            message: `Anonymous donor ${curResp.anonymousToken} (~${curResp.approxDistanceKm} km) accepted voluntary screening at ${curResp.assignedVerificationCenter}.`,
            isRead: false,
            referenceCode: curResp.referenceNumber,
            createdAtLabel: "Just now",
          });
        }

        return NextResponse.json({ ok: true, response: updatedResp, broadcast: updatedBroadcast });
      }

      case "add_blood_center": {
        const suffix = Math.floor(10 + Math.random() * 89);
        const [created] = await db
          .insert(bloodCenters)
          .values({
            centerCode: `BC-MM-0${suffix}`,
            name: String(body.name || "PRC Mobile Blood Collection Drive"),
            chapter: String(body.chapter || "Metro Manila Chapter"),
            facilityType: String(body.facilityType || "Mobile Collection Drive"),
            address: String(body.address || "Metro Manila Civic Plaza"),
            city: String(body.city || "Quezon City"),
            lat: Number(body.lat || 14.615),
            lng: Number(body.lng || 121.035),
            contactPhone: String(body.contactPhone || "(02) 8790-2300"),
            operatingHours: String(body.operatingHours || "08:00 AM – 05:00 PM"),
            activeDriveTitle: String(body.activeDriveTitle || "Community Voluntary Blood Drive"),
            driveDate: String(body.driveDate || "2026-04-22 • 08:00 AM – 04:00 PM"),
            driveTargetUnits: Number(body.driveTargetUnits || 100),
            driveCollectedUnits: 0,
            storageCapacityStatus: "Cold-Chain Validated",
            status: "Active",
          })
          .returning();

        return NextResponse.json({ ok: true, center: created });
      }

      case "add_user": {
        const suffix = Math.floor(100 + Math.random() * 899);
        const [created] = await db
          .insert(users)
          .values({
            staffCode: `BL-STF-${suffix}`,
            fullName: String(body.fullName),
            email: String(body.email),
            role: String(body.role || "Blood Center Staff"),
            facility: String(body.facility || "PRC National Blood Center - Port Area"),
            department: String(body.department || "Blood Services"),
            status: String(body.status || "Verified"),
            lastLogin: "Pending First Sign-In",
          })
          .returning();
        return NextResponse.json({ ok: true, user: created });
      }

      case "update_user_status": {
        const id = Number(body.id);
        const [updated] = await db
          .update(users)
          .set({ status: String(body.status) })
          .where(eq(users.id, id))
          .returning();
        return NextResponse.json({ ok: true, user: updated });
      }

      case "mark_notifications_read": {
        const portal = String(body.targetPortal || "Admin");
        await db
          .update(notifications)
          .set({ isRead: true })
          .where(eq(notifications.targetPortal, portal));
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/bloodlink failed:", error);
    return NextResponse.json(
      { error: "Failed to process clinical action" },
      { status: 500 }
    );
  }
}
