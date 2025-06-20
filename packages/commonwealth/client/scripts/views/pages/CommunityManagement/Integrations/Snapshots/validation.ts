import z from 'zod/v4';

export const snapshotNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9-.]+\.((xyz)|(eth)|(io))$/, {
    message: 'Snapshot must be valid, and end in *.eth, *.xyz, or *.io',
  });

const snapshotLinkSchema = z
  .string()
  .regex(
    /^https:\/\/(\w+\.)?snapshot\.org\/#\/[a-zA-Z0-9-.]+\.((xyz)|(eth)|(io))$/,
    {
      message: 'Snapshot link must be valid, and end in *.eth, *.xyz, or *.io',
    },
  );

const snapshotValidationSchema = z.union([
  snapshotNameSchema,
  snapshotLinkSchema,
]);

const isValidSnapshotName = (snapshotName: string) => {
  try {
    snapshotNameSchema.parse(snapshotName.trim());
    return true;
  } catch {
    return false;
  }
};

export { isValidSnapshotName, snapshotValidationSchema };
