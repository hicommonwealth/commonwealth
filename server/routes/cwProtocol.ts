import { Response, NextFunction } from 'express';

export const Errors = {
  NoCurator: 'Curator can only call this method',
  NoBacker: 'Backer can only call this method',
  NotLoggedIn: 'Not login',
  DeadlinPassed: 'Deadlin is already passed',
  Locked: 'Project is locked in now, retry after deadline',
  NotWithdrawWhenFailed: 'Not withdrawable since project funding is failed',
};

const protocolFee = 5;

// this will be replaced with real chain data later
const getBackersOrCurators = async (models, isbacker: boolean, projectHash: string, acceptedToken: string ) => {
  return models.CWUser.findAll({
    where: {
      role: isbacker ? 'backer' : 'curator',
      token: acceptedToken,
      projectHash: projectHash
    }
  });
}
const checkStatus = async(models, project) => {
  const timeDiff = (project.endTime.getTime() - (new Date()).getTime());
  let newStatus = 'In Progress';
  if (timeDiff < 0) {
    const { threshold } = project;
    if (threshold - project.totalFunding > 0) {
      newStatus = 'Successed';
    } else {
      newStatus = 'Failed';
    }
  }
  if (project.status !== newStatus) {
    // update project status
    const cwProjectInstance = await models.CWProject.findOne({
      where: { projectHash: project.projectHash }
    });
    await cwProjectInstance.update({ status: newStatus })
  }
  return newStatus;
}
const builkProjects = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const projects = await models.CWProject.findAll({
    order: [['created_at', 'DESC']]
  }).map(async(c, idx) => {
    const row = c.toJSON();
    row['backers'] = await getBackersOrCurators(models, true, row.projectHash, row.acceptedToken);
    row['curators'] = await getBackersOrCurators(models, false, row.projectHash, row.acceptedToken);
    row['status'] = await checkStatus(models, row);
    return row;
  });
  return res.json ({
    status: 'Success',
    result: {
      projects: projects
    }
  })
}
const createProject = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const options = {
    name: req.body.name,
    description: req.body.name,
    ipfsHash: req.body.name,
    cwUrl: req.body.name,
    beneficiary: req.body.name,
    acceptedToken: req.body.name,
    nominations: req.body.name,
    threshold: req.body.name,
    endtime:  req.body.name,
    curatorFee: req.body.name,
    projectHash:  req.body.name,
    totalFunding: 0,
    createdAt: Date.now(),
    status: 'In Progress'
  };
  const newCWProject = await models.CWProject.findOrCreate({
    where: options,
    default: options,
  })
  return res.json({ status: 'Success', result: newCWProject[0].toJSON() })
}
const backProject = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const project = await models.CWProject.findOne({
    where: { projectHash: req.body.projectHash } 
  });
  const projectStatus = await checkStatus(models, project);
  if (projectStatus !== 'In Progress') {
    return next(new Error(Errors.DeadlinPassed));
  }

  // totalFunding increase
  const newTotalFunding = {
    ...project,
    totalFunding: project.totalFunding + req.body.amount
  };
  await project.update(newTotalFunding);

  // add backer
  await models.CWUser.findOne({ where: {
    role: 'backer',
    projectHash: project.projectHash
  } })
  .then(function(obj) {
    // update
    if(obj) {
      return obj.update({ amount: obj.amount + req.body.amount });
    } else {
    // insert
      return models.CWUser.create({
        role: 'backer',
        projectHash: project.projectHash,
        amount: req.body.amount,
        address: req.body.backer,
        token: '0x01',
      })
    }
  })
  return res.json({ status: 'Success' });
}
const curateProject = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const project = await models.CWProject.findOne({
    where: { projectHash: req.body.projectHash } 
  });
  const projectStatus = await checkStatus(models, project);
  if (projectStatus !== 'In Progress') {
    return next(new Error(Errors.DeadlinPassed));
  }

  // add backer
  await models.CWUser.findOne({ where: {
    role: 'curator',
    projectHash: project.projectHash
  } })
  .then(function(obj) {
    // update
    if(obj) {
      return obj.update({ amount: obj.amount + req.body.amount });
    } else {
    // insert
      return models.CWUser.create({
        role: 'curator',
        projectHash: project.projectHash,
        amount: req.body.amount,
        address: req.body.backer,
        token: '0x01',
      })
    }
  })
  return res.json({ status: 'Success' });
}
const redeemBToken = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const project = await models.CWProject.findOne({
    where: { projectHash: req.body.projectHash } 
  });
  const projectStatus = await checkStatus(models, project);
  if (projectStatus === 'In Progress') {
    return next(new Error(Errors.Locked));
  } else if (projectStatus === 'Failed') {
    return next(new Error('Can not call when project funding is successed'));
  }
}
const redeemCToken = async (models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const project = await models.CWProject.findOne({
    where: { projectHash: req.body.projectHash } 
  });
  const projectStatus = await checkStatus(models, project);
  if (projectStatus === 'In Progress') {
    return next(new Error(Errors.Locked));
  } else if (projectStatus === 'Success') {
    return next(new Error('Can not call when project funding is failed'));
  }
}
const withdraw = async(models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const project = await models.CWProject.findOne({
    where: { projectHash: req.body.projectHash } 
  });
  const projectStatus = await checkStatus(models, project);
  if (projectStatus === 'In Progress') {
    return next(new Error(Errors.Locked));
  } else if (projectStatus === 'Failed') {
    return next(new Error(Errors.NotWithdrawWhenFailed));
  }
  // do some logic
  // // withdraw only available amount
  // uint256 withdrawAmount = totalFunding.mul(withdrawablePercent).div(100);
  // IERC20(token).transferFrom(backingDepositTo, beneficiary, withdrawAmount);

  // // send fundingSuccessFee(protocolFee) to protocol
  // uint256 fundingSuccessFee = totalFunding.mul(ICWProtocol(factory).protocolFee()).div(100);    // totalFunding * ICWProtocol(factory).protocolFee() / 100;
  // IERC20(token).transferFrom(backingDepositTo, ICWProtocol(factory).feeTo(), fundingSuccessFee);
}
const getCollatoralAmount = async(models, req, res: Response, next: NextFunction) => {
  if (!req.user) return next(new Error(Errors.NotLoggedIn));
  const { projectHash, isBToken, address, acceptedToken } = req.body;
  const backerAccounts = models.CWUser.findAll({
    where: {
      role: isBToken ? 'backer' : 'curator',
      token: acceptedToken,
      projectHash: projectHash,
      address,
    }
  });
  let total = 0;
  for (let i=0;i<backerAccounts.length;i++) {
    total += backerAccounts[i].amount;
  }
  return res.json({ status: 'Success', result: total });
}
export {
  builkProjects,
  createProject,
  backProject,
  curateProject,
  redeemBToken,
  redeemCToken,
  withdraw,
  getCollatoralAmount,
}