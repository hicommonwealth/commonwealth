import { expect } from 'chai';
import { getFileSizeBytes } from '../../src/utils/getFileSizeBytes';

describe('checkIconSize', () => {
  it("should return zero if url provided doesn't exist", async () => {
    const fileSizeBytes = await getFileSizeBytes('badUrl');
    expect(fileSizeBytes).to.equal(0);
  });

  // TODO: make this test not require a remote HTTP request?
  it('should return the image size', async () => {
    const fileSizeBytes = await getFileSizeBytes(
      'https://commonwealth-uploads.s3.us-east-2.amazonaws.com/bebbda6b-6b10-4cbd-8839-4fa8d2a0b266.jpg',
    );
    expect(fileSizeBytes).to.equal(14296);
  });
});
