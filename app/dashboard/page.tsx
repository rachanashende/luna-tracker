// TODO(Module 2 — Dashboard):
// Replace this placeholder with overview cards: today's date, today's
// events (from the `events` table once Module 3 exists), and quick stats.
// This is the page you land on after logging in — Module 1's job was just
// to make sure it renders inside the nav shell with the theme applied.
import { PlaceholderPage } from "@/components/placeholder-page";

export default function DashboardPage() {
  return (
    <PlaceholderPage
      emoji="🗂️"
      title="Dashboard"
      description="Your overview cards will live here once Module 2 is built — today's events, quick stats, and shortcuts into the rest of the tracker."
      moduleLabel="Module 2"
      tagColor="pink"
    />
  );
}
