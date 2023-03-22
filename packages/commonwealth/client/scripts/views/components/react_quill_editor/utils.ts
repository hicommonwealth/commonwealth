import axios from "axios";
import type { DeltaStatic } from "quill";

// parseDelta creates a new DeltaStatic object from a JSON string
export const parseDeltaString = (str: string) : DeltaStatic => {
  try {
    return JSON.parse(str)
  } catch (err) {
    console.warn('failed to parse string JSON', err)
    return createDeltaFromText(str)
  }
}

// createDeltaFromText returns a new DeltaStatic object from a string
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
  // treat a single line break as empty input
  if (delta.ops.length === 1 && delta.ops[0].insert === '\n') {
    return ''
  }
  return delta.ops
    .filter((op) => {
      if (typeof op.insert === 'string') {
        return op.insert.trim().length > 0
      }
      if (op.insert.image) {
        return true
      }
      return false
    })
    .reduce((acc, op) => {
      const text = typeof op.insert === 'string' ? op.insert : '(image)\n'
      return acc + text
    }, '')
}

// base64ToFile creates a File from a base64 data string
export const base64ToFile = (data: string, fileType: string) : File => {
  const arr = data.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  const filename = new Date().getTime().toString();
  return new File([u8arr], filename, { type: fileType });
}

// uploadFileToS3 uploads file data to S3 and returns the URL for the file
export const uploadFileToS3 = async (file: File, appServerUrl: string, jwtToken: string) : Promise<string> => {
  try {

    // get a signed upload URL for s3
    const sigResponse = await axios.post(`${appServerUrl}/getUploadSignature`, new URLSearchParams({
      mimetype: file.type,
      name: file.name,
      auth: 'true',
      jwt: jwtToken,
    }))

    if (sigResponse.status != 200) {
      throw new Error(`failed to get an S3 signed upload URL: ${sigResponse.data.error}`)
    }

    const signedUploadUrl = sigResponse.data.result

    // upload the file via the signed URL
    await axios.put(signedUploadUrl, file, {
      params: {
        'Content-Type': file.type
      }
    })

    const trimmedURL = signedUploadUrl.split('?')[0]
    console.log(`upload succeeded: ${trimmedURL}`);

    return trimmedURL

  } catch (err) {
    console.error('upload failed: ', err)
    throw err
  }
}
