#!/usr/bin/env node

// this script will resize the images in the Chains.icon_url that are larger than 1000x1000.
// It will then re-upload these compressed images to s3.
// Lastly it will update the icon_url with the new compressed image link

import type { S3 } from 'aws-sdk';
import AWS from 'aws-sdk';
import * as https from 'https';
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

  let metadata;
  try {
    metadata = await sharp(data).metadata();
  } catch (e) {
    console.log(`input buffer empty, skipping image`);
    return;
  }
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

// required in order to disable SSL verification
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// This function is not turned into a Promise.all because if every call was executed async, it will flood cloudflare
// and cause this to be flagged it as a bot. It will then need to solve a captcha in order to retrieve the image.
async function uploadToS3AndReplace(
  data,
  field,
  updateFunction,
  transaction,
  name
) {
  for (const datum of data) {
    let resp;

    try {
      resp = await fetch(
        datum[field].replace(
          'assets.commonwealth.im',
          'assets.commonwealth.im.s3.amazonaws.com'
        ),
        {
          agent: httpsAgent,
        }
      );
    } catch (e) {
      console.log(e);
      console.log(`Failed to get image for ${datum[field]}`);
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
      Key: `${datum.id}_resized.${contentType.split('/')[1]}`,
      Body: resizedImage,
      ContentType: contentType,
    };

    const newImage = await s3.upload(params).promise();

    const newLocation = newImage.Location.replace(
      's3.amazonaws.com/assets.commonwealth.im',
      'assets.commonwealth.im'
    );

    console.log(`Success for ${name} ${datum.id} with new url ${newLocation}`);
    await updateFunction(datum.id, newLocation);
    await models.Chain.update(
      { icon_url: newLocation },
      { where: { id: datum.id }, transaction }
    );
  }
}

async function main() {
  const updateChain = async (id, location) => {
    await models.Chain.update(
      { icon_url: location },
      { where: { id: id }, transaction }
    );
  };
  const updateProfile = async (id, location) => {
    await models.Profile.update(
      { avatar_url: location },
      { where: { id: id }, transaction }
    );
  };
  const chains = await models.Chain.findAll({
    where: {
      icon_url: {
        [Op.ne]: null,
        [Op.ne]: '',
      },
    },
  });
  const profiles = await models.Profile.findAll({
    where: {
      avatar_url: {
        [Op.ne]: null,
        [Op.ne]: '',
      },
    },
  });
  const transaction = await sequelize.transaction();

  try {
    await Promise.all([
      uploadToS3AndReplace(
        chains,
        'icon_url',
        updateChain,
        transaction,
        'community'
      ),
      uploadToS3AndReplace(
        profiles,
        'avatar_url',
        updateProfile,
        transaction,
        'profile'
      ),
    ]);
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
