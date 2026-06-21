export const SITE_CONFIG = {
  name: '西江月的博客',
  description: '写代码，偶尔写写东西。',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  author: {
    name: '西江月',
    avatar: '/images/avatar.jpg',
  },
  social: {
    github: 'https://github.com/yuanjia1314',
    twitter: '',
    email: '',
  },
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? 'yuanjia1314/blog',
  },
} as const;

export const CONTENT_DIR = {
  blog: 'content/blog',
  about: 'content/about.mdx',
  projects: 'data/projects.json',
} as const;

export const PAGE_SIZE = 12; // 博客列表每页文章数
