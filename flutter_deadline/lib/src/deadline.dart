/// An annotation to mark code that should be removed or refactored by a specific date.
///
/// Use this annotation on classes, functions, methods, variables, or any other
/// declarations that need to be addressed by a certain deadline.
///
/// Example usage:
/// ```dart
/// @Deadline(
///   year: 2024,
///   month: 12,
///   day: 31,
///   description: 'Remove this deprecated API endpoint',
///   slackMention: '@channel',
/// )
/// void deprecatedFunction() {
///   // ...
/// }
/// ```
///
/// The deadline_reminder GitHub Action will scan for these annotations
/// and send Slack notifications when deadlines are due.
class Deadline {
  /// Creates a new Deadline annotation.
  ///
  /// [year], [month], and [day] are required to specify the deadline date.
  /// [description] is optional but recommended to explain why the deadline exists.
  /// [slackMention] is optional and can be used to mention specific users or channels.
  const Deadline({
    required this.year,
    required this.month,
    required this.day,
    this.description,
    this.slackMention,
  });

  /// The year of the deadline (e.g., 2024).
  final int year;

  /// The month of the deadline (1-12).
  final int month;

  /// The day of the deadline (1-31).
  final int day;

  /// An optional description explaining what needs to be done by the deadline.
  final String? description;

  /// An optional Slack mention (e.g., '@user', '@channel', '<@U12345678>').
  /// This will be included in the Slack notification.
  final String? slackMention;

  /// Returns the deadline as a DateTime object.
  DateTime get dateTime => DateTime(year, month, day);

  /// Returns the deadline as a formatted string (YYYY-MM-DD).
  String get formattedDate =>
      '${year.toString()}-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}';

  @override
  String toString() =>
      'Deadline($formattedDate${description != null ? ', description: $description' : ''})';
}
