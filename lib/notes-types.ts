// Shared types + constants for the Notes module (Module 4):
// course folders that hold uploaded note files, Google-Classroom style.

/** A row in `note_folders` — one per course. */
export interface NoteFolder {
  id: string;
  name: string;
  description: string; // section / subject line shown under the name
  color: string; // hex banner colour
  icon: string; // emoji
  created_at: string;
  /** Added by GET /api/notes/folders. */
  file_count?: number;
}

/** A row in `notes` — one per uploaded file. (file_path is never sent to the client.) */
export interface NoteFile {
  id: string;
  folder_id: string;
  title: string; // display name, editable (defaults to the file name)
  file_name: string; // original file name
  file_type: string; // mime type
  file_size: number; // bytes
  created_at: string;
  updated_at: string;
}

export const NOTE_FILE_COLUMNS =
  "id, folder_id, title, file_name, file_type, file_size, created_at, updated_at";

export interface FolderInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UploadUrlRequest {
  folder_id: string;
  file_name: string;
  file_size: number;
}

export interface UploadUrlResponse {
  path: string;
  token: string;
  content_type: string;
}

export interface RegisterFileRequest {
  folder_id: string;
  path: string;
  file_name: string;
  file_size: number;
  title?: string;
}

export interface UpdateFileRequest {
  title?: string;
  folder_id?: string; // move to another course
}

export const FOLDER_NAME_MAX = 80;
export const FOLDER_DESC_MAX = 120;
export const FILE_TITLE_MAX = 200;
export const NOTES_BUCKET = "notes";

// Pastel palette from BUILD_SPEC (tags) plus a few matching extras.
export const FOLDER_COLORS = [
  "#F7C8D2", // baby pink
  "#B8D4F0", // sky
  "#AEE1D6", // mint
  "#FBE7B2", // butter
  "#D8CCF1", // lavender
  "#F9D3B4", // peach
  "#D4E8B0", // lime
  "#E9C4C4", // dusty rose
] as const;

export const FOLDER_ICONS = [
  "📚", "📐", "🧪", "💻", "🧬", "📜", "🎨", "🌍",
  "⚙️", "📊", "✍️", "🧠", "🔬", "🎵", "⚖️", "🏛️",
] as const;

export const DEFAULT_FOLDER_COLOR = FOLDER_COLORS[0];
export const DEFAULT_FOLDER_ICON = FOLDER_ICONS[0];
export const FOLDER_TEXT_COLOR = "#3D2B24"; // dark espresso — readable on every pastel
