/**
 * Represents a @Deadline annotation found in the source code
 */
export interface DeadlineAnnotation {
  /** File path where the annotation was found */
  filePath: string;
  /** Line number where the annotation starts (1-based) */
  lineNumber: number;
  /** The year of the deadline */
  year: number;
  /** The month of the deadline (1-12) */
  month: number;
  /** The day of the deadline (1-31) */
  day: number;
  /** Optional description from the annotation */
  description?: string;
  /** Optional Slack mention from the annotation */
  slackMention?: string;
  /** The annotated code block (function, class, variable declaration, etc.) */
  codeBlock: string;
  /** The name of the annotated element (function name, class name, etc.) */
  elementName: string;
  /** Git blame author who added the annotation */
  author?: string;
  /** Git blame author email */
  authorEmail?: string;
  /** The deadline as a Date object */
  deadlineDate: Date;
}

/**
 * Configuration for the action
 */
export interface ActionConfig {
  /** Slack webhook URL or bot token */
  slackWebhookUrl?: string;
  slackBotToken?: string;
  slackChannel?: string;
  /** Language for notifications: 'ja' | 'en' */
  language: 'ja' | 'en';
  /** Custom Slack message template (optional) */
  customTemplate?: string;
  /** GitHub repository (owner/repo) */
  repository: string;
  /** Default branch name */
  defaultBranch: string;
  /** Directory to scan for Dart files */
  scanDirectory: string;
  /** Days before deadline to start notifying (default: 0 = on deadline day only) */
  notifyDaysBefore: number;
  /** Whether to notify for past deadlines */
  notifyPastDeadlines: boolean;
  /** Mapping of GitHub usernames to Slack user IDs */
  githubToSlackMap: Record<string, string>;
}

/**
 * Slack message block types
 */
export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  elements?: Array<{
    type: string;
    text?: string | { type: string; text: string };
    url?: string;
    action_id?: string;
  }>;
  accessory?: {
    type: string;
    text?: { type: string; text: string };
    url?: string;
  };
}

export interface SlackMessage {
  channel?: string;
  text: string;
  blocks?: SlackBlock[];
}

/**
 * Result of parsing a Dart file
 */
export interface ParseResult {
  filePath: string;
  annotations: DeadlineAnnotation[];
  errors: string[];
}

/**
 * Git blame information for a line
 */
export interface BlameInfo {
  author: string;
  authorEmail: string;
  commitHash: string;
  timestamp: Date;
}
