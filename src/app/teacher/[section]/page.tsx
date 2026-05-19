import { notFound } from "next/navigation";
import { PortalPage } from "@/components/prototype/PortalPage";
import { teacherSections } from "@/components/prototype/portalData";

export function generateStaticParams() {
  return teacherSections.map((item) => ({ section: item.key }));
}

export default async function TeacherSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!teacherSections.some((item) => item.key === section)) {
    notFound();
  }

  return <PortalPage role="teacher" activeSection={section} />;
}
