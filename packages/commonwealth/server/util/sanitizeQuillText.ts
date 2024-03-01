// EmbedSanitizer returns a sanitized URL string if the input URL matches the format and is valid, otherwise null
type EmbedSanitizer = (url: string) => string | null;

const youtubeEmbedSanitizer: EmbedSanitizer = (url: string): string | null => {
  const regex =
    // eslint-disable-next-line max-len
    /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  const match = url.match(regex);
  if (match) {
    const hash = match[1];
    return `https://www.youtube.com/embed/${hash}?autoplay=0`;
  }
  return null;
};

const vimeoEmbedSanitizer: EmbedSanitizer = (url: string): string | null => {
  const regex = /(?:https?:\/\/)?player\.vimeo\.com\/video\/(\d+)/;
  const match = url.match(regex);
  if (match) {
    const hash = match[1];
    return `https://player.vimeo.com/video/${hash}`;
  }
  return null;
};

// ... add more embed sanitizers here ...

const embedSanitizers: EmbedSanitizer[] = [
  youtubeEmbedSanitizer,
  vimeoEmbedSanitizer,
];

// sanitizeQuillText returns a sanitized version of the input
type QuillOps = {
  ops: any[];
};
export function sanitizeQuillText(input: string, noEncode?: boolean): string {
  if (!input) {
    return '';
  }

  let parsedObject: QuillOps | null = null;
  if (noEncode) {
    parsedObject = JSON.parse(input);
  } else {
    try {
      parsedObject = JSON.parse(decodeURIComponent(input));
    } catch (err) {
      // is not richtext
      return input;
    }
  }
  const { ops } = parsedObject;

  if (!ops) {
    return JSON.parse(decodeURIComponent(input));
  }
  for (const op of ops) {
    const videoEmbedUrl: string | null = op.insert?.video;
    if (videoEmbedUrl) {
      const sanitizedEmbedUrl = embedSanitizers
        .map((fn) => fn(videoEmbedUrl))
        .find(Boolean);

      if (sanitizedEmbedUrl) {
        op.insert = {
          video: sanitizedEmbedUrl,
        };
      } else {
        op.insert = '';
      }
    }
  }
  if (noEncode) {
    return JSON.stringify(parsedObject);
  }
  return encodeURIComponent(JSON.stringify(parsedObject));
}
