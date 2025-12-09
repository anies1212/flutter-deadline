import { ActionConfig, DeadlineAnnotation, SlackBlock, SlackMessage } from './types';
import { extractGitHubUsername } from './blame';

/**
 * Message templates for different languages
 */
const MESSAGES = {
  ja: {
    title: ':warning: デッドライン通知',
    deadlineReached: 'デッドラインに達しました',
    deadlineApproaching: 'デッドラインが近づいています',
    deadlinePassed: 'デッドラインを過ぎています',
    daysRemaining: (days: number) => `残り ${days} 日`,
    daysOverdue: (days: number) => `${days} 日超過`,
    file: 'ファイル',
    line: '行',
    element: '対象',
    deadline: 'デッドライン',
    author: '作成者',
    description: '説明',
    pleaseRemove: 'このコードを削除または対応してください',
    viewCode: 'コードを見る',
    noDeadlines: '本日対応が必要なデッドラインはありません',
    summary: (count: number) => `${count} 件のデッドラインが見つかりました`,
  },
  en: {
    title: ':warning: Deadline Reminder',
    deadlineReached: 'Deadline reached',
    deadlineApproaching: 'Deadline approaching',
    deadlinePassed: 'Deadline passed',
    daysRemaining: (days: number) => `${days} day(s) remaining`,
    daysOverdue: (days: number) => `${days} day(s) overdue`,
    file: 'File',
    line: 'Line',
    element: 'Element',
    deadline: 'Deadline',
    author: 'Author',
    description: 'Description',
    pleaseRemove: 'Please remove or address this code',
    viewCode: 'View Code',
    noDeadlines: 'No deadlines require attention today',
    summary: (count: number) => `${count} deadline(s) found`,
  },
};

/**
 * Calculate the difference in days between two dates
 */
function getDaysDifference(deadline: Date, today: Date): number {
  const deadlineTime = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()).getTime();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.floor((deadlineTime - todayTime) / (1000 * 60 * 60 * 24));
}

/**
 * Format a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padLeft(2, '0');
  const day = String(date.getDate()).padLeft(2, '0');
  return `${year}-${month}-${day}`;
}

// Polyfill for padLeft if not available
declare global {
  interface String {
    padLeft(length: number, char: string): string;
  }
}

String.prototype.padLeft = function (length: number, char: string): string {
  return this.padStart(length, char);
};

/**
 * Get the GitHub URL for a specific line in a file
 */
