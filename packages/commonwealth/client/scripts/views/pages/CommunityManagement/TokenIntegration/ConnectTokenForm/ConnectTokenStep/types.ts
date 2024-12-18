import { GetTokenMetadataResponse } from 'state/api/tokens/getTokenMetadata';
import { z } from 'zod';
import { connectTokenFormValidationSchema } from './validation';

export type ConnectTokenStepProps = {
  onConnect: () => void;
  onCancel: () => void;
  existingToken?: GetTokenMetadataResponse;
};

export type ConnectTokenStepSubmitValues = z.infer<
  typeof connectTokenFormValidationSchema
>;
