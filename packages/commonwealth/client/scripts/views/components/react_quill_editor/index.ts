
import { Delta, DeltaStatic } from "quill"
import ReactQuillEditor from "./react_quill_editor"

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
  if (delta.ops.length > 0) {
    return delta.ops[0].insert || ''
  }
  return ''
}

export { ReactQuillEditor }
