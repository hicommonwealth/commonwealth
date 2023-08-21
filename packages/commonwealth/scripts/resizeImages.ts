#!/usr/bin/env node

// this script will resize the images in the Chains.icon_url that are larger than 1000x1000.
// It will then re-upload these compressed images to s3.
// Lastly it will update the icon_url with the new compressed image link

import type { S3 } from 'aws-sdk';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import { Op } from 'sequelize';
import sharp from 'sharp';
import models, { sequelize } from '../server/database';

const s3 = new AWS.S3();

async function resizeImage(data: Buffer, contentType: string) {
  if (
    !contentType.includes('jpeg') &&
    !contentType.includes('jpg') &&
    !contentType.includes('png') &&
    !contentType.includes('webp') &&
    !contentType.includes('gif')
  ) {
    return null; // we don't support so just early exit
  }
  const metadata = await sharp(data).metadata();
  if (metadata.width < 1000 && metadata.height < 1000) {
    return; // auto compression/scaling can be performed by cloudflare polish, so do nothing
  }

  let resizeOptions;
  if (metadata.width > metadata.height) {
    resizeOptions = { width: 999 }; // height is autoscaled
  } else {
    resizeOptions = { height: 999 };
  }

  const originalImage = sharp(data).resize(resizeOptions).withMetadata();
  let finalImage;
  if (
    contentType.includes('jpeg') ||
    contentType.includes('jpg') ||
    contentType.includes('gif')
  ) {
    finalImage = originalImage.jpeg();
  } else if (contentType.includes('png')) {
    finalImage = originalImage.png();
  } else if (contentType.includes('webp')) {
    finalImage = originalImage.webp();
  } else {
    return null; // shouldn't reach here, but if we do just return
  }

  const b = await finalImage.toBuffer({ resolveWithObject: true });

  return b.data;
}

async function main() {
  const chains = await models.Chain.findAll({
    where: {
      icon_url: {
        [Op.ne]: null,
        [Op.ne]: '',
      },
    },
  });
  const transaction = await sequelize.transaction();

  try {
    for (const chain of chains) {
      let resp;

      try {
        resp = await fetch(chain.icon_url);
      } catch (e) {
        console.log(`Failed to get image for ${chain.icon_url}`);
        continue;
      }

      let contentType = resp.headers.get('content-type');
      const buffer = await resp.buffer();

      const resizedImage = await resizeImage(buffer, contentType);
      if (!resizedImage) {
        // eslint-disable-next-line no-continue
        continue;
      }

      // we convert gif to jpeg
      if (contentType.includes('gif')) {
        contentType = 'image/jpeg';
      }

      const params: S3.Types.PutObjectRequest = {
        Bucket: 'assets.commonwealth.im',
        Key: `${chain.id}_resized.${contentType.split('/')[1]}`,
        Body: resizedImage,
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
    console.log(e);
    console.log('Failed to compressImages, rolling back db changes');
    await transaction.rollback();
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
