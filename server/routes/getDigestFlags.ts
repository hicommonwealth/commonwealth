const getDigestFlags = async (models, req, res, next) => {
  const digestFlags = await models.DigestFlag.findAll({
    where: {
      active: true,
    }
  });

  return res.json({ status: 'Success', result: digestFlags.map((d) => d.toJSON()) });
};

export default getDigestFlags;
