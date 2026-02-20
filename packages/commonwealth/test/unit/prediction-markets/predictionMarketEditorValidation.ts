export const PROMPT_MAX_LENGTH = 500;
export const DURATION_MIN = 1;
export const DURATION_MAX = 90;
export const THRESHOLD_MIN = 51;
export const THRESHOLD_MAX = 99;
export const THRESHOLD_DEFAULT = 55;

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const POSITIVE_DECIMAL_REGEX = /^\d+(\.\d+)?$/;

export function isPredictionMarketFormValid({
  prompt,
  durationDays,
  resolutionThreshold,
  collateralAddress,
  initialLiquidity,
}: {
  prompt: string;
  durationDays: number;
  resolutionThreshold: number;
  collateralAddress: string;
  initialLiquidity: string;
}): boolean {
  if (!prompt.trim() || prompt.length > PROMPT_MAX_LENGTH) return false;
  if (durationDays < DURATION_MIN || durationDays > DURATION_MAX) return false;
  if (
    resolutionThreshold < THRESHOLD_MIN ||
    resolutionThreshold > THRESHOLD_MAX
  )
    return false;
  if (!EVM_ADDRESS_REGEX.test(collateralAddress)) return false;
  if (
    initialLiquidity !== '' &&
    (!POSITIVE_DECIMAL_REGEX.test(initialLiquidity) ||
      Number(initialLiquidity) <= 0)
  )
    return false;
  return true;
}
