'use client';

import { useBackendBootstrap } from './backendData';

/**
 * A registered institution is either a school or a college. The backend stores
 * this as `schools.institution_type` ('school' | 'college'); legacy rows and
 * callers without the field normalise to 'school' so every existing flow keeps
 * rendering exactly the same wording it does today.
 */
export type InstitutionType = 'school' | 'college';

export function normalizeInstitutionType(value?: string | null): InstitutionType {
  return value === 'college' ? 'college' : 'school';
}

/** Human-readable singular label, e.g. "School" / "College". */
export function institutionLabel(type: InstitutionType = 'school'): string {
  return type === 'college' ? 'College' : 'School';
}

/**
 * Wording map for the shared student-travel lifecycle. Status codes stay
 * identical for both institution types (reached_school, going_home, ...);
 * only the display text adapts so colleges are not labelled as schools.
 */
export function institutionWording(type: InstitutionType = 'school') {
  const noun = type === 'college' ? 'College' : 'School';
  const nounLower = noun.toLowerCase();
  return {
    noun,
    nounLower,
    departedFromHome: 'Departed Home',
    onTravelTo: `On Travel to ${noun}`,
    trackingTo: `Tracking to ${nounLower}`,
    reachedSafely: `Reached ${noun} Safely`,
    reached: `Reached ${noun}`,
    reachedLocation: `Reached ${nounLower} campus`,
    atLocation: `SafeReach at ${nounLower}`,
    notReached: `Not reached ${nounLower}`,
    outOf: `Out of ${noun}`,
    goingHome: 'Going Home',
    reachedHome: 'Reached Home',
    safeAtHome: 'Safe at Home',
    startTrip: `Start Trip to ${noun}`,
    trackingToLower: `Tracking to ${nounLower}`,
  };
}

/**
 * Resolve the institution type for the current workspace. Pass a schoolId to
 * target a specific institution; without one, the first registered institution
 * is used (matching how /school-settings resolves its default). Returns
 * 'school' until bootstrap data loads, so school environments never flash
 * alternate wording.
 */
export function useInstitutionType(schoolId?: string): InstitutionType {
  const { data } = useBackendBootstrap();
  const schools = data.schools ?? [];
  const match = (schoolId && schools.find(item => item.id === schoolId)) || schools[0];
  return normalizeInstitutionType(match?.institution_type);
}
