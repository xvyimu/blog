import fs from 'fs';
import path from 'path';
import { Project } from '@/types';
import { CONTENT_DIR } from './constants';

const PROJECTS_FILE = path.join(process.cwd(), CONTENT_DIR.projects);

export function getAllProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_FILE)) {
    console.warn(`[projects.ts] 数据文件不存在: ${PROJECTS_FILE}`);
    return [];
  }
  const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
  const data: Project[] = JSON.parse(raw);
  return data.sort((a, b) => b.year - a.year);
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((p) => p.featured);
}

export function getProjectById(id: string): Project | null {
  return getAllProjects().find((p) => p.id === id) ?? null;
}

export function getAllProjectIds(): string[] {
  return getAllProjects().map((p) => p.id);
}