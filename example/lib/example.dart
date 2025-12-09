import 'package:flutter_deadline/flutter_deadline.dart';

// Example 1: Class with deadline
@Deadline(
  year: 2025,
  month: 3,
  day: 31,
  description: 'Legacy API client - migrate to v2 API',
  slackMention: '@backend-team',
)
class LegacyApiClient {
  Future<Map<String, dynamic>> fetchData() async {
    // Old implementation
    return {};
  }
}

// Example 2: Function with deadline
@Deadline(
  year: 2025,
  month: 1,
  day: 15,
  description: 'Temporary workaround for issue #123',
)
void temporaryFix() {
  // This is a temporary fix that should be removed
  // after the upstream bug is fixed
}

// Example 3: Constant with deadline
@Deadline(
  year: 2025,
  month: 2,
  day: 28,
  description: 'A/B test feature flag - remove after experiment concludes',
  slackMention: '<@U12345678>',
)
const bool enableExperimentalFeature = true;

// Example 4: Deprecated method in a class
class UserService {
  @Deadline(
    year: 2025,
    month: 6,
    day: 1,
    description: 'Use getUserById instead',
  )
  Future<User?> getUser(int id) async {
    // Deprecated implementation
    return null;
  }

  Future<User?> getUserById(String id) async {
    // New implementation
    return null;
  }
}

// Example 5: Extension with deadline
@Deadline(
  year: 2025,
  month: 4,
  day: 30,
  description: 'Move to core String utilities after v2.0 release',
)
extension TemporaryStringExtension on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}

// Example 6: Enum with deadline
@Deadline(
  year: 2025,
  month: 5,
  day: 15,
  description: 'Consolidate with new permission system',
)
enum LegacyPermission {
  read,
  write,
  admin,
}

// Dummy class for type reference
class User {
  final String id;
  final String name;
  User(this.id, this.name);
}
