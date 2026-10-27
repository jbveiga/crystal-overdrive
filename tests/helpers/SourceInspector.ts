import * as fs from 'fs';
import * as path from 'path';

/**
 * Repository root directory path resolved relative to this helper file.
 */
export const REPO_ROOT = path.resolve(__dirname, '../..');

/**
 * Resolves a repo-relative path to an absolute path.
 */
export function resolveRepoPath(relPath: string): string {
  return path.resolve(REPO_ROOT, relPath);
}

/**
 * Reads a UTF-8 file from the repository given a relative path from the root.
 */
export function readRepoFile(relPath: string): string {
  const fullPath = resolveRepoPath(relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Counts the total number of lines in a file relative to the repo root.
 */
export function countRepoFileLines(relPath: string): number {
  return readRepoFile(relPath).split('\n').length;
}

/**
 * Recursively lists all TypeScript (.ts and .d.ts) file paths relative to the repo root under relDir.
 */
export function listTsFilesRecursive(relDir: string): string[] {
  const absDir = resolveRepoPath(relDir);
  const results: string[] = [];

  function walk(currentDir: string): void {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts'))) {
        const relPath = path.relative(REPO_ROOT, fullPath);
        results.push(relPath);
      }
    }
  }

  walk(absDir);
  return results.sort();
}

/**
 * Reads a group of modules and concatenates their contents into a single string.
 */
export function readModuleGroupConcatenated(relPaths: string[]): string {
  return relPaths.map((p) => readRepoFile(p)).join('\n');
}
