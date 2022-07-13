// Quill Editor Modes

export type QuillMode = 'markdown' | 'richText' | 'hybrid';

export type QuillActiveMode = 'markdown' | 'richText';

// Quill Delta Format
export type DeltaAttributes = {
  bold?: boolean;
  color?: string;
  italic?: boolean;
  header?: number;
};

export type DeltaInsert = {
  image?: string;
};

export type DeltaOps = {
  insert: string | DeltaInsert;
  attributes?: DeltaAttributes;
};

export type QuillDelta = {
  ops: DeltaOps[];
};

export type QuillTextContents = string | QuillDelta;
