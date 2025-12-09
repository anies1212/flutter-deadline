// Test fixtures for E2E testing
// This file contains various @Deadline annotation patterns for testing

import 'package:flutter_deadline/flutter_deadline.dart';

// =============================================================================
// Pattern 1: Past deadline (should trigger notification)
// =============================================================================
@Deadline(
  year: 2025,
  month: 1,
  day: 1,
  description: 'New Year cleanup - remove legacy authentication',
  slackMention: '@channel',
)
class LegacyAuthService {
  Future<bool> authenticate(String username, String password) async {
    // Old authentication logic
    return false;
  }
}

// =============================================================================
// Pattern 2: Today's deadline (assuming test runs on specific date)
// =============================================================================
@Deadline(
  year: 2025,
  month: 12,
  day: 9,
  description: 'Remove temporary logging after debugging',
)
void debugLogger(String message) {
  print('[DEBUG] $message');
}

// =============================================================================
// Pattern 3: Future deadline (should NOT trigger by default)
// =============================================================================
@Deadline(
  year: 2030,
  month: 6,
  day: 15,
  description: 'Future feature flag - keep until v3.0 release',
)
const bool enableFutureFeature = false;

// =============================================================================
// Pattern 4: With Slack user ID mention
// =============================================================================
@Deadline(
  year: 2025,
  month: 1,
  day: 15,
  description: 'Remove workaround for API bug #123',
  slackMention: '<@U12345678>',
)
Future<Map<String, dynamic>> fetchDataWithWorkaround() async {
  // Workaround implementation
  await Future.delayed(Duration(milliseconds: 100));
  return {'status': 'ok'};
}

// =============================================================================
// Pattern 5: Minimal annotation (only required fields)
// =============================================================================
@Deadline(
  year: 2025,
  month: 2,
  day: 1,
)
void minimalAnnotationExample() {
  // No description, no slack mention
}

// =============================================================================
// Pattern 6: Class with multiple deadlined methods
// =============================================================================
class PaymentService {
  @Deadline(
    year: 2025,
    month: 1,
    day: 20,
    description: 'Migrate to new payment gateway v2',
  )
  Future<bool> processPaymentV1(double amount) async {
    // Old payment processing
    return true;
  }

  @Deadline(
    year: 2025,
    month: 1,
    day: 25,
    description: 'Remove after confirming v2 works in production',
  )
  Future<bool> processPaymentFallback(double amount) async {
    // Fallback payment processing
    return true;
  }
}

// =============================================================================
// Pattern 7: Constant with deadline
// =============================================================================
@Deadline(
  year: 2025,
  month: 3,
  day: 1,
  description: 'A/B test completed - remove feature flag',
  slackMention: '@product-team',
)
const bool showNewOnboarding = true;

// =============================================================================
// Pattern 8: Enum with deadline
// =============================================================================
@Deadline(
  year: 2025,
  month: 4,
  day: 1,
  description: 'Consolidate with new UserRole enum',
)
enum LegacyUserType {
  guest,
  member,
  premium,
  admin,
}

// =============================================================================
// Pattern 9: Extension with deadline
// =============================================================================
@Deadline(
  year: 2025,
  month: 5,
  day: 1,
  description: 'Move to StringUtils package after v2.0',
)
extension TemporaryStringHelpers on String {
  String toTitleCase() {
    if (isEmpty) return this;
    return split(' ')
        .map((word) => word.isEmpty
            ? word
            : '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}')
        .join(' ');
  }
}

// =============================================================================
// Pattern 10: Getter with deadline
// =============================================================================
class AppConfig {
  @Deadline(
    year: 2025,
    month: 1,
    day: 10,
    description: 'Remove after environment variables are set up',
  )
  static String get legacyApiUrl => 'https://old-api.example.com';

  static String get currentApiUrl => 'https://api.example.com';
}

// =============================================================================
// Pattern 11: Very old deadline (long overdue)
// =============================================================================
@Deadline(
  year: 2024,
  month: 1,
  day: 1,
  description: 'This has been overdue for a year!',
  slackMention: '@tech-debt',
)
void veryOldDeadline() {
  // This should have been removed long ago
}

// =============================================================================
// Pattern 12: Japanese description
// =============================================================================
@Deadline(
  year: 2025,
  month: 2,
  day: 14,
  description: '古いAPIエンドポイントを削除する',
  slackMention: '@backend',
)
class OldApiClient {
  Future<void> fetchOldData() async {
    // 古い実装
  }
}
