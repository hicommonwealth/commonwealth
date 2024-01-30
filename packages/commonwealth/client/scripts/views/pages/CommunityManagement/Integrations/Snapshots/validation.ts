import z from 'zod';

const snapshotValidationSchema = z.string().refine(
  (space) => {
    const extension = space.slice(space.length - 4);
    return extension === '.eth' || extension === '.xyz';
  },
  {
    message: 'Snapshot name must be in the form of *.eth or *.xyz',
  },
);

export { snapshotValidationSchema };
