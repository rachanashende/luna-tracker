// TODO(Module 5 — Journal):
// Entry form (date, mood tag using the pastel category colors, free text)
// plus a past-entries view, backed by the `journal` table. Open decision to
// answer at the start of that module: one entry per day max, or multiple
// entries per day allowed.
import { PlaceholderPage } from "@/components/placeholder-page";

export default function JournalPage() {
  return (
    <PlaceholderPage
      emoji="📔"
      title="Journal"
      description="Daily mood + text entries and a browsable history land in Module 5."
      moduleLabel="Module 5"
      tagColor="green"
    />
  );
}
