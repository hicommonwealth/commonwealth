import { describe, expect, test } from 'vitest';
import { extractTokenSymbolFromAddress } from '../../src/aggregates/community/CreateTopic.command';

describe('extractTokenSymbolFromAddress', () => {
  test('should extract token symbol from simple format', () => {
    const address = '0x123::mock_navx_token::MOCK_NAVX_TOKEN';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBe('MOCK_NAVX_TOKEN');
  });

  test('should extract token symbol from complex format with angle brackets', () => {
    const address =
      '0x123::vault::VoteEscrowedToken<0x456::mock_navx_token::MOCK_NAVX_TOKEN>';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBe('MOCK_NAVX_TOKEN');
  });

  test('should prioritize complex format over simple format', () => {
    // This address has both formats - should extract from the angle brackets portion
    const address =
      '0x123::simple_token::SIMPLE<0x456::complex_token::COMPLEX>';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBe('COMPLEX');
  });

  test('should handle simple format with different token names', () => {
    const address = '0xabc::sui_token::SUI';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBe('SUI');
  });

  test('should handle complex format with nested structures', () => {
    const address = '0x789::governance::Token<0xdef::usdc_token::USDC>';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBe('USDC');
  });

  test('should return undefined for empty string', () => {
    const result = extractTokenSymbolFromAddress('');
    expect(result).toBeUndefined();
  });

  test('should return undefined for null/undefined input', () => {
    const result1 = extractTokenSymbolFromAddress(null as any);
    const result2 = extractTokenSymbolFromAddress(undefined as any);
    expect(result1).toBeUndefined();
    expect(result2).toBeUndefined();
  });

  test('should return undefined for invalid format', () => {
    const invalidAddress = 'invalid_address_format';
    const result = extractTokenSymbolFromAddress(invalidAddress);
    expect(result).toBeUndefined();
  });

  test('should return undefined for address without token symbol', () => {
    const address = '0x123::module';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBeUndefined();
  });

  test('should handle address with only one colon separator', () => {
    const address = '0x123:invalid';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBeUndefined();
  });

  test('should extract from simple format with longer address', () => {
    const address =
      '0x1234567890abcdef::long_module_name::VERY_LONG_TOKEN_NAME';
    const result = extractTokenSymbolFromAddress(address);
    expect(result).toBe('VERY_LONG_TOKEN_NAME');
  });
});
