import { EVM_ADDRESS_STRICT_REGEX } from '@hicommonwealth/schemas';
import { z } from 'zod';

export const PROMPT_MAX_LENGTH = 500;
export const DURATION_MIN = 1;
export const DURATION_MAX = 90;
export const THRESHOLD_MIN = 51;
export const THRESHOLD_MAX = 99;
export const THRESHOLD_DEFAULT = 55;
/** Contract requires initial liquidity > 0 ("Liquidity required" otherwise). */
export const INITIAL_LIQUIDITY_MIN = 0.000001;

const POSITIVE_DECIMAL_REGEX = /^\d+(\.\d+)?$/;

const collateralOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const predictionMarketEditorFormSchema = z
  .object({
    prompt: z
      .string()
      .min(1, 'Prompt is required')
      .max(
        PROMPT_MAX_LENGTH,
        `Prompt must be at most ${PROMPT_MAX_LENGTH} characters`,
      ),
    collateralOption: collateralOptionSchema,
    customCollateralAddress: z.string(),
    durationDays: z.coerce
      .number()
      .min(
        DURATION_MIN,
        `Duration must be between ${DURATION_MIN} and ${DURATION_MAX} days`,
      )
      .max(
        DURATION_MAX,
        `Duration must be between ${DURATION_MIN} and ${DURATION_MAX} days`,
      ),
    resolutionThreshold: z.coerce
      .number()
      .min(
        THRESHOLD_MIN,
        `Threshold must be between ${THRESHOLD_MIN} and ${THRESHOLD_MAX}%`,
      )
      .max(
        THRESHOLD_MAX,
        `Threshold must be between ${THRESHOLD_MIN} and ${THRESHOLD_MAX}%`,
      ),
    initialLiquidity: z
      .string()
      .min(1, 'Initial liquidity is required (contract requires > 0)')
      .refine(
        (v) =>
          POSITIVE_DECIMAL_REGEX.test(v.trim()) &&
          Number(v.trim()) >= INITIAL_LIQUIDITY_MIN,
        {
          message: `Initial liquidity must be at least ${INITIAL_LIQUIDITY_MIN} (contract requires > 0)`,
        },
      ),
  })
  .refine(
    (data) => {
      if (data.collateralOption.value !== 'custom') return true;
      return EVM_ADDRESS_STRICT_REGEX.test(data.customCollateralAddress.trim());
    },
    {
      message:
        'Custom collateral must be a valid ERC20 contract address (0x...)',
      path: ['customCollateralAddress'],
    },
  );

export type PredictionMarketEditorFormValues = z.infer<
  typeof predictionMarketEditorFormSchema
>;

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
  if (!EVM_ADDRESS_STRICT_REGEX.test(collateralAddress)) return false;
  if (
    !initialLiquidity.trim() ||
    !POSITIVE_DECIMAL_REGEX.test(initialLiquidity) ||
    Number(initialLiquidity) < INITIAL_LIQUIDITY_MIN
  )
    return false;
  return true;
}
