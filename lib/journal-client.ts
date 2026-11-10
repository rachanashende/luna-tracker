import type { JournalEntry, JournalInput, JournalStats } from "./journal-types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof json?.error === "string" ? json.error : `Request failed (${res.status})`,
    );
  }
  return json as T;
}

export async function fetchEntries(params: {
  start?: string;
  end?: string;
  q?: string;
}): Promise<JournalEntry[]> {
  const sp = new URLSearchParams();
  if (params.start) sp.set("start", params.start);
  if (params.end) sp.set("end", params.end);
  if (params.q) sp.set("q", params.q);
  const { entries } = await request<{ entries: JournalEntry[] }>(
    `/api/journal?${sp.toString()}`,
  );
  return entries;
}

export function fetchStats(today: string): Promise<JournalStats> {
  return request<JournalStats>(`/api/journal?stats=1&today=${today}`);
}

export async function createEntry(input: JournalInput): Promise<JournalEntry> {
  const { entry } = await request<{ entry: JournalEntry }>("/api/journal", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return entry;
}

export async function updateEntry(
  id: string,
  input: Partial<JournalInput>,
): Promise<JournalEntry> {
  const { entry } = await request<{ entry: JournalEntry }>(`/api/journal/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  await request<{ ok: true }>(`/api/journal/${id}`, { method: "DELETE" });
}
