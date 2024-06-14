import { Icon, IconProps } from '@phosphor-icons/react';
import axios from 'axios';
import type { DeltaStatic } from 'quill';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { compressImage } from 'utils/ImageCompression';
import { notifyError } from '../../../controllers/app/notifications';
import { replaceBucketWithCDN } from '../../../helpers/awsHelpers';

export const VALID_IMAGE_TYPES = ['jpeg', 'gif', 'png'];

// createDeltaFromText returns a new DeltaStatic object from a string
export const createDeltaFromText = (
  str: string,
  isMarkdown?: boolean,
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
      if (op.insert?.twitter) {
        return true;
      }
      return false;
    })
    .reduce((acc, op) => {
      const text =
        typeof op.insert === 'string'
          ? op.insert
          : op.insert.twitter
          ? '(tweet)'
          : '(image)\n';
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
  jwtToken: string,
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
      }),
    );

    if (sigResponse.status != 200) {
      throw new Error(
        `failed to get an S3 signed upload URL: ${sigResponse.data.error}`,
      );
    }

    const signedUploadUrl = sigResponse.data.result;

    const compressedFile = await compressImage(file);

    // upload the file via the signed URL
    await axios.put(signedUploadUrl, compressedFile, {
      headers: {
        'Content-Type': file.type,
      },
    });

    const trimmedURL = replaceBucketWithCDN(signedUploadUrl.split('?')[0]);
    console.log(`upload succeeded: ${trimmedURL}`);

    return trimmedURL;
  } catch (err) {
    console.error('upload failed: ', err);
    notifyError('Upload failed');
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
      return createDeltaFromText('', true);
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

// fetchTwitterEmbedInfo fetches and returns the embed info (including HTML) for a tweet
export const fetchTwitterEmbedInfo = async (url: string) => {
  // this will not work locally due to CORS
  const embedInfoUrl = 'https://publish.twitter.com/oembed';
  const res = await axios.get(embedInfoUrl, {
    params: {
      url,
    },
  });
  if (res.status >= 300) {
    throw new Error(res.data);
  }
  return res.data;
};

export const renderToolbarIcon = (PhosphorIcon: Icon, props?: IconProps) => {
  return ReactDOMServer.renderToStaticMarkup(
    <PhosphorIcon weight="bold" {...props} />,
  );
};

const formatOpsInsert = (currentLine, formattingAttrs) => {
  let prefixed = '';
  let suffixed = '';

  const headerNum = formattingAttrs.header;
  const bold = formattingAttrs.bold;
  const strike = formattingAttrs.strike;
  const italic = formattingAttrs.italic;

  const newLineRegex = /^(\n+)(.+)/g;
  const match = [...currentLine.insert.matchAll(newLineRegex)];

  const newLines = match?.[0]?.[1];
  const text = match?.[0]?.[2];

  if (headerNum) {
    prefixed = prefixed.concat('#'.repeat(headerNum), ' ');
  }

  if (bold) {
    prefixed = prefixed.concat('**');
    suffixed = '**' + suffixed;
  }

  if (italic) {
    prefixed = prefixed.concat('*');
    suffixed = '*' + suffixed;
  }

  if (strike) {
    prefixed = prefixed.concat('~~');
    suffixed = '~~' + suffixed;
  }

  return `${newLines || ''}${prefixed}${
    text || currentLine.insert || ''
  }${suffixed}`;
};

export const RTFtoMD = (delta: DeltaStatic) => {
  let mdString = '';
  (delta?.ops || []).forEach((currentLine, index) => {
    const nextLine = delta.ops?.[index + 1];

    const onlyNewLinesRegex = /^(\n+)$/g;
    const currentIsNewLineInsert = onlyNewLinesRegex.test(currentLine.insert);
    const nextIsNewLineInsert =
      nextLine && onlyNewLinesRegex.test(nextLine.insert);
    let text = '';

    if (currentIsNewLineInsert) {
      text = currentLine.insert;
    } else {
      if (currentLine.attributes) {
        text = formatOpsInsert(currentLine, currentLine.attributes);
      } else {
        if (nextLine && nextIsNewLineInsert) {
          text = formatOpsInsert(currentLine, nextLine.attributes);
        } else {
          text = currentLine.insert;
        }
      }
    }

    mdString = mdString.concat(text);
  });

  const mdDelta = {
    ops: [
      {
        insert: mdString,
      },
    ],
    ___isMarkdown: true,
  };

  return mdDelta as SerializableDeltaStatic;
};
