```Typescript
import React, { useRef, useEffect } from "react";
import Quill from "quill";

const QuillEditor = ({ onEditorChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = new Quill(editorRef.current, {
      theme: "snow"`
    });
    editor.on("text-change", (delta, oldDelta, source) => {
      onEditorChange(editor.getContents());
    });
  }, []);

  return <div ref={editorRef} style={{ height: "300px" }} />;
};

export default QuillEditor;
```
