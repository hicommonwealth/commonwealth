import chai from 'chai';
import { Errors, getFileSizeBytes } from '../../server/routes/createChain';

describe('ChainIconSizeLimit tests', () => {
  it('should fail if the url provided doesn\'t exist', async () => {
    let errorCaught = false;
    try {
      await getFileSizeBytes('badUrl');
    } catch (e) {
      errorCaught = true;
      chai.assert.equal(e.message, Errors.ImageDoesntExist)
    }

    chai.assert.isTrue(errorCaught);
  });

  it('should return the image size', async () => {
    const fileSize = await getFileSizeBytes(
      'https://commonwealth-uploads.s3.us-east-2.amazonaws.com/bebbda6b-6b10-4cbd-8839-4fa8d2a0b266.jpg'
    );

    chai.assert.equal(fileSize, 14296);
  });
});