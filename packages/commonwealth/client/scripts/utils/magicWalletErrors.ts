/**
 * Utility functions for handling Magic wallet specific errors
 */

export interface MagicWalletError {
  type: 'insufficient_funds' | 'generic_error';
  originalError: Error;
  message: string;
  actionRequired?: string;
}

/**
 * Detects if an error is related to insufficient funds for gas fees
 * Based on common error patterns from Magic wallet RPC responses
 */
export function detectInsufficientFundsError(error: Error | any): boolean {
  if (!error) return false;

  // Handle the error message from various sources
  let errorMessage = '';
  if (typeof error === 'string') {
    errorMessage = error.toLowerCase();
  } else if (error.message) {
    errorMessage = error.message.toLowerCase();
  } else if (error.toString) {
    errorMessage = error.toString().toLowerCase();
  }

  // Common patterns for insufficient funds errors
  const insufficientFundsPatterns = [
    'insufficient funds for gas',
    'insufficient funds for intrinsic transaction cost',
    'account balance is too low',
    'not enough funds',
    'insufficient balance',
    'magic rpc error: [-32603] insufficient funds', // Full Magic RPC error
    'rpc error: [-32603]', // Magic wallet specific RPC error code
    'price + value: have 0 want', // The specific error from your logs
    '[-32603] insufficient funds for gas', // Another variant
  ];

  return insufficientFundsPatterns.some((pattern) =>
    errorMessage.includes(pattern),
  );
}

/**
 * Creates a user-friendly error object for Magic wallet errors
 */
export function createMagicWalletError(error: Error): MagicWalletError {
  if (detectInsufficientFundsError(error)) {
    return {
      type: 'insufficient_funds',
      originalError: error,
      message:
        'Insufficient funds to complete this transaction. Your Magic wallet needs more ETH to pay for gas fees.',
      actionRequired: 'Please add funds to your Magic wallet and try again.',
    };
  }

  return {
    type: 'generic_error',
    originalError: error,
    message:
      'Transaction failed. Please try again or contact support if the issue persists.',
  };
}

/**
 * Creates an enhanced error message with action guidance for Magic wallet users
 */
export function createMagicWalletErrorMessage(
  error: Error,
  includeActionGuidance: boolean = true,
): string {
  const magicError = createMagicWalletError(error);

  if (magicError.type === 'insufficient_funds') {
    let message = magicError.message;

    if (includeActionGuidance && magicError.actionRequired) {
      message += '\n\n' + magicError.actionRequired;
      message += '\n\nYou can add funds by:';
      message += '\n• Clicking "Add Funds" to open your Magic wallet';
      message += '\n• Transferring ETH from another wallet';
      message += '\n• Using a fiat on-ramp service in your Magic wallet';
    }

    return message;
  }

  return magicError.message;
}
