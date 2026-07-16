import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createInMemorySource } from '@/lib/test-utils/in-memory-source';
import { createJsonContentRepository } from './json-content-repository';

const ThingSchema = z.object({
  id: z.string(),
});

const DATA_PATH = 'data/things.json';

function createThingRepository(
  files: Record<string, string>,
  mode?: 'strict' | 'lenient',
) {
  let parseCalls = 0;
  const repository = createJsonContentRepository<string[]>({
    source: createInMemorySource(files),
    path: DATA_PATH,
    label: 'things',
    fallback: () => [],
    mode,
    parse(raw) {
      parseCalls += 1;
      return z
        .array(ThingSchema)
        .parse(raw)
        .map((thing) => thing.id);
    },
  });

  return { repository, getParseCalls: () => parseCalls };
}

describe('createJsonContentRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads, parses, validates, and caches JSON content', () => {
    const { repository, getParseCalls } = createThingRepository({
      [DATA_PATH]: JSON.stringify([{ id: 'alpha' }, { id: 'beta' }]),
    });

    expect(repository.getAll()).toEqual(['alpha', 'beta']);
    expect(repository.getAll()).toEqual(['alpha', 'beta']);
    expect(getParseCalls()).toBe(1);
  });

  it('returns fallback content when the file is missing in lenient mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { repository } = createThingRepository({}, 'lenient');

    expect(repository.getAll()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(`[things] 数据文件不存在: ${DATA_PATH}`);
  });

  it('returns fallback content when JSON syntax is invalid in lenient mode', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { repository } = createThingRepository(
      {
        [DATA_PATH]: 'not-json',
      },
      'lenient',
    );

    expect(repository.getAll()).toEqual([]);
    expect(error).toHaveBeenCalledWith(
      `[things] JSON 解析失败: ${DATA_PATH}`,
      expect.any(SyntaxError),
    );
  });

  it('throws when the file is missing in strict mode', () => {
    const { repository } = createThingRepository({}, 'strict');
    expect(() => repository.getAll()).toThrow(`数据文件不存在: ${DATA_PATH}`);
  });

  it('throws when JSON syntax is invalid in strict mode', () => {
    const { repository } = createThingRepository({ [DATA_PATH]: 'not-json' }, 'strict');
    expect(() => repository.getAll()).toThrow('JSON 解析失败');
  });

  it('lets parser errors surface when JSON shape is invalid', () => {
    const { repository } = createThingRepository({
      [DATA_PATH]: JSON.stringify([{ name: 'missing-id' }]),
    });

    expect(() => repository.getAll()).toThrow();
  });
});
