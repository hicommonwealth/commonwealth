import { assert } from "chai"
import { countLinesMarkdown, createDeltaFromText, deserializeDelta, getTextFromDelta, SerializableDeltaStatic, serializeDelta } from "client/scripts/views/components/react_quill_editor/utils"

describe('react quill editor unit tests', () => {

  describe('createDeltaFromText', () => {

    it('should convert text to delta (richtext)', () => {
      const text = 'hello'
      const expectedDelta = {
        ops: [
          { insert: 'hello' }
        ],
        ___isMarkdown: false
      } as any as SerializableDeltaStatic
      const result = createDeltaFromText(text)
      assert.deepEqual(result, expectedDelta)
    })

    it('should convert text to delta (markdown)', () => {
      const text = 'hello'
      const expectedDelta = {
        ops: [
          { insert: 'hello' }
        ],
        ___isMarkdown: true
      } as any as SerializableDeltaStatic
      const result = createDeltaFromText(text, true)
      assert.deepEqual(result, expectedDelta)
    })

  })

  describe('getTextFromDelta', () => {

    it('should convert delta to text', () => {
      const delta = {
        ops: [
          { insert: 'wasup' }
        ]
      } as SerializableDeltaStatic
      const expectedText = 'wasup'
      const result = getTextFromDelta(delta)
      assert.equal(result, expectedText)
    })

  })

  describe('countLinesMarkdown', () => {

    it('should return num lines in markdown text', () => {
      // content will usually have a new line at the end
      const content = 'hello\nthere\nblah\n'
      const expectedNumLines = 3
      const result = countLinesMarkdown(content)
      assert.equal(result, expectedNumLines)
    })

  })

  describe('serializeDelta', () => {

    it ('should serialize a DeltaStatic (richtext) to string', () => {
      const original = {
        ops: [
          { insert: 'hello' }
        ],
        ___isMarkdown: false
      } as SerializableDeltaStatic
      const expectedOutput = '{"ops":[{"insert":"hello"}],"___isMarkdown":false}'
      const result = serializeDelta(original)
      assert.equal(result, expectedOutput)
    })

    it ('should serialize a DeltaStatic (markdown) to string', () => {
      const original = {
        ops: [
          { insert: 'hello' }
        ],
        ___isMarkdown: true
      } as SerializableDeltaStatic
      const expectedOutput = 'hello'
      const result = serializeDelta(original)
      assert.equal(result, expectedOutput)
    })

  })

  describe('deserializeDelta', () => {

    it('should deserialize at string (richtext) to DeltaStatic', () => {
      const original = '{"ops":[{"insert":"hello"}],"___isMarkdown":false}'
      const expectedOutput = {
        ops: [
          { insert: 'hello' }
        ],
        ___isMarkdown: false
      } as SerializableDeltaStatic
      const result = deserializeDelta(original)
      assert.deepEqual(result, expectedOutput)
    })

    it('should deserialize at string (markdown) to DeltaStatic', () => {
      const original = 'hello'
      const expectedOutput = {
        ops: [
          { insert: 'hello' }
        ],
        ___isMarkdown: true
      } as SerializableDeltaStatic
      const result = deserializeDelta(original)
      assert.deepEqual(result, expectedOutput)
    })

  })

})
