'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBackendBootstrap } from '@/lib/backendData';
import { useSafetyProtocols } from '@/lib/safetyProtocols';
import TeacherStudentsPage, { TeacherStudentDashboardSummary } from '../students/page';

export default function TeacherDashboardPage() {
  const { data: bootstrap } = useBackendBootstrap();
  const {
    protocols,
    loading: protocolsLoading,
    error: protocolsError,
    add: addProtocolRow,
    update: updateProtocol,
    remove: removeProtocol,
    submit: submitProtocolRows,
  } = useSafetyProtocols('teacher');
  const [checkedProtocolIds, setCheckedProtocolIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [newProtocol, setNewProtocol] = useState('');
  const [notice, setNotice] = useState('');
  const [dayIndex, setDayIndex] = useState(0);
  const [timetableData, setTimetableData] = useState(bootstrap.timetable);

  useEffect(() => {
    if (bootstrap.timetable?.days?.length) {
      setTimetableData(bootstrap.timetable);
    }
    const onUpdate = (e: any) => {
      if (e?.detail) setTimetableData(e.detail);
    };
    window.addEventListener('safereach-timetable-updated', onUpdate);
    return () => window.removeEventListener('safereach-timetable-updated', onUpdate);
  }, [bootstrap.timetable]);

  const timetableDays = timetableData.days || [];
  const activeDay = timetableDays[dayIndex] ?? timetableDays[0] ?? { label: 'Monday', periods: [] };
  const timetableClassLabel = timetableData.className && timetableData.section
    ? `${timetableData.className}-${timetableData.section}`
    : 'Class 4-B';
  const teacherPeriods = useMemo(() => activeDay.periods.map(period => ({
    subject: period,
    classLabel: period && period !== '-' && period !== 'Free' ? timetableClassLabel : 'Free Hour',
  })), [activeDay.periods, timetableClassLabel]);

  useEffect(() => {
    function resetIfNewDay() {
      const today = new Date().toISOString().slice(0, 10);
      const storageKey = 'safereach-teacher-protocol-reset-date';
      if (window.localStorage.getItem(storageKey) !== today) {
        setCheckedProtocolIds([]);
        window.localStorage.setItem(storageKey, today);
      }
    }

    resetIfNewDay();
    const timer = window.setInterval(resetIfNewDay, 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setCheckedProtocolIds(protocols.filter(protocol => protocol.checked).map(protocol => protocol.id));
  }, [protocols]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  }

  function beginEdit(id: string, label: string) {
    setEditingId(id);
    setEditText(label);
  }

  async function saveProtocol() {
    if (editingId === null || editText.trim() === '') return;
    try {
      await updateProtocol(editingId, { label: editText.trim() });
      showNotice('Safety protocol updated in backend.');
    } catch (reason) {
      showNotice(reason instanceof Error ? reason.message : 'Safety protocol update failed.');
    }
    setEditingId(null);
    setEditText('');
  }

  async function submitProtocols() {
    try {
      await submitProtocolRows(checkedProtocolIds);
      showNotice('Checked safety protocols submitted to backend.');
    } catch (reason) {
      showNotice(reason instanceof Error ? reason.message : 'Safety protocol submit failed.');
    }
  }

  async function addProtocol() {
    if (!newProtocol.trim()) return;
    try {
      await addProtocolRow(newProtocol.trim());
      setNewProtocol('');
      showNotice('Safety protocol added to backend.');
    } catch (reason) {
      showNotice(reason instanceof Error ? reason.message : 'Safety protocol add failed.');
    }
  }

  async function deleteProtocol(id: string, label: string) {
    if (!window.confirm(`Delete safety protocol "${label}"?`)) return;
    try {
      await removeProtocol(id);
      setCheckedProtocolIds(current => current.filter(itemId => itemId !== id));
      showNotice('Safety protocol deleted in backend.');
    } catch (reason) {
      showNotice(reason instanceof Error ? reason.message : 'Safety protocol delete failed.');
    }
  }

  function previousDay() {
    setDayIndex(current => (current === 0 ? Math.max(timetableDays.length - 1, 0) : current - 1));
  }

  function nextDay() {
    setDayIndex(current => timetableDays.length === 0 ? 0 : (current + 1) % timetableDays.length);
  }

  useEffect(() => {
    if (dayIndex >= timetableDays.length) setDayIndex(0);
  }, [dayIndex, timetableDays.length]);

  return (
    <div className="p-container-padding-mobile md:p-container-padding-desktop pb-6">
      <section className="grid grid-cols-1 gap-gutter items-start">
        <div className="min-w-0 flex flex-col gap-gutter">
          <TeacherStudentDashboardSummary />
          <div className="mt-4 grid grid-cols-1 items-start gap-3 md:mt-6 md:gap-4 lg:grid-cols-[minmax(300px,360px)_minmax(360px,520px)] lg:justify-center">
            <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-xl border border-outline-variant bg-surface p-stack-md shadow-sm xl:mx-0">
              <div className="flex items-center justify-between gap-3 mb-4">
                <button type="button" onClick={previousDay} className="h-10 w-10 rounded-full bg-surface-container text-primary flex items-center justify-center hover:bg-primary/10" aria-label="Previous day">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="text-center">
                  <h3 className="font-headline-md text-headline-md text-primary">Teacher Timetable</h3>
                  <p className="text-label-md text-on-surface-variant">{activeDay.label} allocation for Sarah Jenkins</p>
                </div>
                <button type="button" onClick={nextDay} className="h-10 w-10 rounded-full bg-surface-container text-primary flex items-center justify-center hover:bg-primary/10" aria-label="Next day">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-outline-variant">
                <table className="w-full table-fixed border-collapse text-center">
                  <thead className="bg-primary text-on-primary">
                    <tr>
                      <th className="w-16 px-2 py-3 font-bold border-r border-white/20">Hour</th>
                      <th className="px-2 py-3 font-bold">Class</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherPeriods.map((period, index) => (
                      <tr key={`${activeDay.label}-${index}`} className={index % 2 === 0 ? 'bg-primary/5' : 'bg-surface'}>
                        <td className="px-2 py-3 font-bold text-primary border-r border-outline-variant">{index + 1}</td>
                        <td className={`px-2 py-3 font-label-md ${period.classLabel === '-' ? 'text-on-surface-variant' : 'text-on-surface font-bold'}`}>
                          <span className="block">{period.classLabel}</span>
                          {period.classLabel !== '-' && <span className="block text-[11px] font-normal text-on-surface-variant">{period.subject}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-stack-md md:p-stack-lg shadow-sm w-full">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                <h3 className="font-headline-md text-headline-md text-primary">Safety Protocols</h3>
              </div>
              {notice && <div className="mb-3 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-label-md font-bold text-green-700">{notice}</div>}
              {protocolsLoading && <p className="text-label-md text-on-surface-variant">Loading safety protocols from backend...</p>}
              {protocolsError && <p className="rounded-lg border border-error/30 bg-error-container/30 p-3 text-label-md font-bold text-error">{protocolsError}</p>}
              <div className="flex flex-col gap-3">
                {protocols.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
                    <input
                      checked={checkedProtocolIds.includes(item.id)}
                      onChange={async e => {
                        setCheckedProtocolIds(current => e.target.checked ? [...current, item.id] : current.filter(itemId => itemId !== item.id));
                        try {
                          await updateProtocol(item.id, { checked: e.target.checked });
                        } catch (reason) {
                          showNotice(reason instanceof Error ? reason.message : 'Safety protocol check failed.');
                        }
                      }}
                      className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
                      type="checkbox"
                    />
                    <span className={`font-label-md text-label-md text-on-surface flex-1 ${item.submitted ? 'line-through text-on-surface-variant' : ''}`}>{item.label}</span>
                    <button onClick={() => beginEdit(item.id, item.label)} className="p-1 rounded hover:bg-primary/10 text-primary" title="Edit protocol"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                    <button onClick={() => deleteProtocol(item.id, item.label)} className="p-1 rounded hover:bg-error-container text-error" title="Delete protocol"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  </div>
                ))}
              </div>
              {editingId !== null && (
                <div className="mt-4 flex gap-2">
                  <input className="flex-1 bg-white border border-outline-variant rounded-lg px-3 py-2 text-label-md min-w-0" value={editText} onChange={e => setEditText(e.target.value)} />
                  <button onClick={saveProtocol} className="px-3 py-2 bg-primary text-on-primary rounded-lg font-bold">Save</button>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <input className="flex-1 min-w-0 bg-white border border-outline-variant rounded-lg px-3 py-2 text-label-md" value={newProtocol} onChange={e => setNewProtocol(e.target.value)} placeholder="Add new safety protocol" />
                <button onClick={addProtocol} className="px-3 py-2 bg-secondary text-on-secondary rounded-lg font-bold">Add</button>
              </div>
              <button onClick={submitProtocols} className="mt-4 w-full py-2 bg-primary text-on-primary rounded-lg font-bold">Submit Checked Protocols</button>
              <div className="mt-6 p-4 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg text-label-sm flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                <span>Remember to verify all ID badges before hand-off to unauthorized guardians.</span>
              </div>
            </div>
          </div>
          <TeacherStudentsPage mode="dashboard" />
        </div>
      </section>
    </div>
  );
}
