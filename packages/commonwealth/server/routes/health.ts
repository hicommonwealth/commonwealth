export const healthHandler = (req, res) => {
  return res.status(200).json({ status: 'ok' });
};
