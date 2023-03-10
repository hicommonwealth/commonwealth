
import { DeltaStatic } from "quill"
import ReactQuillEditor from "./react_quill_editor"

export const EMPTY_OPS = { ops: [] } as DeltaStatic

export const createInsertOps = (str: string) => {
  return {
    ops: [
      {
        insert: str
      }
    ]
  } as DeltaStatic
}

export { ReactQuillEditor }
