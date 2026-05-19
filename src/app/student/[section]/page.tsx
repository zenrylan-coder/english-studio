import { notFound } from "next/navigation";
import { PortalPage } from "@/components/prototype/PortalPage";
import { studentSections } from "@/components/prototype/portalData";

export function generateStaticParams() {
  return studentSections.map((item) => ({ section: item.key }));
}

export default async function StudentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!studentSections.some((item) => item.key === section)) {
    notFound();
  }

  return <PortalPage role="student" activeSection={section} />;
}