function getGitHubUrl(
  repository: string,
  defaultBranch: string,
  filePath: string,
  lineNumber: number
): string {
  // Remove leading ./ if present
  const cleanPath = filePath.replace(/^\.\//, '');
  return `https://github.com/${repository}/blob/${defaultBranch}/${cleanPath}#L${lineNumber}`;
}

/**
 * Get the status emoji based on deadline
 */
function getStatusEmoji(daysDiff: number): string {
  if (daysDiff < 0) return ':rotating_light:'; // Overdue
  if (daysDiff === 0) return ':alarm_clock:';   // Today
  if (daysDiff <= 3) return ':warning:';        // Approaching
  return ':calendar:';                           // Future
}

/**
 * Resolve Slack mention - convert GitHub username to Slack user ID if mapping exists
 */
function resolveSlackMention(
  annotation: DeadlineAnnotation,
  config: ActionConfig
): string | undefined {
  // First, check if there's an explicit slackMention in the annotation
  if (annotation.slackMention) {
    return annotation.slackMention;
  }

  // Try to map GitHub author to Slack user
  if (annotation.authorEmail && config.githubToSlackMap) {
    const githubUsername = extractGitHubUsername(annotation.authorEmail);
    if (githubUsername && config.githubToSlackMap[githubUsername]) {
      return `<@${config.githubToSlackMap[githubUsername]}>`;
    }

    // Also try direct email mapping
    if (config.githubToSlackMap[annotation.authorEmail]) {
      return `<@${config.githubToSlackMap[annotation.authorEmail]}>`;
    }
  }

  // Try author name as a fallback
  if (annotation.author && config.githubToSlackMap) {
    if (config.githubToSlackMap[annotation.author]) {
      return `<@${config.githubToSlackMap[annotation.author]}>`;
    }
  }

  return undefined;
}

/**
 * Build Slack message blocks for a single deadline annotation
 */
function buildAnnotationBlocks(
  annotation: DeadlineAnnotation,
  config: ActionConfig,
  today: Date
): SlackBlock[] {
  const msg = MESSAGES[config.language];
  const daysDiff = getDaysDifference(annotation.deadlineDate, today);

  const statusEmoji = getStatusEmoji(daysDiff);
  const statusText =
    daysDiff < 0
      ? `${msg.deadlinePassed} (${msg.daysOverdue(Math.abs(daysDiff))})`
      : daysDiff === 0
        ? msg.deadlineReached
        : `${msg.deadlineApproaching} (${msg.daysRemaining(daysDiff)})`;

  const githubUrl = getGitHubUrl(
    config.repository,
    config.defaultBranch,
    annotation.filePath,
    annotation.lineNumber
  );

  const mention = resolveSlackMention(annotation, config);

  // Build author link (GitHub profile)
  const authorLink = annotation.author
    ? `<https://github.com/${annotation.author}|${annotation.author}>`
    : 'Unknown';

  // Build file link (GitHub code)
  const fileLink = `<${githubUrl}|${annotation.filePath}>`;

  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${statusEmoji} *${statusText}*${mention ? ` ${mention}` : ''}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*${msg.element}:*\n${annotation.elementName}`,
        },
        {
          type: 'mrkdwn',
          text: `*${msg.deadline}:*\n${formatDate(annotation.deadlineDate)}`,
        },
      ],
    } as SlackBlock,
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*${msg.file}:*\n${fileLink} (${msg.line}: ${annotation.lineNumber})`,
        },
        {
          type: 'mrkdwn',
          text: `*${msg.author}:*\n${authorLink}`,
        },
      ],
    } as SlackBlock,
    ...(annotation.description
      ? [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${msg.description}:* ${annotation.description}`,
            },
          } as SlackBlock,
        ]
      : []),
    {
      type: 'divider',
    },
  ];

  return blocks;
}

/**
 * Build a complete Slack message for multiple deadline annotations
 */
export function buildSlackMessage(
  annotations: DeadlineAnnotation[],
  config: ActionConfig,
  today: Date = new Date()
): SlackMessage {
  const msg = MESSAGES[config.language];

  if (annotations.length === 0) {
    return {
      text: msg.noDeadlines,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:white_check_mark: ${msg.noDeadlines}`,
          },
        },
      ],
    };
  }

  const MAX_BLOCKS = 30;
  const HEADER_BLOCKS = 3; // header, summary, divider

  const blocks: SlackBlock[] = [
    {
      type: 'header' as const,
      text: {
        type: 'plain_text',
        text: msg.title.replace(/:[^:]+:/g, '').trim(), // Remove emoji for header
        emoji: true,
      },
    } as SlackBlock,
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: msg.summary(annotations.length),
      },
    },
    {
      type: 'divider' as const,
    } as SlackBlock,
  ];

  let displayedCount = 0;
  for (const annotation of annotations) {
    const annotationBlocks = buildAnnotationBlocks(annotation, config, today);

    // Check if adding these blocks would exceed the limit
    if (blocks.length + annotationBlocks.length > MAX_BLOCKS) {
      break;
    }

    blocks.push(...annotationBlocks);
    displayedCount++;
  }

  // Add truncation notice if not all annotations were displayed
  if (displayedCount < annotations.length) {
    const remainingCount = annotations.length - displayedCount;
    const truncationMsg = config.language === 'ja'
      ? `...他 ${remainingCount} 件のデッドラインがあります`
      : `...and ${remainingCount} more deadline(s)`;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: truncationMsg,
      },
    });
  }

  return {
    channel: config.slackChannel,
    text: `${msg.title} - ${msg.summary(annotations.length)}`,
    blocks,
  };
}

