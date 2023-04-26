import axios from 'axios';
import type { DeltaStatic } from 'quill';

// createDeltaFromText returns a new DeltaStatic object from a string
export const createDeltaFromText = (
  str: string,
  isMarkdown?: boolean
): SerializableDeltaStatic => {
  return {
    ops: [
      {
        insert: str || '',
      },
    ],
    ___isMarkdown: !!isMarkdown,
  } as SerializableDeltaStatic;
};

// getTextFromDelta returns the text from a DeltaStatic
export const getTextFromDelta = (delta: DeltaStatic): string => {
  if (!delta?.ops) {
    return '';
  }
  // treat a single line break as empty input
  if (delta.ops.length === 1 && delta.ops[0].insert === '\n') {
    return '';
  }
  return delta.ops
    .filter((op) => {
      if (typeof op.insert === 'string') {
        return op.insert.trim().length > 0;
      }
      if (op.insert?.image) {
        return true;
      }
      return false;
    })
    .reduce((acc, op) => {
      const text = typeof op.insert === 'string' ? op.insert : '(image)\n';
      return acc + text;
    }, '');
};

// base64ToFile creates a File from a base64 data string
export const base64ToFile = (data: string, fileType: string): File => {
  const arr = data.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  const filename = new Date().getTime().toString();
  return new File([u8arr], filename, { type: fileType });
};

// uploadFileToS3 uploads file data to S3 and returns the URL for the file
export const uploadFileToS3 = async (
  file: File,
  appServerUrl: string,
  jwtToken: string
): Promise<string> => {
  try {
    // get a signed upload URL for s3
    const sigResponse = await axios.post(
      `${appServerUrl}/getUploadSignature`,
      new URLSearchParams({
        mimetype: file.type,
        name: file.name,
        auth: 'true',
        jwt: jwtToken,
      })
    );

    if (sigResponse.status != 200) {
      throw new Error(
        `failed to get an S3 signed upload URL: ${sigResponse.data.error}`
      );
    }

    const signedUploadUrl = sigResponse.data.result;

    // upload the file via the signed URL
    await axios.put(signedUploadUrl, file, {
      params: {
        'Content-Type': file.type,
      },
    });

    const trimmedURL = signedUploadUrl.split('?')[0];
    console.log(`upload succeeded: ${trimmedURL}`);

    return trimmedURL;
  } catch (err) {
    console.error('upload failed: ', err);
    throw err;
  }
};

export type SerializableDeltaStatic = DeltaStatic & {
  ___isMarkdown?: boolean;
};
// serializeDelta converts a delta object to a string for persistence
export const serializeDelta = (delta: DeltaStatic): string => {
  if ((delta as SerializableDeltaStatic).___isMarkdown) {
    return getTextFromDelta(delta);
  }
  return JSON.stringify(delta);
};

// parseDelta converts a string to a delta object for state
export const deserializeDelta = (str: string): DeltaStatic => {
  try {
    if (typeof str !== 'string') {
      // empty richtext delta
      return createDeltaFromText('', false);
    }
    // is richtext delta object
    const delta: DeltaStatic = JSON.parse(str);
    if (!delta.ops) {
      throw new Error('object is not a delta static');
    }
    return delta;
  } catch (err) {
    // otherwise, it's plain text markdown
    return createDeltaFromText(str, true);
  }
};

// countLinesQuill returns the number of text lines for a quill ops array
export const countLinesQuill = (delta: DeltaStatic): number => {
  if (!delta || !delta.ops) {
    return 0;
  }

  let count = 0;

  for (const op of delta.ops) {
    if (typeof op.insert === 'string') {
      try {
        count += op.insert.split('\n').length - 1;
      } catch (e) {
        console.log(e);
      }
    }
  }

  return count;
};

// countLinesMarkdown returns the number of lines for the text
export const countLinesMarkdown = (text: string): number => {
  return text.split('\n').length - 1;
};

type QuillDraft = {
  key: string;
  lastSavedAt: number;
  contentDelta: SerializableDeltaStatic;
};

const createDraftKey = (key: string) => `cw-draft-${key}`;

// saveDraft saves the delta to local storage by key
export const saveDraft = (key: string, contentDelta: DeltaStatic) => {
  if (!key) {
    return;
  }
  const data: QuillDraft = {
    key,
    lastSavedAt: Date.now(),
    contentDelta,
  };
  localStorage.setItem(createDraftKey(key), JSON.stringify(data));
};

// restoreDraft returns the delta queried from local storage by key
export const restoreDraft = (key: string): QuillDraft | null => {
  if (!key) {
    return null;
  }
  const data = localStorage.getItem(createDraftKey(key));
  if (!data) {
    return null;
  }
  return JSON.parse(data) as QuillDraft;
};

export const clearDraft = (key: string) => {
  if (!key) {
    return;
  }
  localStorage.removeItem(createDraftKey(key));
};
