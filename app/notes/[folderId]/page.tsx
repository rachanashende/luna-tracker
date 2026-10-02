import FolderView from "@/components/notes/folder-view";

export const metadata = { title: "Course · Luna" };

export default async function CoursePage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;
  return <FolderView folderId={folderId} />;
}
