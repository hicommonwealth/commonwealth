import z from 'zod';

const snapshotValidationSchema = z
  .string()
  .refine((space) => /^[a-zA-Z0-9-.]+\.eth$|^[a-zA-Z0-9-]+\.xyz$/.test(space), {
    message:
      'Snapshot name must be in the form of *.eth or *.xyz and not include http or https',
  });

export { snapshotValidationSchema };
