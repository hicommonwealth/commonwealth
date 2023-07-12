#!/usr/bin/env node

// this script will compress the images in the Chains.icon_url, and re-upload these compressed images to s3.
// Then it will update the icon_url with the new compressed image link

import type { S3 } from 'aws-sdk';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { Op } from 'sequelize';
import sharp from 'sharp';
import models, { sequelize } from '../server/database';

const s3 = new AWS.S3();

async function compressImage(
  data: Buffer,
  contentType: string,
  resolution: number
) {
  if (
    !contentType.includes('jpeg') &&
    !contentType.includes('jpg') &&
    !contentType.includes('png') &&
    !contentType.includes('webp') &&
    !contentType.includes('gif')
  ) {
    return null; // we dont support so just early exit
  }
  const originalImage = sharp(data).resize(200, 200).withMetadata();
  let finalImage;
  if (
    contentType.includes('jpeg') ||
    contentType.includes('jpg') ||
    contentType.includes('gif')
  ) {
    finalImage = originalImage.jpeg({ quality: resolution * 10 });
  } else if (contentType.includes('png')) {
    finalImage = originalImage.png({ compressionLevel: resolution });
  } else if (contentType.includes('webp')) {
    finalImage = originalImage.webp({ quality: resolution * 10 });
  } else {
    return null; // shouldn't reach here, but if we do just return
  }

  const b = await finalImage.toBuffer({ resolveWithObject: true });
  // if file size larger than 500 kb, make another compression pass with worse resolution
  if (b.info.size > 500 * 1000 && resolution !== 1) {
    return compressImage(b.data, contentType, resolution - 1);
  }

  return b.data;
}

async function main() {
  const chains = await models.Chain.findAll({
    where: { icon_url: { [Op.ne]: null } },
  });
  const transaction = await sequelize.transaction();

  try {
    for (const chain of chains) {
      const resp = await fetch(chain.icon_url);
      let contentType = resp.headers.get('content-type');
      const buffer = await resp.buffer();

      const compressedImage = await compressImage(buffer, contentType, 9);
      if (!compressedImage) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 0.1);

      // we convert gif to jpeg
      if (contentType.includes('gif')) {
        contentType = 'image/jpeg';
      }

      const params: S3.Types.PutObjectRequest = {
        Bucket: 'assets.commonwealth.im',
        Key: `${chain.id}_200x200.${contentType.split('/')[1]}`,
        Body: compressedImage,
        ContentType: contentType,
      };

      const data = await s3.upload(params).promise();

      console.log(
        `Success for community ${chain.id} with new url ${data.Location}`
      );
      await models.Chain.update(
        { icon_url: data.Location },
        { where: { id: chain.id }, transaction }
      );
    }

    // commit changes to db if all passes
    await transaction.commit();
  } catch (e) {
    console.log('Failed to compressImages, rolling back db changes');
    await transaction.rollback();
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
