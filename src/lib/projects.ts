/*
  Loads the projects from src/content/projects/ for the pages to use.
*/

import { getCollection, type CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;

const typeLabels: Record<Project["data"]["type"], string> = {
  personal: "Personal",
  class: "Class",
  hackathon: "Hackathon",
  club: "Club",
};

/** All projects, newest first. Drafts are included only while previewing locally. */
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection(
    "projects",
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  return projects.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function yearOf(project: Project): number {
  return project.data.date.getUTCFullYear();
}

export function typeLabel(project: Project): string {
  return typeLabels[project.data.type];
}
