#!/usr/bin/env node

// this script will resize the images in the Chains.icon_url that are larger than 1000x1000.
// It will then re-upload these compressed images to s3.
// Lastly it will update the icon_url with the new compressed image link
import { S3BlobStorage } from '@hicommonwealth/adapters';
import { blobStorage } from '@hicommonwealth/core';
import { models, sequelize } from '@hicommonwealth/model';
import * as https from 'https';
import fetch from 'node-fetch';
import { Op } from 'sequelize';
import sharp from 'sharp';

const startChainsFrom = process.argv[2];
const startProfilesFrom = process.argv[3];

const _blobStorage = blobStorage({
  adapter: S3BlobStorage(),
});

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

async function resizeChains() {
  const updateChain = async (id, location, transaction) => {
    await models.Community.update(
      { icon_url: location },
      { where: { id: id }, transaction },
    );
  };

  const getNthChain = async (n) =>
    await models.Community.findAll({
      where: {
        icon_url: {
          [Op.or]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
        },
      },
      offset: n,
      limit: 1,
      order: [['id', 'DESC']],
    });

  await uploadToS3AndReplace(
    getNthChain,
    'icon_url',
    updateChain,
    'Chain',
    startChainsFrom ? parseInt(startChainsFrom) : 0,
  );
}

async function resizeProfiles() {
  const updateProfile = async (id, location, transaction) => {
    const user = await models.User.findOne({ where: id });
    if (user) {
      user.profile.avatar_url = location;
      user.changed('profile', true);
      await user.save({ transaction });
    }
  };

  const getNthUser = async (n) =>
    await models.User.findAll({
      where: {
        profile: {
          avatar_url: {
            [Op.or]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
          },
        },
      },
      offset: n,
      limit: 1,
      order: [['id', 'DESC']],
    });

  await uploadToS3AndReplace(
    getNthUser,
    'avatar_url',
    updateProfile,
    'Profile',
    startProfilesFrom ? parseInt(startProfilesFrom) : 0,
  );
}

// This function is not turned into a Promise.all because if every call was executed async, it will flood cloudflare
// and cause this to be flagged it as a bot. It will then need to solve a captcha in order to retrieve the image.
async function uploadToS3AndReplace(
  dataSupplier,
  field,
  updateFunction,
  name,
  startFrom,
) {
  let i = startFrom;
  // loop through the dataSupplier, until we hit the end.
  for (let datum = await dataSupplier(i); ; datum = await dataSupplier(i++)) {
    if (datum.length === 0) {
      return;
    }
    datum = datum[0];
    console.log(
      `Processing ${datum[field]}. This is the ${i} in the ${name}s table`,
    );
    const transaction = await sequelize.transaction();
    let resp;

    try {
      resp = await fetch(
        // Replace the cloudflare url with the AWS url. This is so we can bypass cloudlfare in order not to run into
        // captchas.
        datum[field].replace(
          'assets.commonwealth.im',
          'assets.commonwealth.im.s3.amazonaws.com',
        ),
        {
          agent: httpsAgent,
        },
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

    const { url } = await _blobStorage.upload({
      key: `${datum.id}_resized.${contentType.split('/')[1]}`,
      bucket: 'assets',
      content: resizedImage,
      contentType,
    });
    console.log(`Successfully resized ${name} ${datum.id} with new url ${url}`);
    await updateFunction(datum.id, url, transaction);

    await transaction.commit();
  }
}

async function main() {
  try {
    if (startChainsFrom !== '-1') {
      await resizeChains();
    }

    if (startProfilesFrom !== '-1') {
      await resizeProfiles();
    }
  } catch (e) {
    console.log(e);
    console.log('Failed to resize all images. Exiting script');
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
