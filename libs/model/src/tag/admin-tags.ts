/*

 
const router = Router();

// Tag management routes
router.get(
  '/tags',
  Permissions.isSiteAdmin,
  async (req: AppRequest, res: AppResponse<AdminTagResponse[]>) => {
    try {
      const tags = await req.app.controllers.tags.getAdminTags();
      return res.json(tags);
    } catch (error) {
      console.error('Error fetching admin tags:', error);
      return res.status(500).json({ error: 'Failed to fetch tags' });
    }
  },
);

router.post(
  '/tags',
  Permissions.isSiteAdmin,
  async (req: AppRequest, res: AppResponse<AdminTagResponse>) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const tag = await req.app.controllers.tags.createAdminTag(name.trim());
      return res.status(201).json(tag);
    } catch (error) {
      console.error('Error creating tag:', error);
      return res
        .status(500)
        .json({ error: (error as Error).message || 'Failed to create tag' });
    }
  },
);

router.put(
  '/tags/:id',
  Permissions.isSiteAdmin,
  async (req: AppRequest, res: AppResponse<AdminTagResponse>) => {
    try {
      const id = Number(req.params.id);
      const { name } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid tag ID' });
      }

      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
      }

      const tag = await req.app.controllers.tags.updateAdminTag(
        id,
        name.trim(),
      );
      return res.json(tag);
    } catch (error) {
      console.error('Error updating tag:', error);
      return res
        .status(500)
        .json({ error: (error as Error).message || 'Failed to update tag' });
    }
  },
);

router.delete(
  '/tags/:id',
  Permissions.isSiteAdmin,
  async (req: AppRequest, res: AppResponse<void>) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid tag ID' });
      }

      await req.app.controllers.tags.deleteAdminTag(id);
      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting tag:', error);
      return res
        .status(500)
        .json({ error: (error as Error).message || 'Failed to delete tag' });
    }
  },
);

router.get(
  '/tags/:id/usage',
  Permissions.isSiteAdmin,
  async (req: AppRequest, res: AppResponse<TagUsageResponse>) => {
    try {
      const id = Number(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid tag ID' });
      }

      const usage = await req.app.controllers.tags.getTagUsage(id);
      return res.json(usage);
    } catch (error) {
      console.error('Error fetching tag usage:', error);
      return res
        .status(500)
        .json({
          error: (error as Error).message || 'Failed to fetch tag usage',
        });
    }
  },
);

export default router;
*/
