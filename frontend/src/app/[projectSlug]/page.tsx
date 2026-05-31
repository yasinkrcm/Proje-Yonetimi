import { notFound } from "next/navigation";
import { getProjectAction } from "@/app/data";
import ProjectBoard from "@/components/ProjectBoard";

interface Props {
  params: Promise<{ projectSlug: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectSlug } = await params;
  const result = await getProjectAction(projectSlug);

  if (!result.success) {
    notFound();
  }

  return (
    <ProjectBoard
      projectId={projectSlug}
      projectKey={result.data.key}
      projectName={result.data.name}
    />
  );
}
