import { z } from 'zod';
import { Project } from '@/types';
import { CONTENT_DIR } from './content-dirs';
import type { ContentSource } from './content-source';
import { filesystemSource } from './content-source';
import { createJsonContentRepository } from './json-content-repository';

/**
 * projects 模块 — 读取 + 校验 data/projects.json.
 *
 * 通过 createProjectsRepository(source) 注入 ContentSource, 测试可传 in-memory source.
 * 默认实例 projectsRepository 使用 filesystemSource.
 */

const httpsUrl = z
  .string()
  .optional()
  .refine((v) => !v || /^https?:\/\//.test(v), 'URL must start with http:// or https://');

const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  url: httpsUrl.optional().transform((v) => (v ? v : undefined)),
  github: httpsUrl.optional().transform((v) => (v ? v : undefined)),
  image: z.string().optional(),
  featured: z.boolean(),
  year: z.number().int().positive(),
});

export function parseProjects(raw: unknown): Project[] {
  const arr = z.array(ProjectSchema).parse(raw);
  return arr.sort((a, b) => b.year - a.year);
}

export interface ProjectsRepository {
  /** 获取全部项目 (按年份倒序, 含缓存) */
  getAll(): Project[];
  /** 获取置顶项目 */
  getFeatured(): Project[];
  /** 根据 id 查找单个项目 */
  getById(id: string): Project | null;
  /** 获取全部项目 id (用于 generateStaticParams) */
  getAllIds(): string[];
}

export function createProjectsRepository(source: ContentSource): ProjectsRepository {
  const content = createJsonContentRepository<Project[]>({
    source,
    path: CONTENT_DIR.projects,
    label: 'projects',
    // Production: fail-fast on missing/corrupt JSON (see createJsonContentRepository mode).
    fallback: () => [],
    parse: parseProjects,
  });

  function getAll(): Project[] {
    return content.getAll();
  }

  function getFeatured(): Project[] {
    return getAll().filter((p) => p.featured);
  }

  function getById(id: string): Project | null {
    return getAll().find((p) => p.id === id) ?? null;
  }

  function getAllIds(): string[] {
    return getAll().map((p) => p.id);
  }

  return { getAll, getFeatured, getById, getAllIds };
}

/** 默认 ProjectsRepository 实例 (基于 filesystemSource). */
export const projectsRepository = createProjectsRepository(filesystemSource);

/**
 * 向后兼容便捷函数 — 委托给默认 projectsRepository.
 * app/ 调用方可逐步迁移到 projectsRepository.getAll() 等.
 */
export function getAllProjects(): Project[] {
  return projectsRepository.getAll();
}

export function getFeaturedProjects(): Project[] {
  return projectsRepository.getFeatured();
}

export function getProjectById(id: string): Project | null {
  return projectsRepository.getById(id);
}

export function getAllProjectIds(): string[] {
  return projectsRepository.getAllIds();
}
