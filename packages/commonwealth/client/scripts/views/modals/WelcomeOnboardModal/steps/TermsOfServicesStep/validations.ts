import z from 'zod/v4';

export const termsOfServicesFormValidation = z.object({
  enableTermsOfServices: z.boolean(),
});