/**
 * Build a Slack message using a custom template
 */
export function buildCustomSlackMessage(
  annotations: DeadlineAnnotation[],
  config: ActionConfig,
  today: Date = new Date()
): SlackMessage {
  if (!config.customTemplate) {
    return buildSlackMessage(annotations, config, today);
  }

  // Parse custom template - it should be a valid JSON string with placeholders
  try {
    let template = config.customTemplate;

    // Replace global placeholders
    template = template.replace(/\{\{count\}\}/g, String(annotations.length));
    template = template.replace(/\{\{date\}\}/g, formatDate(today));

    // For each annotation, we'll create a message
    // This is a simplified approach - for complex templates, you might want to use a proper templating engine
    const messages: string[] = [];

    for (const annotation of annotations) {
      let annotationTemplate = template;
      const daysDiff = getDaysDifference(annotation.deadlineDate, today);
      const githubUrl = getGitHubUrl(
        config.repository,
        config.defaultBranch,
        annotation.filePath,
        annotation.lineNumber
      );
      const mention = resolveSlackMention(annotation, config);

      annotationTemplate = annotationTemplate.replace(/\{\{elementName\}\}/g, annotation.elementName);
      annotationTemplate = annotationTemplate.replace(/\{\{filePath\}\}/g, annotation.filePath);
      annotationTemplate = annotationTemplate.replace(/\{\{lineNumber\}\}/g, String(annotation.lineNumber));
      annotationTemplate = annotationTemplate.replace(/\{\{deadline\}\}/g, formatDate(annotation.deadlineDate));
      annotationTemplate = annotationTemplate.replace(/\{\{author\}\}/g, annotation.author || 'Unknown');
      annotationTemplate = annotationTemplate.replace(/\{\{description\}\}/g, annotation.description || '');
      annotationTemplate = annotationTemplate.replace(/\{\{codeBlock\}\}/g, annotation.codeBlock);
      annotationTemplate = annotationTemplate.replace(/\{\{githubUrl\}\}/g, githubUrl);
      annotationTemplate = annotationTemplate.replace(/\{\{daysDiff\}\}/g, String(daysDiff));
      annotationTemplate = annotationTemplate.replace(/\{\{mention\}\}/g, mention || '');
      annotationTemplate = annotationTemplate.replace(/\{\{slackMention\}\}/g, annotation.slackMention || '');

      messages.push(annotationTemplate);
    }

    return {
      channel: config.slackChannel,
      text: messages.join('\n\n'),
    };
  } catch (error) {
    console.error('Failed to parse custom template, falling back to default:', error);
    return buildSlackMessage(annotations, config, today);
  }
}

/**
 * Send a Slack message using a webhook URL
 */
export async function sendSlackWebhook(webhookUrl: string, message: SlackMessage): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} ${text}`);
  }
}

/**
 * Send a Slack message using Bot Token (chat.postMessage API)
 */
export async function sendSlackBotMessage(
  botToken: string,
  channel: string,
  message: SlackMessage
): Promise<void> {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel,
      text: message.text,
      blocks: message.blocks,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack API request failed: ${response.status} ${text}`);
  }

  const data = await response.json() as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
}

/**
 * Filter annotations based on date criteria
 */
export function filterAnnotationsByDate(
  annotations: DeadlineAnnotation[],
  config: ActionConfig,
  today: Date = new Date()
): DeadlineAnnotation[] {
  return annotations.filter((annotation) => {
    const daysDiff = getDaysDifference(annotation.deadlineDate, today);

    // Include if deadline is today or within the notification window
    if (daysDiff >= 0 && daysDiff <= config.notifyDaysBefore) {
      return true;
    }

    // Include past deadlines if configured
    if (daysDiff < 0 && config.notifyPastDeadlines) {
      return true;
    }

    return false;
  });
}
