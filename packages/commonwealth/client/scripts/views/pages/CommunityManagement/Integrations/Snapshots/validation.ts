import z from 'zod';

const snapshotNameSchema = z
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

export { snapshotValidationSchema };
