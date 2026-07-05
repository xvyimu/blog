import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LinksDirectory } from './LinksDirectory';
import type { LinkCategory } from '@/types';

const categories: LinkCategory[] = [
  {
    id: 'ai',
    title: 'AI 工具',
    description: '常用 AI 产品与开发平台',
    items: [
      {
        title: 'OpenAI',
        url: 'https://www.openai.com/',
        description: '模型、API 与产品入口',
        tags: ['model', 'api'],
      },
      {
        title: 'Claude',
        url: 'https://claude.ai/',
        description: '长上下文写作与代码分析',
      },
    ],
  },
  {
    id: 'vps',
    title: 'VPS',
    description: '云服务器与网络工具',
    items: [
      {
        title: 'Hetzner',
        url: 'https://www.hetzner.com/',
        description: '欧洲云服务器官网',
      },
    ],
  },
];

describe('LinksDirectory', () => {
  it('renders collection metrics and category index links', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: '链接分类' });
    expect(within(nav).getByRole('link', { name: 'AI 工具 2 个' })).toHaveAttribute(
      'href',
      '#ai',
    );
    expect(within(nav).getByRole('link', { name: 'VPS 1 个' })).toHaveAttribute(
      'href',
      '#vps',
    );
  });

  it('renders category counts and normalized host names', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByText('2 个站点')).toBeInTheDocument();
    expect(screen.getByText('1 个站点')).toBeInTheDocument();
    expect(screen.getByText('2 个站点')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('openai.com')).toBeInTheDocument();
    expect(screen.getByText('hetzner.com')).toBeInTheDocument();
  });

  it('renders optional link tags as metadata badges', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByText('model')).toHaveAttribute('data-slot', 'badge');
    expect(screen.getByText('api')).toHaveAttribute('data-slot', 'badge');
  });

  it('keeps link cards as safe external links', () => {
    render(<LinksDirectory categories={categories} />);

    expect(screen.getByRole('link', { name: /OpenAI/ })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.getByRole('link', { name: /OpenAI/ })).toHaveAttribute(
      'target',
      '_blank',
    );
  });
});
