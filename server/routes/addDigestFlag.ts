// TODO: reference the function in the file, throwing weird mithril error to server when I do now.
function slugify(str : string) {
  // remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes
  return str.toLowerCase().trim().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
}

const addDigestFlag = async (models, req, res, next) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }

  console.dir(req.body.id);
  const proposal = await models.OffchainThread.findOne({
    where: {
      id: req.body.id,
    }
  });

  const { author_id, title, id } = proposal;

  console.dir('getting prevDigestFlag');
  const prevDigestFlag = await models.DigestFlag.findOne({
    where: {
      offchain_thread_id: id,
      offchain_thread_title: title,
      author_id,
    }
  });
  if (prevDigestFlag) {
    console.dir('found previous flag');
    if (req.body.selected === 'true') {
      await prevDigestFlag.update({ selected: true, });
      return res.json({ status: 'Success', result: prevDigestFlag.toJSON() });
    }
    if (req.body.selected === 'false') {
      await prevDigestFlag.update({ selected: false, });
      return res.json({ status: 'Success', result: prevDigestFlag.toJSON() });
    }

    if (prevDigestFlag.active !== true) {
      await prevDigestFlag.update({ active: true, votes: 1, });
    } else {
      const newVotes = prevDigestFlag.votes + 1;
      await prevDigestFlag.update({ votes: newVotes, });
    }
    return res.json({ status: 'Success', result: prevDigestFlag.toJSON() });
  }

  // TODO: chain xor community
  console.dir('creating new flag');
  const digestFlag = await models.DigestFlag.create({
    offchain_thread_id: id,
    offchain_thread_title: title,
    url: `/${proposal.community}/proposal/discussions/${proposal.id}-${slugify(decodeURIComponent(proposal.title))}`,
    author_id,
    admin_id: req.user.id, // TODO: Check against returned req.user object
    community_id: '',
    default_chain: '',
    votes: 1,
    active: true,
    selected: false,
  });
  if (!digestFlag) { return res.json({ status: 'Failure' }); }

  return res.json({ status: 'Success', result: digestFlag.toJSON() });
};

export default addDigestFlag;
