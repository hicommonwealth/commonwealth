export const healthHandler = async (req, res) => {
  return res.status(200).json({ status: 'ok' });
};
