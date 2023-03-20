import type { DeltaStatic } from "quill";

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
  return delta.ops
    .filter((op) => op.insert?.trim().length > 0)
    .reduce((acc, op) => {
      return acc + op.insert
    }, '')
}
