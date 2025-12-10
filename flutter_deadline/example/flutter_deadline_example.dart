import 'package:flutter_deadline/flutter_deadline.dart';

// Example 1: Basic usage on a function
@Deadline(
  year: 2025,
  month: 6,
  day: 30,
  description: 'Remove this deprecated API endpoint',
)
void deprecatedFunction() {
  print('This function is deprecated');
}

// Example 2: With Slack mention on a class
@Deadline(
  year: 2025,
  month: 3,
  day: 15,
  description: 'Refactor this class to use new architecture',
  slackMention: '@channel',
)
class LegacyService {
  void doSomething() {
    print('Legacy implementation');
  }
}

// Example 3: On a variable
@Deadline(
  year: 2025,
  month: 1,
  day: 1,
  description: 'Remove feature flag after launch',
)
const bool enableNewFeature = true;

// Example 4: On a method
class UserService {
  @Deadline(
    year: 2025,
    month: 12,
    day: 31,
    description: 'Replace with new authentication system',
    slackMention: '<@U12345678>',
  )
  void legacyAuthenticate(String username, String password) {
    print('Using legacy auth for $username');
  }
}

void main() {
  // Using the annotated code
  deprecatedFunction();

  final legacyService = LegacyService();
  legacyService.doSomething();

  if (enableNewFeature) {
    print('New feature is enabled');
  }

  final userService = UserService();
  userService.legacyAuthenticate('user', 'pass');

  // You can also access deadline information programmatically
  const deadline = Deadline(
    year: 2025,
    month: 6,
    day: 30,
    description: 'Example deadline',
  );

  print('Deadline date: ${deadline.formattedDate}');
  print('Deadline DateTime: ${deadline.dateTime}');
  print('Deadline info: $deadline');
}
