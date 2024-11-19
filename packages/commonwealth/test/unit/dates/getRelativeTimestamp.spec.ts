import { getRelativeTimestamp } from 'helpers/dates';
import moment from 'moment';
import { describe, expect, test } from 'vitest';

describe('getRelativeTimestamp', () => {
  test('should return "Less than 1 min ago" for dates less than 1 minute ago', () => {
    const date = moment().subtract(30, 'seconds').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('Less than 1 min ago');
  });

  test('should return "45 min ago" for dates within 1 to 59 minutes ago', () => {
    const date = moment().subtract(45, 'minutes').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('45 min ago');
  });

  test('should return "6 hours ago" for dates within 1 to 23 hours ago', () => {
    const date = moment().subtract(6, 'hours').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('6 hours ago');
  });

  test('should return "3 days ago" for dates within 1 to 6 days ago', () => {
    const date = moment().subtract(3, 'days').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('3 days ago');
  });

  test('should return "2 weeks ago" for dates within 1 to 4 weeks ago', () => {
    const date = moment().subtract(2, 'weeks').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('2 weeks ago');
  });

  test('should return "8 months ago" for dates within 1 to 13 months ago', () => {
    const date = moment().subtract(8, 'months').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('8 months ago');
  });

  test('should return "2 years ago" for dates 13 months or more ago', () => {
    const date = moment().subtract(2, 'years').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('2 years ago');
  });

  test('should handle edge case: exactly 1 minute ago', () => {
    const date = moment().subtract(1, 'minute').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('1 min ago');
  });

  test('should handle edge case: exactly 1 hour ago', () => {
    const date = moment().subtract(1, 'hour').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('1 hour ago');
  });

  test('should handle edge case: exactly 1 day ago', () => {
    const date = moment().subtract(1, 'day').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('1 day ago');
  });

  test('should handle edge case: exactly 1 week ago', () => {
    const date = moment().subtract(1, 'week').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('1 week ago');
  });

  test('should handle edge case: exactly 4 weeks ago', () => {
    const date = moment().subtract(4, 'weeks').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('4 weeks ago');
  });

  test('should handle edge case: exactly 1 month ago', () => {
    const date = moment().subtract(1, 'month').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('4 weeks ago');
  });

  test('should handle edge case: exactly 12 months ago', () => {
    const date = moment().subtract(12, 'months').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('12 months ago');
  });

  test('should handle edge case: exactly 14 months ago', () => {
    const date = moment().subtract(14, 'month').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('1 year ago');
  });

  test('should handle edge case: exactly 2 years ago', () => {
    const date = moment().subtract(2, 'years').toISOString();
    expect(getRelativeTimestamp(date)).to.equal('2 years ago');
  });
});
