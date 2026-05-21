import { describe, expect, test } from 'vitest';
import { z, ZodType } from 'zod';
import { api as externalApi } from '../../../server/api/external-router';

const toJSONSchemaOptions = {
  unrepresentable: 'any' as const,
  override: ({
    zodSchema,
    jsonSchema,
  }: {
    zodSchema: unknown;
    jsonSchema: Record<string, unknown>;
  }) => {
    if (zodSchema instanceof z.ZodDate) {
      jsonSchema.type = 'string';
    }
  },
};

/**
 * Ensures all external API input schemas can be converted to JSON Schema,
 * which is required for the MCP server's tools/list handler.
 *
 * This catches issues like z.date() fields that cannot be represented
 * in JSON Schema without explicit configuration.
 */
describe('MCP tool schemas', () => {
  const procedures = Object.keys(externalApi) as Array<
    keyof typeof externalApi
  >;

  test('all external API input schemas should be convertible to JSON Schema', () => {
    const failures: string[] = [];

    for (const key of procedures) {
      const procedure = externalApi[key];
      const inputSchema = procedure._def.inputs[0] as ZodType;
      if (!inputSchema) continue;

      try {
        z.toJSONSchema(inputSchema, toJSONSchemaOptions);
      } catch (e) {
        failures.push(`${key}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    expect(failures, `Failed schemas:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('all generated JSON Schemas should be valid schema objects', () => {
    for (const key of procedures) {
      const procedure = externalApi[key];
      const inputSchema = procedure._def.inputs[0] as ZodType;
      if (!inputSchema) continue;

      const jsonSchema = z.toJSONSchema(inputSchema, toJSONSchemaOptions);

      expect(jsonSchema, `${key}: should be an object`).toBeTypeOf('object');
      expect(jsonSchema, `${key}: should not be null`).not.toBeNull();
      expect(jsonSchema, `${key}: should have $schema`).toHaveProperty(
        '$schema',
      );
      expect(jsonSchema, `${key}: should have type`).toHaveProperty('type');

      // Verify date fields are serialized as strings, not empty objects
      const json = JSON.stringify(jsonSchema);
      const parsed = JSON.parse(json);
      expect(parsed, `${key}: should survive JSON round-trip`).toEqual(
        jsonSchema,
      );

      // Check no empty property definitions (symptom of unhandled types)
      if (parsed.properties) {
        for (const [prop, schema] of Object.entries(
          parsed.properties as Record<string, object>,
        )) {
          expect(
            Object.keys(schema).length,
            `${key}.${prop}: property schema should not be empty`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });
});
