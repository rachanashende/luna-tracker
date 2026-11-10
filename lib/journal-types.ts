export type JournalEntry = {
  id: string;
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  mood: string | null;
  body: string;
  created_at: string;
  updated_at: string | null;
};

export type JournalInput = {
  date: string;
  mood: string | null;
  body: string;
};

export type JournalStats = {
  /** Consecutive days with an entry, ending today (0 if today isn't logged yet) */
  streak: number;
  total: number;
};
