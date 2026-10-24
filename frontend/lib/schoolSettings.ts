'use client';

import { useEffect, useState } from 'react';
import { apiBaseUrl } from './runtimeConfig';

export type SchoolSettings = {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: string;
  /** 'school' | 'college'; absent on legacy rows → treated as 'school'. */
  institution_type?: string;
  school_open_time: string;
  school_close_time: string;
};

const emptySettings: SchoolSettings = {
  id: '',
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  country: '',
  phone: '',
  email: '',
  status: 'active',
  institution_type: 'school',
  school_open_time: '08:00:00',
  school_close_time: '16:30:00',
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.message || `Backend returned ${response.status}`);
  }
  return payload as T;
}

function trimTime(value: string | undefined) {
  return (value || '').slice(0, 5) || '08:00';
}

export function useSchoolSettings() {
  const [settings, setSettings] = useState<SchoolSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const row = await apiRequest<SchoolSettings>('/school-settings');
      setSettings(row);
      setError('');
    } catch (reason) {
      setSettings(emptySettings);
      setError(reason instanceof Error ? reason.message : 'School settings unavailable');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function save(payload: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    status: string;
    schoolOpenTime: string;
    schoolCloseTime: string;
  }>) {
    const updated = await apiRequest<SchoolSettings>('/school-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setSettings(updated);
    return updated;
  }

  return {
    settings,
    loading,
    error,
    refresh,
    save,
    openTime: trimTime(settings.school_open_time),
    closeTime: trimTime(settings.school_close_time),
  };
}
