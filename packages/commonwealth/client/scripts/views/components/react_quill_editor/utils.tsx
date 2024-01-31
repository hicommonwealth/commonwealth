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

export const isMarkdownTable = (markdown: string) => {
  // Split the markdown content into lines
  const lines = markdown.trim().split('\n');

  // Check if each line contains at least one pipe character '|'
  const containsPipe = lines.every((line) => line.includes('|'));

  // Check if the first non-empty line has a pipe character '|'
  const startsWithPipe = lines
    .find((line) => line.trim().length > 0)
    ?.includes('|');

  // Check if the second non-empty line starts and ends with a pipe character '|'
  const secondLine = lines.find(
    (line) => line.trim().length > 0 && line.trim().startsWith('|'),
  );
  const secondLineStartsWithPipe = secondLine?.startsWith('|');
  const secondLineEndsWithPipe = secondLine?.endsWith('|');

  // If all the above conditions are true, it's likely a markdown table
  return (
    containsPipe &&
    startsWithPipe &&
    secondLineStartsWithPipe &&
    secondLineEndsWithPipe
  );
};

export const markdownToHtmlTable = (markdown) => {
  const lines = markdown.trim().split('\n');

  const containsPipe = lines.every((line) => line.includes('|'));

  const startsWithPipe = lines
    .find((line) => line.trim().length > 0)
    ?.includes('|');

  const secondLine = lines.find(
    (line) => line.trim().length > 0 && line.trim().startsWith('|'),
  );
  const secondLineStartsWithPipe = secondLine?.startsWith('|');
  const secondLineEndsWithPipe = secondLine?.endsWith('|');

  if (
    containsPipe &&
    startsWithPipe &&
    secondLineStartsWithPipe &&
    secondLineEndsWithPipe
  ) {
    let html = '<table>';
    let isHeaderRow = true;

    lines.forEach((line, index) => {
      const cells = line.split('|').map((cell) => cell.trim());
      const tag = isHeaderRow ? 'th' : 'td';
      const rowTag = isHeaderRow ? 'thead' : 'tbody';

      // Check if the row is solely made up of alignment markers
      const isAlignmentRow = cells.every((cell) => /^:\-+:$/.test(cell));

      if (!isAlignmentRow) {
        html += `<${rowTag}><tr>`;
        cells.forEach((cell) => {
          let alignment = '';
          if (cell.startsWith(':') && cell.endsWith(':')) {
            alignment = 'text-align:center;';
          } else if (cell.startsWith(':')) {
            alignment = 'text-align:left;';
          } else if (cell.endsWith(':')) {
            alignment = 'text-align:right;';
          }

          const bold = cell.startsWith('**') && cell.endsWith('**');
          const content = bold
            ? `<strong>${cell.substring(2, cell.length - 2)}</strong>`
            : cell;

          // Check if the cell content is the alignment format ":---:"
          const isAlignmentFormat = /^:\-+:$/.test(cell);

          if (!isAlignmentFormat) {
            html += `<${tag} style="${alignment}">${content}</${tag}>`;
          }
        });

        html += '</tr></${rowTag}>';
        if (isHeaderRow) isHeaderRow = false; // Update flag after processing header row
      }
    });

    html += '</table>';
    return html;
  } else {
    // Implement other conversion methods for different types of Markdown content
    return markdown; // For simplicity, returning original markdown if it's not a table
  }
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
      params: {
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
