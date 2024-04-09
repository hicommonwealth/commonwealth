import type { S3 } from 'aws-sdk';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

interface Resource {
  readonly location: string;
}

interface AsyncWriter {
  readonly write: (path: string, content: string) => Promise<Resource>;
}

export function createAsyncWriter(type: 'mock' | 's3'): AsyncWriter {
  switch (type) {
    case 'mock':
      return createAsyncWriterMock();
    case 's3':
      return createAsyncWriterS3();
  }
}

function createAsyncWriterMock(): AsyncWriter {
  async function write() {
    return {
      location: 'https://www.example.com',
    };
  }

  return { write };
}

function createAsyncWriterS3(): AsyncWriter {
  async function write(path: string, content: string): Promise<Resource> {
    const params: S3.Types.PutObjectRequest = {
      Bucket: 'assets.commonwealth.im',
      Key: `${path}`,
      Body: content,
      ContentType: 'text/xml; charset=utf-8',
    };

    const upload = await s3.upload(params).promise();

    return { location: upload.Location };
  }

  return { write };
}
