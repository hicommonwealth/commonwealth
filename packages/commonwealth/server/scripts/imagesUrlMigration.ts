import { models } from '@hicommonwealth/model';
import AWS from 'aws-sdk';
import fs from 'fs';
import path, { dirname } from 'path';
import { Op } from 'sequelize';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const __dirname = dirname(fileURLToPath(import.meta.url));

AWS.config.update({
  signatureVersion: 'v4',
});

// This should only be run once. Delete it as soon as you run it on prod.
const staticFileToBucketMigrator = async () => {
  const communitiesWithStaticImages = await models.Community.findAll({
    where: {
      icon_url: {
        [Op.like]: '/static/img%',
      },
    },
  });

  for (const community of communitiesWithStaticImages) {
    console.log('updating community: ', community.id);

    const iconPath = community.icon_url;
    const fileName = iconPath.split('/').pop();

    let fileBlob;
    try {
      fileBlob = await fs.promises.readFile(
        path.join(__dirname, '../..' + iconPath),
      );
    } catch (e) {
      console.log('error uploading', e);
      continue;
    }

    const s3 = new AWS.S3();
    const params = {
      Bucket: 'assets.commonwealth.im',
      Key: `${fileName}`,
      Expires: 3600,
      ContentType: 'image/png',
    };

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    const url = uploadUrl.replace(/\?.*/, '').trim();

    try {
      await fetch(uploadUrl, {
        method: 'put',
        body: fileBlob,
      });
    } catch (e) {
      console.log('error uploading', e);
    }

    console.log('updated url', url);

    community.icon_url = url;
    await community.save();
  }

  return;
};

async function main() {
  await staticFileToBucketMigrator();
}

main()
  .then(() => {
    console.log('Migration successful');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
  });
