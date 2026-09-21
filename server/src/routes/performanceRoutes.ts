import { Router } from 'express';
import {
  getPerformance,
  listPerformances,
} from '../controllers/performanceController';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// [과제 1] GET /performances
router.get(
  '/performances',
  asyncHandler(async (_req, res) => {
    const result = await listPerformances();
    res.json(result);
  }),
);

// [과제 2] GET /performances/:id
router.get(
  '/performances/:id',
  asyncHandler(async (req, res) => {
    const result = await getPerformance(Number(req.params.id));
    res.json(result);
  }),
);

export default router;
