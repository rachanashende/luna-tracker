// Shared types for the Notes module (Module 4).

/** A row in the `notes` table. */
export interface Note {
  id: string;
  title: string;
  body: string;
  created_at: string; // ISO timestamp (timestamptz)
  updated_at: string; // ISO timestamp (timestamptz)
}

/** POST /api/notes body. */
export interface CreateNoteRequest {
  title?: string;
  body?: string;
}

/** PATCH /api/notes/[id] body — send only the fields being changed. */
export interface UpdateNoteRequest {
  title?: string;
  body?: string;
}

export interface NotesListResponse {
  notes: Note[];
}

export interface NoteResponse {
  note: Note;
}

export interface ApiError {
  error: string;
}

export const NOTE_TITLE_MAX = 200;
export const NOTE_BODY_MAX = 50_000;
export const NOTE_SEARCH_MAX = 100;
export const UNTITLED = "Untitled";
