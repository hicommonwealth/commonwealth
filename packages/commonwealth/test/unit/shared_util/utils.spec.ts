import { expect } from 'chai';
import { describe, test } from 'vitest';
import {
  minimalToNaturalDenom,
  naturalDenomToMinimal,
} from '../../../shared/utils';

describe('shared utils unit tests', () => {
  test('minimalToNaturalDenom() should convert large numbers in minimal format to natural denom format', () => {
    const tests = [
      {
        input: '123456789012345678901234567890',
        decimals: 18,
        expected: '123456789012.345678901234567890',
      },
      {
        input: '1000000000000000000000',
        decimals: 18,
        expected: '1000.000000000000000000',
      },
      {
        input: '100000000000000000000',
        decimals: 18,
        expected: '100.000000000000000000',
      },
      {
        input: '10000000000000000000',
        decimals: 18,
        expected: '10.000000000000000000',
      },
      {
        input: '1000000000000000000',
        decimals: 18,
        expected: '1.000000000000000000',
      },
      {
        input: '100000000000000000',
        decimals: 18,
        expected: '0.100000000000000000',
      },
      {
        input: '10000000000000000',
        decimals: 18,
        expected: '0.010000000000000000',
      },
      {
        input: '123456789012345678901234567890',
        decimals: 6,
        expected: '123456789012345678901234.567890',
      },
      {
        input: '12345678901234567890123456789012345',
        decimals: 6,
        expected: '12345678901234567890123456789.012345',
      },
      {
        input: '12345678901234567890123456789012345.99999', // exceeding precision
        decimals: 6,
        expected: '12345678901234567890123456789.012345', // does not round up
      },
      { input: '1000000000', decimals: 6, expected: '1000.000000' },
      { input: '100000000', decimals: 6, expected: '100.000000' },
      { input: '10000000', decimals: 6, expected: '10.000000' },
      { input: '1000000', decimals: 6, expected: '1.000000' },
      { input: '100000', decimals: 6, expected: '0.100000' },
      { input: '10000', decimals: 6, expected: '0.010000' },
      { input: undefined, decimals: 6, expected: '0' },
      { input: '1000000', decimals: undefined, expected: '0' },
      { input: '', decimals: 12, expected: '0' },
      { input: '1000000', decimals: 0, expected: '0' },
      { input: 1000000, decimals: 5, expected: '10.00000' },
    ];

    tests.forEach(({ input, decimals, expected }) => {
      expect(minimalToNaturalDenom(input, decimals)).to.equal(expected);
    });
  });
  test('naturalDenomToMinimal() should convert large numbers in natural format to minimal denom format', () => {
    const tests = [
      {
        input: '123456789012.345678901234567890',
        decimals: 18,
        expected: '123456789012345678901234567890',
      },
      {
        input: '1000',
        decimals: 18,
        expected: '1000000000000000000000',
      },
      {
        input: '100',
        decimals: 18,
        expected: '100000000000000000000',
      },
      { input: '10', decimals: 18, expected: '10000000000000000000' },
      { input: '1', decimals: 18, expected: '1000000000000000000' },
      { input: '0.1', decimals: 18, expected: '100000000000000000' },
      {
        input: '0.010000000000000009',
        decimals: 18,
        expected: '10000000000000009',
      },
      {
        input: '123456789012345678901234.567890',
        decimals: 6,
        expected: '123456789012345678901234567890',
      },
      {
        input: '123456789012345678901234.56789912345', // exceeding precision
        decimals: 6,
        expected: '123456789012345678901234567899', // does not round up
      },
      { input: '1000', decimals: 6, expected: '1000000000' },
      { input: '100.000000', decimals: 6, expected: '100000000' },
      { input: '10.000000', decimals: 6, expected: '10000000' },
      { input: '1.000001', decimals: 6, expected: '1000001' },
      { input: '0.100002', decimals: 6, expected: '100002' },
      { input: '0.010003', decimals: 6, expected: '10003' },
      { input: undefined, decimals: 6, expected: '0' },
      { input: '1000000', decimals: undefined, expected: '0' },
      { input: '', decimals: 12, expected: '0' },
      { input: '1000000', decimals: 0, expected: '0' },
      { input: 1000000, decimals: 5, expected: '100000000000' },
    ];
    tests.forEach(({ input, decimals, expected }) => {
      expect(naturalDenomToMinimal(input, decimals)).to.equal(expected);
    });
  });
});
