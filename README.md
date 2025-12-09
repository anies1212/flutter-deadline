# Flutter Deadline

A Flutter/Dart package and GitHub Action that helps you manage technical debt by tracking code that needs to be removed or refactored by a specific date.

## Overview

This project consists of two parts:

1. **`flutter_deadline`** - A Dart package that provides the `@Deadline` annotation
2. **GitHub Action** - Scans your codebase for `@Deadline` annotations and sends Slack notifications when deadlines are due

## Installation

### 1. Add the Dart Package

Add `flutter_deadline` to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_deadline: ^1.0.0
```

Or install from GitHub:

```yaml
dependencies:
  flutter_deadline:
    git:
      url: https://github.com/anies1212/flutter-deadline.git
      path: flutter_deadline
```

### 2. Set Up the GitHub Action

Create `.github/workflows/flutter-deadline.yml`:

#### Option A: Using Webhook URL (Recommended)

```yaml
name: Flutter Deadline

on:
  schedule:
    # Run daily at 9:00 AM UTC
    - cron: '0 9 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  check-deadlines:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for git blame

      - name: Check Deadlines
        uses: anies1212/flutter-deadline/action@v1
        with:
          slack_webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
          language: 'ja'  # or 'en'
          notify_past_deadlines: true
```

#### Option B: Using Bot Token

```yaml
      - name: Check Deadlines
        uses: anies1212/flutter-deadline/action@v1
        with:
          slack_bot_token: ${{ secrets.SLACK_BOT_TOKEN }}
          slack_channel: 'C0A38Q2ML56'  # Channel ID
          language: 'ja'
          notify_past_deadlines: true
```

> **Note:** Bot Token requires `chat:write` scope. Channel ID can be found in Slack channel details.

## Usage

### Basic Usage

```dart
import 'package:flutter_deadline/flutter_deadline.dart';

@Deadline(
  year: 2024,
  month: 12,
  day: 31,
)
void temporaryWorkaround() {
  // This code should be removed by December 31, 2024
}
```

### With Description

```dart
@Deadline(
  year: 2024,
  month: 6,
  day: 15,
  description: 'Remove after API v2 migration is complete',
)
class LegacyApiClient {
  // ...
}
```

### With Slack Mention

```dart
@Deadline(
  year: 2024,
  month: 3,
  day: 1,
  description: 'Feature flag for A/B test - remove after analysis',
  slackMention: '<@U12345678>',  // Slack user ID
)
const bool enableExperimentalFeature = true;
```

### Supported Elements

You can annotate:

- **Classes**: `@Deadline(...) class MyClass {}`
- **Functions**: `@Deadline(...) void myFunction() {}`
- **Methods**: Inside classes
- **Variables/Constants**: `@Deadline(...) final myVar = value;`
- **Getters/Setters**
- **Enums**
- **Mixins**
- **Extensions**

## GitHub Action Configuration

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `slack_webhook_url` | Slack Incoming Webhook URL | No | - |
| `slack_channel` | Slack channel (if using bot token) | No | - |
| `language` | Notification language: `ja` or `en` | No | `en` |
| `custom_template` | Custom Slack message template | No | - |
| `repository` | GitHub repository (owner/repo) | No | Current repo |
| `default_branch` | Default branch for GitHub links | No | `main` |
| `scan_directory` | Directory to scan | No | `.` |
| `notify_days_before` | Days before deadline to notify | No | `0` |
| `notify_past_deadlines` | Notify for past deadlines | No | `true` |
| `github_to_slack_map` | GitHub to Slack user ID mapping | No | `{}` |

### Outputs

| Output | Description |
|--------|-------------|
| `total_annotations` | Total @Deadline annotations found |
| `filtered_annotations` | Annotations matching notification criteria |
| `annotations_json` | JSON array of filtered annotations |

## Slack Notification Examples

### Japanese (language: 'ja')

```
デッドライン通知
12 件のデッドラインが見つかりました
─────────────────────────────
🚨 デッドラインを過ぎています (3 日超過) @user

対象:                    デッドライン:
temporaryWorkaround      2024-12-31

ファイル:                作成者:
lib/src/utils.dart       John Doe
(行: 42)

説明: Remove after API v2 migration is complete
─────────────────────────────
```

### English (language: 'en')

```
Deadline Reminder
12 deadline(s) found
─────────────────────────────
🚨 Deadline passed (3 day(s) overdue) @user

Element:                 Deadline:
temporaryWorkaround      2024-12-31

File:                    Author:
lib/src/utils.dart       John Doe
(Line: 42)

Description: Remove after API v2 migration is complete
─────────────────────────────
```

## Custom Template

You can provide a custom Slack message format using placeholders:

```yaml
custom_template: |
  🔔 *{{elementName}}* in `{{filePath}}:{{lineNumber}}`
  📅 Deadline: {{deadline}} ({{daysDiff}} days)
  👤 Author: {{author}}
  📝 {{description}}
  🔗 {{githubUrl}}
  {{mention}}
```

### Available Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{{elementName}}` | Name of the annotated element |
| `{{filePath}}` | File path |
| `{{lineNumber}}` | Line number |
| `{{deadline}}` | Deadline date (YYYY-MM-DD) |
| `{{author}}` | Git blame author |
| `{{description}}` | Description from annotation |
| `{{codeBlock}}` | The annotated code |
| `{{githubUrl}}` | Link to the code on GitHub |
| `{{daysDiff}}` | Days until/since deadline |
| `{{mention}}` | Resolved Slack mention |
| `{{slackMention}}` | Raw slackMention from annotation |
| `{{count}}` | Total number of annotations |
| `{{date}}` | Today's date |

## GitHub to Slack User Mapping

Map GitHub usernames to Slack user IDs for automatic mentions:

```yaml
github_to_slack_map: |
  {
    "octocat": "U12345678",
    "developer": "U87654321",
    "user@example.com": "U11111111"
  }
```

Or use comma-separated format:

```yaml
github_to_slack_map: "octocat=U12345678,developer=U87654321"
```

The action will automatically try to match:
1. Explicit `slackMention` in the annotation
2. GitHub username (from noreply email)
3. Author email
4. Author name

## Best Practices

1. **Be specific with descriptions**: Explain *why* the deadline exists
2. **Set realistic deadlines**: Consider dependencies and team capacity
3. **Use mentions**: Assign responsibility with `slackMention`
4. **Run daily**: Schedule the action to run daily for timely reminders
5. **Review past deadlines**: Enable `notify_past_deadlines` to track overdue items

## Development

### Building the Action

```bash
cd action
npm install
npm run build
```

### Running Tests

```bash
# Dart package tests
cd flutter_deadline
dart test

# Action tests (coming soon)
cd action
npm test
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
