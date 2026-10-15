import path from 'node:path';

/** Business artifacts live by project; application source remains in ecom-automation. */
export const DROPSHIP_ROOT = path.resolve(process.cwd(), '..');
export const WORKSPACE_ROOT = path.join(DROPSHIP_ROOT, 'workspace');
export const REFERENCE_ROOT = path.join(DROPSHIP_ROOT, 'reference');
export const PROJECT_IDS: Record<string, string> = { 'blackout-curtains': 'noctanest' };
export const projectDir = (product: string) => path.join(WORKSPACE_ROOT, PROJECT_IDS[product] ?? product);
export const referenceDir = (product: string) => path.join(REFERENCE_ROOT, product === 'blackout-curtains' ? 'blackout' : product);
export const publishingDir = (product: string) => path.join(projectDir(product), 'publishing');

/** Preserve existing bookmarked media URLs; new metadata uses workspace/reference paths. */
export function mediaRelativePath(input: string): string {
  const rel = input.replace(/^video-drafts\//, '');
  if (rel.startsWith('blackout-curtains/reference/')) return rel.replace('blackout-curtains/reference/', 'reference/blackout/');
  if (rel.startsWith('blackout-curtains/')) return rel.replace('blackout-curtains/', 'workspace/noctanest/creative/');
  return rel;
}

/** Only expose workspace and reference assets, never the repository root or secrets. */
export function mediaPath(input: string): string | null {
  const full = path.resolve(DROPSHIP_ROOT, mediaRelativePath(input));
  return [WORKSPACE_ROOT, REFERENCE_ROOT].some((root) => full.startsWith(root + path.sep)) ? full : null;
}
