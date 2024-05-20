import { PutObjectCommandInput, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

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
      Bucket: 'common-sitemap',
      Key: `${filename}`,
      Body: content,
      ContentType: 'text/xml; charset=utf-8',
    };

    const upload = await new Upload({
      client: s3,
      params,
    }).done();

    return { location: upload.Location };
  }

  return { write };
}
