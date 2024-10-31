import z from 'zod';

export const termsOfServicesFormValidation = z.object({
  enableTermsOfServices: z.boolean(),
});
