import { z } from 'zod';

const SMSValidationSchema = z.object({
  SMS: z.string().min(10, { message: 'Invalid phone number' }),
});

export { SMSValidationSchema };
