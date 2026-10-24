'use client';

import Link from '@/src/next-link';
import { travelStatusClass, travelStatusIcon, travelStatusLabel, useStudentTravelState } from '@/lib/studentTravel';
import { useInstitutionType } from '@/lib/institutionType';

const childProfiles: Record<string, {
  dateOfBirth: string;
  bloodGroup: string;
  address: string;
  emergency: string;
  route: string;
  pickup: string;
  medical: string;
  allergies: string;
  authorizedPickup: string[];
}> = {
  'st-leo-thompson': {
    dateOfBirth: '14 March 2017',
    bloodGroup: 'O+',
    address: '42 Sunrise Colony, Mumbai',
    emergency: '+1 (555) 012-3456',
    route: 'Blue Route - Stop 04',
    pickup: 'Gate 2 family pickup',
    medical: 'Asthma inhaler in school clinic',
    allergies: 'Severe nut allergy',
    authorizedPickup: ['Sarah Thompson', 'David Thompson'],
  },
  'st-maya-thompson': {
    dateOfBirth: '22 August 2019',
    bloodGroup: 'A+',
    address: '42 Sunrise Colony, Mumbai',
    emergency: '+1 (555) 019-8765',
    route: 'Blue Route - Stop 04',
    pickup: 'Gate 1 family pickup',
    medical: 'No active medical note',
    allergies: 'No known allergies',
    authorizedPickup: ['Sarah Thompson', 'David Thompson'],
  },
};

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container/50 rounded-lg p-3">
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="font-bold text-on-background break-words">{value}</p>
    </div>
  );
}

export default function ParentChildRecordsPage() {
  const { parentChildren } = useStudentTravelState();
  const selectedChild = parentChildren[0] ?? null;
  const institutionType = useInstitutionType(selectedChild?.schoolId);

  const profile = selectedChild ? childProfiles[selectedChild.id] ?? {
    dateOfBirth: 'Not updated',
    bloodGroup: 'Not updated',
    address: 'Not updated',
    emergency: selectedChild.parentPhone,
    route: 'Not assigned',
    pickup: 'School pickup desk',
    medical: 'No active medical note',
    allergies: 'No known allergies',
    authorizedPickup: [selectedChild.parentName],
  } : null;

  return (
    <div className="px-container-padding-mobile md:px-container-padding-desktop py-stack-lg space-y-stack-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-headline-lg text-headline-lg text-primary">Child Records</h3>
          <p className="text-body-md text-on-surface-variant">Full child details for your linked student.</p>
        </div>
        <Link href="/parent/dashboard" className="w-fit px-4 py-2 border border-outline-variant rounded-lg text-primary font-bold hover:bg-surface-container">Back</Link>
      </div>

      {selectedChild && profile && (
        <>
          <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-primary-container flex items-center justify-center text-primary font-bold">{selectedChild.avatar}</div>
                <div>
                  <h4 className="font-headline-md text-primary">{selectedChild.name}</h4>
                  <p className="text-label-md text-on-surface-variant">{selectedChild.className} - Section {selectedChild.section}</p>
                  <p className="text-label-sm text-on-surface-variant">Student ID: {selectedChild.roll}</p>
                </div>
              </div>
              <span className={`${travelStatusClass(selectedChild.status)} w-fit px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1`}>
                <span className="material-symbols-outlined text-[14px]">{travelStatusIcon(selectedChild.status)}</span>
                {travelStatusLabel(selectedChild.status, 'parent', institutionType)}
              </span>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md">
              <h4 className="font-headline-md text-primary mb-4">Personal Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailCard label="Date of Birth" value={profile.dateOfBirth} />
                <DetailCard label="Blood Group" value={profile.bloodGroup} />
                <DetailCard label="Address" value={profile.address} />
                <DetailCard label="Emergency Contact" value={profile.emergency} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md">
              <h4 className="font-headline-md text-primary mb-4">School Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailCard label="Class Teacher" value={selectedChild.teacherName} />
                <DetailCard label="Guardian" value={selectedChild.parentName} />
                <DetailCard label="Route" value={profile.route} />
                <DetailCard label="Pickup Point" value={profile.pickup} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md">
              <h4 className="font-headline-md text-primary mb-4">Safety & Medical</h4>
              <div className="grid grid-cols-1 gap-3">
                <DetailCard label="Medical Note" value={profile.medical} />
                <DetailCard label="Allergies" value={profile.allergies} />
                <DetailCard label="Current Safety Status" value={selectedChild.absenceReasonRequested ? 'Absence reason requested from parent' : 'No open alerts'} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md">
              <h4 className="font-headline-md text-primary mb-4">Travel & Communication</h4>
              <div className="grid grid-cols-1 gap-3">
                <DetailCard label="Current Location" value={selectedChild.location} />
                <DetailCard label="Last Updated" value={selectedChild.updatedAt} />
                <DetailCard label="Parent Phone" value={selectedChild.parentPhone} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-stack-md">
            <h4 className="font-headline-md text-primary mb-4">Authorized Pickup People</h4>
            <div className="flex flex-wrap gap-2">
              {profile.authorizedPickup.map(person => (
                <span key={person} className="rounded-full bg-primary/10 px-3 py-1 text-label-md font-bold text-primary">{person}</span>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
