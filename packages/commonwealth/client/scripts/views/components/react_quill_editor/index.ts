
import { Delta, DeltaStatic } from "quill"
import ReactQuillEditor from "./react_quill_editor"

export const createDeltaFromText = (str: string) => {
  return new Delta({
    ops: [
      {
        insert: str
      }
    ]
  })
}

export const getTextFromDelta = (delta: DeltaStatic) : string => {
  if (delta.ops.length > 0) {
    return delta.ops[0].insert || ''
  }
  return ''
}

export { ReactQuillEditor }
