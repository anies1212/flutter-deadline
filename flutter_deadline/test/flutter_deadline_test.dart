import 'package:test/test.dart';
import 'package:flutter_deadline/flutter_deadline.dart';

void main() {
  group('Deadline', () {
    test('creates with required parameters', () {
      const deadline = Deadline(year: 2024, month: 12, day: 31);

      expect(deadline.year, 2024);
      expect(deadline.month, 12);
      expect(deadline.day, 31);
      expect(deadline.description, isNull);
      expect(deadline.slackMention, isNull);
    });

    test('creates with all parameters', () {
      const deadline = Deadline(
        year: 2024,
        month: 6,
        day: 15,
        description: 'Remove deprecated API',
        slackMention: '@channel',
      );

      expect(deadline.year, 2024);
      expect(deadline.month, 6);
      expect(deadline.day, 15);
      expect(deadline.description, 'Remove deprecated API');
      expect(deadline.slackMention, '@channel');
    });

    test('formattedDate returns correct format', () {
      const deadline = Deadline(year: 2024, month: 3, day: 5);
      expect(deadline.formattedDate, '2024-03-05');
    });

    test('formattedDate pads single digit month and day', () {
      const deadline = Deadline(year: 2024, month: 1, day: 9);
      expect(deadline.formattedDate, '2024-01-09');
    });

    test('dateTime returns correct DateTime', () {
      const deadline = Deadline(year: 2024, month: 12, day: 25);
      final dt = deadline.dateTime;

      expect(dt.year, 2024);
      expect(dt.month, 12);
      expect(dt.day, 25);
    });

    test('toString without description', () {
      const deadline = Deadline(year: 2024, month: 12, day: 31);
      expect(deadline.toString(), 'Deadline(2024-12-31)');
    });

    test('toString with description', () {
      const deadline = Deadline(
        year: 2024,
        month: 12,
        day: 31,
        description: 'Test description',
      );
      expect(deadline.toString(), 'Deadline(2024-12-31, description: Test description)');
    });

    test('can be used as annotation', () {
      // This test verifies the annotation can be applied
      // The actual parsing is done by the GitHub Action
      expect(() {
        @Deadline(year: 2024, month: 12, day: 31)
        void testFunction() {}
        testFunction();
      }, returnsNormally);
    });
  });
}
