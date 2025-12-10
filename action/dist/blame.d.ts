import { BlameInfo, DeadlineAnnotation } from './types';
/**
 * Get git blame information for a specific line in a file
 */
export declare function getBlameInfo(filePath: string, lineNumber: number): BlameInfo | null;
/**
 * Enrich deadline annotations with git blame information
 */
export declare function enrichWithBlameInfo(annotations: DeadlineAnnotation[]): DeadlineAnnotation[];
/**
 * Get GitHub username from email if it matches GitHub's noreply format
 * e.g., "12345678+username@users.noreply.github.com" -> "username"
 */
export declare function extractGitHubUsername(email: string): string | null;
