import z from 'zod';

const snapshotValidationSchema = z
  .string()
  .refine(
    (space) => {
      const extension = space.slice(space.length - 4);
      return extension === '.eth' || extension === '.xyz';
    },
    {
      message: 'Snapshot name must be in the form of *.eth or *.xyz',
    },
  )
  .refine(
    (space) => {
      const http = space.includes('http' || 'https');
      return !http;
    },
    {
      message:
        'Only input the name of your Snapshot space, not the full url that includes http or https',
    },
  );

export { snapshotValidationSchema };
