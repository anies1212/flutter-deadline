import { ActionConfig, DeadlineAnnotation, SlackMessage } from './types';
declare global {
    interface String {
        padLeft(length: number, char: string): string;
    }
}
/**
 * Build a complete Slack message for multiple deadline annotations
 */
export declare function buildSlackMessage(annotations: DeadlineAnnotation[], config: ActionConfig, today?: Date): SlackMessage;
/**
 * Build a Slack message using a custom template
 */
export declare function buildCustomSlackMessage(annotations: DeadlineAnnotation[], config: ActionConfig, today?: Date): SlackMessage;
/**
 * Send a Slack message using a webhook URL
 */
export declare function sendSlackWebhook(webhookUrl: string, message: SlackMessage): Promise<void>;
/**
 * Send a Slack message using Bot Token (chat.postMessage API)
 */
export declare function sendSlackBotMessage(botToken: string, channel: string, message: SlackMessage): Promise<void>;
/**
 * Filter annotations based on date criteria
 */
export declare function filterAnnotationsByDate(annotations: DeadlineAnnotation[], config: ActionConfig, today?: Date): DeadlineAnnotation[];
