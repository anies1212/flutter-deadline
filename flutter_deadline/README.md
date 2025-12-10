# flutter_deadline

A Dart package that provides the `@Deadline` annotation to mark code that should be removed or refactored by a specific date.

This package works with the [flutter_deadline GitHub Action](https://github.com/anies1212/flutter-deadline) to automatically scan your codebase and send Slack notifications when deadlines are approaching or have passed.

## Features

- Mark any code with a deadline using the `@Deadline` annotation
- Specify deadline date (year, month, day)
- Add descriptions to explain what needs to be done
- Include Slack mentions for notifications
- Works with the flutter_deadline GitHub Action for automated reminders

## Installation

Add `flutter_deadline` to your `pubspec.yaml`:

```yaml
dependencies:
  flutter_deadline: ^1.0.0
```

Then run:

```bash
dart pub get
```

## Usage

### Basic Usage

```dart
import 'package:flutter_deadline/flutter_deadline.dart';

@Deadline(
  year: 2024,
  month: 12,
  day: 31,
  description: 'Remove this deprecated API endpoint',
)
void deprecatedFunction() {
  // This function should be removed by December 31, 2024
}
```

### With Slack Mention

```dart
@Deadline(
  year: 2025,
  month: 3,
  day: 15,
  description: 'Refactor this class to use new architecture',
  slackMention: '@channel',
)
class LegacyService {
  // ...
}
```

### On Variables

```dart
@Deadline(
  year: 2025,
  month: 1,
  day: 1,
  description: 'Remove feature flag after launch',
)
const bool enableNewFeature = true;
```

## GitHub Action Integration

To receive Slack notifications for your deadlines, set up the flutter_deadline GitHub Action in your repository:

```yaml
name: Deadline Check

on:
  schedule:
    - cron: '0 9 * * 1-5'  # Every weekday at 9 AM
  workflow_dispatch:

jobs:
  check-deadlines:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anies1212/flutter-deadline@v1
        with:
          slack_webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
          warning_days: 7
```

See the [GitHub Action documentation](https://github.com/anies1212/flutter-deadline) for more configuration options.

## API Reference

### Deadline

```dart
const Deadline({
  required int year,
  required int month,
  required int day,
  String? description,
  String? slackMention,
})
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | `int` | Yes | The year of the deadline (e.g., 2024) |
| `month` | `int` | Yes | The month of the deadline (1-12) |
| `day` | `int` | Yes | The day of the deadline (1-31) |
| `description` | `String?` | No | Explanation of what needs to be done |
| `slackMention` | `String?` | No | Slack mention (e.g., '@user', '@channel') |

#### Properties

- `dateTime` - Returns the deadline as a `DateTime` object
- `formattedDate` - Returns the deadline as a formatted string (YYYY-MM-DD)

## License

MIT License - see [LICENSE](LICENSE) for details.
