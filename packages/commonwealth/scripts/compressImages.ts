#!/usr/bin/env node

// this script will compress the images in the Chains.icon_url, and re-upload these compressed images to s3.
// Then it will update the icon_url with the new compressed image link

import { Op } from "sequelize";
import fetch from 'node-fetch';
import sharp from 'sharp';
import AWS, { S3 } from "aws-sdk";

import models, { sequelize } from '../server/database';

const s3 = new AWS.S3();

// TODO setting proper header for s3

async function compressImage(url: string) {
  const metaData = url.substr(url.length - 4);

  if (!metaData.includes('jpeg') && !metaData.includes('jpg') &&
    !metaData.includes('png') &&
    !!metaData.includes('webp')
  ) {
    return; // we dont support so just early exit
  }
  const resp = await fetch(url);
  const data = await resp.arrayBuffer();
  const originalImage = sharp(Buffer.of(data)).resize(200, 200);
  let finalImage;

  if (metaData.includes('jpeg') || metaData.includes('jpg')) {
    finalImage = originalImage.jpeg({ quality: 50 });
  } else if (metaData.includes('png')) {
    finalImage = originalImage.png({ compressionLevel: 5 });
  } else if (metaData.includes('png')) {
    finalImage = originalImage.webp({ quality: 50 });
  } else {
    return; // shouldn't reach here, but if we do just return
  }

  return [resp.headers.get('content-type'), finalImage];
}

async function main() {
  const chains = await models.Chain.findAll({ where: { icon_url: { [Op.ne]: null } } });
  const transaction = await sequelize.transaction();

  try {
    for (const chain of chains) {
      const [contentType, compressedImage] = await compressImage(chain.icon_url);

      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 0.1)

      const params: S3.Types.PutObjectRequest = {
        Bucket: 'commonwealth-uploads',
        Key: `${chain.id}_200x200`,
        Body: compressedImage,
        Expires: expiryDate,
        ContentType: contentType,
      };

      s3.upload(params, (err, data) => {
        if (err) {
          console.log(err)
        } else {
          console.log(`Success for community ${chain.id} with new url ${data.Location}`);
          models.Chain.update(
            { icon_url: data.Location },
            { where: { id: chain.id }, transaction }
          );
        }
      });
    }
  } catch (e) {
    await transaction.rollback();
    return;
  }

  await transaction.commit();
}

main().then(() => console.log('done')).catch(e => console.error(e));

