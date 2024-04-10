import type { S3 } from 'aws-sdk';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export interface Resource {
  readonly location: string;
}

export interface AsyncWriter {
  readonly write: (filename: string, content: string) => Promise<Resource>;
}

export function createAsyncWriter(type: 'mock' | 's3'): AsyncWriter {
  switch (type) {
    case 'mock':
      return createAsyncWriterMock();
    case 's3':
      return createAsyncWriterS3();
  }
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
    const params: S3.Types.PutObjectRequest = {
      Bucket: 'assets.commonwealth.im',
      Key: `${filename}`,
      Body: content,
      ContentType: 'text/xml; charset=utf-8',
    };

    const upload = await s3.upload(params).promise();

    return { location: upload.Location };
  }

  return { write };
}
