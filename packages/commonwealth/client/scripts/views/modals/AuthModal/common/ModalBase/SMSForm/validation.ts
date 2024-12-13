import { z } from 'zod';

const SMSValidationSchema = z.object({
  SMS: z.string(),
});

export { SMSValidationSchema };
