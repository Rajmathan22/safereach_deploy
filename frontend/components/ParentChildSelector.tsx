'use client';

import { useParentActiveChild, travelStatusClass, travelStatusIcon, travelStatusLabel } from '@/lib/studentTravel';
import { useInstitutionType } from '@/lib/institutionType';

export default function ParentChildSelector() {
  const { children, activeChild, activeChildId, selectChild } = useParentActiveChild();
  const institutionType = useInstitutionType(activeChild?.schoolId);

  if (children.length <= 1 && !activeChild) {
    return null;
  }

  return (
    <div className="bg-surface-container-lowest border-b border-outline-variant/30 px-container-padding-mobile md:px-container-padding-desktop py-2.5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">family_restroom</span>
          <span className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
            Active Child Context:
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {children.map(child => {
            const isSelected = child.id === activeChildId;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => selectChild(child.id)}
                className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full font-label-md transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                    : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/60'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                }`}>
                  {child.avatar || child.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="font-bold">{child.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {child.className}-{child.section}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isSelected ? 'bg-emerald-400 text-emerald-950' : travelStatusClass(child.status)
                }`}>
                  <span className="material-symbols-outlined text-[12px]">{travelStatusIcon(child.status)}</span>
                  {travelStatusLabel(child.status, 'parent', institutionType)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
