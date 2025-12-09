import { execSync } from 'child_process';
import { BlameInfo, DeadlineAnnotation } from './types';

/**
 * Get git blame information for a specific line in a file
 */
export function getBlameInfo(filePath: string, lineNumber: number): BlameInfo | null {
  try {
    // Use git blame with porcelain format for easier parsing
    const result = execSync(
      `git blame -L ${lineNumber},${lineNumber} --porcelain "${filePath}"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const lines = result.split('\n');
    let author = 'Unknown';
    let authorEmail = '';
    let commitHash = '';
    let timestamp = new Date();

    for (const line of lines) {
      if (line.startsWith('author ')) {
        author = line.slice(7);
      } else if (line.startsWith('author-mail ')) {
        // Remove < and > from email
        authorEmail = line.slice(12).replace(/[<>]/g, '');
      } else if (line.startsWith('author-time ')) {
        const unixTimestamp = parseInt(line.slice(12), 10);
        timestamp = new Date(unixTimestamp * 1000);
      } else if (line.match(/^[0-9a-f]{40}/)) {
        commitHash = line.split(' ')[0];
      }
    }

    return {
      author,
      authorEmail,
      commitHash,
      timestamp,
    };
  } catch (error) {
    console.warn(`Failed to get blame info for ${filePath}:${lineNumber}: ${error}`);
    return null;
  }
}

/**
 * Enrich deadline annotations with git blame information
 */
export function enrichWithBlameInfo(annotations: DeadlineAnnotation[]): DeadlineAnnotation[] {
  return annotations.map((annotation) => {
    const blameInfo = getBlameInfo(annotation.filePath, annotation.lineNumber);

    if (blameInfo) {
      return {
        ...annotation,
        author: blameInfo.author,
        authorEmail: blameInfo.authorEmail,
      };
    }

    return annotation;
  });
}

/**
 * Get GitHub username from email if it matches GitHub's noreply format
 * e.g., "12345678+username@users.noreply.github.com" -> "username"
 */
export function extractGitHubUsername(email: string): string | null {
  // Match GitHub noreply email format
  const noreplyMatch = email.match(/^\d+\+([^@]+)@users\.noreply\.github\.com$/);
  if (noreplyMatch) {
    return noreplyMatch[1];
  }

  // Match old GitHub noreply format
  const oldNoreplyMatch = email.match(/^([^@]+)@users\.noreply\.github\.com$/);
  if (oldNoreplyMatch) {
    return oldNoreplyMatch[1];
  }

  return null;
}
