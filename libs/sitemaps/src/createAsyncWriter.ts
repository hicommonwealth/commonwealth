import { PutObjectCommandInput, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { formatS3Url } from '@hicommonwealth/model';

const BUCKET_NAME = 'sitemap.commonwealth.im';
const s3 = new S3();

export interface Resource {
  readonly location: string;
}

export interface AsyncWriter {
  readonly write: (filename: string, content: string) => Promise<Resource>;
}

export function createAsyncWriterMock() {
  const written: { [key: string]: string } = {};

  async function write(filename: string, content: string) {
    written[filename] = content;
    return {
      location: 'https://www.example.com/' + filename,
    };
  }

  return { write, written };
}

export function createAsyncWriterS3(): AsyncWriter {
  async function write(filename: string, content: string): Promise<Resource> {
    const params: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: `${filename}`,
      Body: content,
      ContentType: 'text/xml; charset=utf-8',
    };

    const upload = await new Upload({
      client: s3,
      params,
    }).done();

    if (!upload.Location) {
      throw new Error('Failed to return upload location');
    }

    return { location: formatS3Url(upload.Location, BUCKET_NAME) };
  }

  return { write };
}
