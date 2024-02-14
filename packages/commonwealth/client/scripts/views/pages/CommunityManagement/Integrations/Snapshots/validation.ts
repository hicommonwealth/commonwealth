import z from 'zod';

const snapshotNameSchema = z.string().regex(/^[a-zA-Z0-9-.]+\.((xyz)|(eth))$/, {
  message: 'Snapshot must be valid, and end in *.eth or *.xyz',
});
const snapshotLinkSchema = z
  .string()
  .regex(
    /^https:\/\/(\w+\.)?snapshot\.org\/#\/[a-zA-Z0-9-.]+\.((xyz)|(eth))$/,
    {
      message: 'Snapshot link be valid, and end in *.eth or *.xyz',
    },
  );
const snapshotValidationSchema = z.union([
  snapshotNameSchema,
  snapshotLinkSchema,
]);

export { snapshotValidationSchema };
