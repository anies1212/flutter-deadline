/// A library that provides the @Deadline annotation for marking code
/// that should be removed or refactored by a specific date.
///
/// This annotation works in conjunction with the flutter_deadline GitHub Action
/// to send Slack notifications when deadlines are approaching or have passed.
library flutter_deadline;

export 'src/deadline.dart';
