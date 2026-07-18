import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

type SourceModule = {
  filePath: string;
  source: string;
};

type BoundaryViolation = {
  source: string;
  specifier: string;
  rule: 'client-to-server' | 'lib-to-server';
};

const PROJECT_ROOT = process.cwd();
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');
const EXCLUDED_DIRECTORIES = new Set([
  '__tests__',
  'tests',
  'test-utils',
  'generated',
  '.next',
]);

/** 判断文件是否属于需要执行依赖边界检查的生产 TypeScript 源码。 */
function isProductionSourceFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return (
    /\.tsx?$/.test(fileName) &&
    !fileName.endsWith('.d.ts') &&
    !/\.(?:test|spec)\.tsx?$/.test(fileName)
  );
}

/** 递归读取生产源码，排除测试、声明和生成目录。 */
function readProductionSourceModules(directory: string): SourceModule[] {
  const modules: SourceModule[] = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRECTORIES.has(entry.name)) {
        modules.push(...readProductionSourceModules(entryPath));
      }
      continue;
    }

    if (entry.isFile() && isProductionSourceFile(entryPath)) {
      modules.push({
        filePath: entryPath,
        source: fs.readFileSync(entryPath, 'utf8'),
      });
    }
  }

  return modules;
}

/** 检查源码顶层 prologue 是否声明为客户端模块。 */
function hasUseClientDirective(sourceFile: ts.SourceFile): boolean {
  for (const statement of sourceFile.statements) {
    if (
      !ts.isExpressionStatement(statement) ||
      !ts.isStringLiteral(statement.expression)
    ) {
      return false;
    }
    if (statement.expression.text === 'use client') return true;
  }
  return false;
}

/** 收集静态导入、export-from 与字面量 dynamic import 的模块标识符。 */
function collectImportSpecifiers(sourceFile: ts.SourceFile): string[] {
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

/** 将项目 alias 或相对导入解析为绝对路径；外部包返回 null。 */
function resolveProjectImport(
  importerPath: string,
  specifier: string,
  srcRoot: string,
): string | null {
  if (specifier.startsWith('@/')) {
    return path.resolve(srcRoot, specifier.slice(2));
  }
  if (specifier.startsWith('.')) {
    return path.resolve(path.dirname(importerPath), specifier);
  }
  return null;
}

/** 判断解析后的导入是否落在服务端专属目录内。 */
function isServerImport(targetPath: string, serverRoot: string): boolean {
  const relative = path.relative(serverRoot, targetPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * 分析给定源码集合并返回依赖边界违规。
 * 该函数同时服务真实仓库扫描和内存 fixture，避免门禁空跑。
 */
function findBoundaryViolations(
  modules: SourceModule[],
  srcRoot = SRC_ROOT,
): BoundaryViolation[] {
  const serverRoot = path.join(srcRoot, 'server');
  const libRoot = path.join(srcRoot, 'lib');
  const violations: BoundaryViolation[] = [];

  for (const sourceModule of modules) {
    const sourceFile = ts.createSourceFile(
      sourceModule.filePath,
      sourceModule.source,
      ts.ScriptTarget.Latest,
      true,
      sourceModule.filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const isClient = hasUseClientDirective(sourceFile);
    const relativeToLib = path.relative(libRoot, sourceModule.filePath);
    const isLibModule =
      relativeToLib === '' ||
      (!relativeToLib.startsWith('..') && !path.isAbsolute(relativeToLib));

    for (const specifier of collectImportSpecifiers(sourceFile)) {
      const targetPath = resolveProjectImport(sourceModule.filePath, specifier, srcRoot);
      if (!targetPath || !isServerImport(targetPath, serverRoot)) continue;

      if (isClient) {
        violations.push({
          source: path
            .relative(PROJECT_ROOT, sourceModule.filePath)
            .replaceAll('\\', '/'),
          specifier,
          rule: 'client-to-server',
        });
      }
      if (isLibModule) {
        violations.push({
          source: path
            .relative(PROJECT_ROOT, sourceModule.filePath)
            .replaceAll('\\', '/'),
          specifier,
          rule: 'lib-to-server',
        });
      }
    }
  }

  return violations;
}

describe('模块依赖边界', () => {
  it('扫描真实生产源码且不存在反向服务端依赖', () => {
    const modules = readProductionSourceModules(SRC_ROOT);
    const violations = findBoundaryViolations(modules);

    expect(modules.length).toBeGreaterThan(0);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it('识别 alias、相对路径、export-from 和动态导入违规', () => {
    const fixtures: SourceModule[] = [
      {
        filePath: path.join(SRC_ROOT, 'components', 'alias-client.tsx'),
        source: "'use client'; import { searchPosts } from '@/server/search';",
      },
      {
        filePath: path.join(SRC_ROOT, 'components', 'relative-client.tsx'),
        source: "'use client'; const search = import('../server/search');",
      },
      {
        filePath: path.join(SRC_ROOT, 'lib', 'alias-export.ts'),
        source: "export { searchPosts } from '@/server/search';",
      },
      {
        filePath: path.join(SRC_ROOT, 'lib', 'relative-import.ts'),
        source: "import { searchPosts } from '../server/search';",
      },
    ];

    expect(findBoundaryViolations(fixtures)).toEqual([
      {
        source: 'src/components/alias-client.tsx',
        specifier: '@/server/search',
        rule: 'client-to-server',
      },
      {
        source: 'src/components/relative-client.tsx',
        specifier: '../server/search',
        rule: 'client-to-server',
      },
      {
        source: 'src/lib/alias-export.ts',
        specifier: '@/server/search',
        rule: 'lib-to-server',
      },
      {
        source: 'src/lib/relative-import.ts',
        specifier: '../server/search',
        rule: 'lib-to-server',
      },
    ]);
  });
});
