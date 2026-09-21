import { Router } from 'express';
import performanceRoutes from './performanceRoutes';
import reservationRoutes from './reservationRoutes';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    service: 'TICKETFLOW - Supabase 연동 공연 예매 API',
    endpoints: [
      'GET    /performances',
      'GET    /performances/:id',
      'POST   /reservations',
      'PATCH  /reservations/:id/cancel',
      'GET    /reservations?email=...',
    ],
  });
});

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

router.use(performanceRoutes);
router.use(reservationRoutes);

export default router;
