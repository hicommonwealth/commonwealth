import { DeltaStatic } from "quill"

// parseDelta createds a new DeltaStatic object from a string JSON string
export const parseDeltaString = (str: string) : DeltaStatic => {
  try {
    return JSON.parse(str)
  } catch (err) {
    console.warn('failed to parse string JSON', err)
    return createDeltaFromText(str)
  }
}

// createDeltaFromText creates a new DeltaStatic object from a string
export const createDeltaFromText = (str: string) : DeltaStatic => {
  return {
    ops: [
      {
        insert: str
      }
    ]
  } as DeltaStatic
}

// getTextFromDelta returns the text from a DeltaStatic
export const getTextFromDelta = (delta: DeltaStatic) : string => {
  if (!delta?.ops) {
    return ''
  }
  // treat a single line break as empty input
  if (delta.ops.length === 1 && delta.ops[0].insert === '\n') {
    return ''
  }
  return delta.ops
    .filter((op) => op.insert?.trim().length > 0)
    .reduce((acc, op) => {
      return acc + op.insert
    }, '')
}