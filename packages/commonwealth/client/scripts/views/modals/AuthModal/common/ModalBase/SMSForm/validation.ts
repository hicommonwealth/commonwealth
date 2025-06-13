import { z } from 'zod/v4';

const SMSValidationSchema = z.object({
  SMS: z.string().min(10, { message: 'Invalid phone number' }),
});

export { SMSValidationSchema };
