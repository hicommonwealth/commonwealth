import { AppError } from 'common-common/src/errors';
import type { DB } from '../../models';
import type { TypedRequestBody, TypedResponse } from '../../types';
import { success } from '../../types';

// Error messages
export const Errors = {
  PersonaNotFound: 'Persona not found',
  NotLoggedIn: 'Not logged in',
  InvalidAddress: 'Invalid address',
};

// Get persona
export const getPersona = async (
  models: DB,
  req: TypedRequestBody<any>,
  res: TypedResponse<any>
) => {
  const { name } = req.body;

  if (!name) {
    throw new AppError(Errors.PersonaNotFound);
  }

  const personas = await models.Persona.findAll({
    where: { name: name },
  });

  // Map over the personas array and extract the required properties
  const filteredPersonas = personas.map((persona) => ({
    id: persona.dataValues.id,
    name: persona.dataValues.name,
    personality: persona.dataValues.personality,
  }));

  if (!personas) {
    throw new AppError(Errors.PersonaNotFound);
  }

  return success(res, { persona: filteredPersonas });
};

// Create persona
export const createPersona = async (
  models: DB,
  req: TypedRequestBody<any>,
  res: TypedResponse<any>
) => {
  const { name, personality } = req.body;

  if (!req.user) {
    throw new AppError(Errors.NotLoggedIn);
  }

  const persona = await models.Persona.create({
    name,
    personality,
  });

  // Extract the required properties from the updated persona instance
  const filteredPersona = {
    id: persona.dataValues.id,
    name: persona.dataValues.name,
    personality: persona.dataValues.personality,
  };

  return success(res, { persona: filteredPersona });
};

// Update persona
export const updatePersona = async (
  models: DB,
  req: TypedRequestBody<any>,
  res: TypedResponse<any>
) => {
  const { id, name, personality } = req.body;

  if (!req.user) {
    throw new AppError(Errors.NotLoggedIn);
  }

  const persona = await models.Persona.findOne({ where: { id: id } });

  if (!persona) {
    throw new AppError(Errors.PersonaNotFound);
  }

  await persona.update({ name, personality });

  // Extract the required properties from the updated persona instance
  const filteredPersona = {
    id: persona.dataValues.id,
    name: persona.dataValues.name,
    personality: persona.dataValues.personality,
  };

  return success(res, { persona: filteredPersona });
};

// Delete persona
export const deletePersona = async (
  models: DB,
  req: TypedRequestBody<any>,
  res: TypedResponse<any>
) => {
  const { id } = req.body;

  // To update for thread
  if (!req.user) {
    throw new AppError(Errors.NotLoggedIn);
  }

  const persona = await models.Persona.findOne({ where: { id: id } });

  if (!persona) {
    throw new AppError(Errors.PersonaNotFound);
  }

  await persona.destroy();

  return success(res, {
    id: persona.dataValues.id,
    message: 'Persona deleted successfully',
  });
};
