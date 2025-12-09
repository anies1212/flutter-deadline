import * as core from '@actions/core';
import * as github from '@actions/github';
import * as path from 'path';
import { ActionConfig, DeadlineAnnotation } from './types';
import { parseDartFile, findDartFiles } from './parser';
import { enrichWithBlameInfo } from './blame';
import {
  buildSlackMessage,
  buildCustomSlackMessage,
  sendSlackWebhook,
  sendSlackBotMessage,
  filterAnnotationsByDate,
} from './slack';

/**
 * Parse the GitHub to Slack user mapping from input
 */
function parseGitHubToSlackMap(input: string): Record<string, string> {
  if (!input) return {};

  try {
    return JSON.parse(input);
  } catch {
    // Try parsing as key=value pairs
    const map: Record<string, string> = {};
    const pairs = input.split(',').map((s) => s.trim());
    for (const pair of pairs) {
      const [key, value] = pair.split('=').map((s) => s.trim());
      if (key && value) {
        map[key] = value;
      }
    }
    return map;
  }
}

/**
 * Get action configuration from inputs
 */
function getConfig(): ActionConfig {
  const context = github.context;
  const repository = core.getInput('repository') || `${context.repo.owner}/${context.repo.repo}`;

  return {
    slackWebhookUrl: core.getInput('slack_webhook_url'),
    slackBotToken: core.getInput('slack_bot_token'),
    slackChannel: core.getInput('slack_channel'),
    language: (core.getInput('language') || 'en') as 'ja' | 'en',
    customTemplate: core.getInput('custom_template'),
    repository,
    defaultBranch: core.getInput('default_branch') || 'main',
    scanDirectory: core.getInput('scan_directory') || '.',
    notifyDaysBefore: parseInt(core.getInput('notify_days_before') || '0', 10),
    notifyPastDeadlines: core.getInput('notify_past_deadlines') === 'true',
    githubToSlackMap: parseGitHubToSlackMap(core.getInput('github_to_slack_map')),
  };
}

/**
 * Main action entry point
 */
async function run(): Promise<void> {
  try {
    const config = getConfig();
    const today = new Date();

    core.info(`Scanning for @Deadline annotations in: ${config.scanDirectory}`);
    core.info(`Today's date: ${today.toISOString().split('T')[0]}`);
    core.info(`Language: ${config.language}`);
    core.info(`Notify days before: ${config.notifyDaysBefore}`);
    core.info(`Notify past deadlines: ${config.notifyPastDeadlines}`);

    // Find and parse all Dart files
    const scanPath = path.resolve(process.cwd(), config.scanDirectory);
    const dartFiles = findDartFiles(scanPath);
    core.info(`Found ${dartFiles.length} Dart files`);

    // Parse all files for @Deadline annotations
    let allAnnotations: DeadlineAnnotation[] = [];
    let totalErrors = 0;
    const cwd = process.cwd();

    for (const filePath of dartFiles) {
      const result = parseDartFile(filePath);

      // Convert absolute paths to relative paths for GitHub URLs
      const annotationsWithRelativePaths = result.annotations.map((annotation) => ({
        ...annotation,
        filePath: path.relative(cwd, annotation.filePath),
      }));

      allAnnotations = allAnnotations.concat(annotationsWithRelativePaths);
      totalErrors += result.errors.length;

      for (const error of result.errors) {
        core.warning(error);
      }
    }

    core.info(`Found ${allAnnotations.length} @Deadline annotations`);
    if (totalErrors > 0) {
      core.warning(`Encountered ${totalErrors} parsing errors`);
    }

    // Enrich annotations with git blame information
    core.info('Enriching annotations with git blame information...');
    allAnnotations = enrichWithBlameInfo(allAnnotations);

    // Filter annotations based on date criteria
    const filteredAnnotations = filterAnnotationsByDate(allAnnotations, config, today);
    core.info(`${filteredAnnotations.length} annotations match notification criteria`);

    // Set outputs
    core.setOutput('total_annotations', allAnnotations.length);
    core.setOutput('filtered_annotations', filteredAnnotations.length);
    core.setOutput(
      'annotations_json',
      JSON.stringify(
        filteredAnnotations.map((a) => ({
          filePath: a.filePath,
          lineNumber: a.lineNumber,
          elementName: a.elementName,
          deadline: `${a.year}-${String(a.month).padStart(2, '0')}-${String(a.day).padStart(2, '0')}`,
          description: a.description,
          author: a.author,
        }))
      )
    );

    // Send Slack notification if there are annotations to report
    if (filteredAnnotations.length > 0) {
      const message = config.customTemplate
        ? buildCustomSlackMessage(filteredAnnotations, config, today)
        : buildSlackMessage(filteredAnnotations, config, today);

      if (config.slackWebhookUrl) {
        // Use Webhook URL
        core.info('Sending Slack notification via webhook...');
        await sendSlackWebhook(config.slackWebhookUrl, message);
        core.info('Slack notification sent successfully via webhook');
      } else if (config.slackBotToken && config.slackChannel) {
        // Use Bot Token
        core.info(`Sending Slack notification via Bot Token to channel: ${config.slackChannel}...`);
        await sendSlackBotMessage(config.slackBotToken, config.slackChannel, message);
        core.info('Slack notification sent successfully via Bot Token');
      } else {
        core.warning('No Slack credentials provided. Skipping notification.');
        core.warning('Provide either slack_webhook_url OR (slack_bot_token AND slack_channel)');
        core.info('Annotations found:');
        for (const annotation of filteredAnnotations) {
          core.info(
            `  - ${annotation.elementName} in ${annotation.filePath}:${annotation.lineNumber} ` +
              `(deadline: ${annotation.year}-${annotation.month}-${annotation.day})`
          );
        }
      }
    } else {
      core.info('No annotations match the notification criteria. No notification sent.');
    }

    // Log summary
    core.summary
      .addHeading('Deadline Reminder Results')
      .addTable([
        [
          { data: 'Metric', header: true },
          { data: 'Value', header: true },
        ],
        ['Total Dart files scanned', String(dartFiles.length)],
        ['Total @Deadline annotations found', String(allAnnotations.length)],
        ['Annotations requiring attention', String(filteredAnnotations.length)],
        ['Parsing errors', String(totalErrors)],
      ])
      .write();
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
