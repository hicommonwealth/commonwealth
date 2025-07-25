import {
  countLinesMarkdown,
  countLinesQuill,
  createDeltaFromText,
  deserializeDelta,
  getTextFromDelta,
  SerializableDeltaStatic,
  serializeDelta,
} from 'client/scripts/views/components/react_quill_editor/utils';
import { DeltaStatic } from 'quill';
import { describe, expect, test } from 'vitest';

describe('react quill editor unit tests', () => {
  describe('createDeltaFromText', () => {
    test('should convert text to delta (richtext)', () => {
      const text = 'hello';
      const expectedDelta = {
        ops: [{ insert: 'hello' }],
        ___isMarkdown: false,
      } as any as SerializableDeltaStatic;
      const result = createDeltaFromText(text);
      expect(result).toEqual(expectedDelta);
    });

    test('should convert text to delta (richtext) – bad input case', () => {
      const text = '';
      const expectedDelta = {
        ops: [{ insert: '' }],
        ___isMarkdown: false,
      } as any as SerializableDeltaStatic;
      const result = createDeltaFromText(text);
      expect(result).toEqual(expectedDelta);
    });

    test('should convert text to delta (markdown)', () => {
      const text = 'hello';
      const expectedDelta = {
        ops: [{ insert: 'hello' }],
        ___isMarkdown: true,
      } as any as SerializableDeltaStatic;
      const result = createDeltaFromText(text, true);
      expect(result).toEqual(expectedDelta);
    });
  });

  describe('getTextFromDelta', () => {
    test('should convert delta to text', () => {
      const delta = {
        ops: [{ insert: 'wasup' }],
      } as SerializableDeltaStatic;
      const expectedText = 'wasup';
      const result = getTextFromDelta(delta);
      expect(result).toBe(expectedText);
    });
  });

  describe('countLinesMarkdown', () => {
    test('should return num lines in markdown text', () => {
      // content will usually have a new line at the end
      const content = 'hello\nthere\nblah\n';
      const expectedNumLines = 3;
      const result = countLinesMarkdown(content);
      expect(result).toBe(expectedNumLines);
    });
  });

  describe('countLinesQuill', () => {
    test('should return num lines in richtext', () => {
      // content will usually have a new line at the end
      const delta = {
        ops: [{ insert: 'hello\nthere\n' }, { insert: 'blah\n123\n' }],
      } as DeltaStatic;
      const expectedNumLines = 4;
      const result = countLinesQuill(delta);
      expect(result).toBe(expectedNumLines);
    });
  });

  describe('serializeDelta', () => {
    test('should serialize a DeltaStatic (richtext) to string', () => {
      const original = {
        ops: [{ insert: 'hello' }],
        ___isMarkdown: false,
      } as SerializableDeltaStatic;
      const expectedOutput =
        '{"ops":[{"insert":"hello"}],"___isMarkdown":false}';
      const result = serializeDelta(original);
      expect(result).toBe(expectedOutput);
    });

    test('should serialize a DeltaStatic (markdown) to string', () => {
      const original = {
        ops: [{ insert: 'hello' }],
        ___isMarkdown: true,
      } as SerializableDeltaStatic;
      const expectedOutput = 'hello';
      const result = serializeDelta(original);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('deserializeDelta', () => {
    test('should deserialize a string (richtext) to DeltaStatic', () => {
      const original = '{"ops":[{"insert":"hello"}],"___isMarkdown":false}';
      const expectedOutput = {
        ops: [{ insert: 'hello' }],
        ___isMarkdown: false,
      } as SerializableDeltaStatic;
      const result = deserializeDelta(original);
      expect(result).toEqual(expectedOutput);
    });

    test('should deserialize a string (richtext) to DeltaStatic - bad input case', () => {
      // bad input should return an empty richtext delta with markdown true
      const original = null;
      const expectedOutput = {
        ops: [{ insert: '' }],
        ___isMarkdown: true,
      } as SerializableDeltaStatic;
      // @ts-expect-error StrictNullChecks
      const result = deserializeDelta(original);
      expect(result).toEqual(expectedOutput);
    });

    test('should deserialize a string (markdown) to DeltaStatic', () => {
      const original = 'hello';
      const expectedOutput = {
        ops: [{ insert: 'hello' }],
        ___isMarkdown: true,
      } as SerializableDeltaStatic;
      const result = deserializeDelta(original);
      expect(result).toEqual(expectedOutput);
    });
  });
});
