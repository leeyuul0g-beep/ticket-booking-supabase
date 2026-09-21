import { Router } from 'express';
import {
  cancelReservation,
  createReservation,
} from '../controllers/reservationController';
import { getReservationsByEmail } from '../controllers/userController';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

// [과제 5] GET /reservations?email=...
router.get(
  '/reservations',
  asyncHandler(async (req, res) => {
    const email = String(req.query.email ?? '');
    const result = await getReservationsByEmail(email);
    res.json(result);
  }),
);

// [과제 3] POST /reservations
router.post(
  '/reservations',
  asyncHandler(async (req, res) => {
    const { seatId, customerName, customerEmail } = req.body ?? {};
    const result = await createReservation({
      seatId: Number(seatId),
      customerName,
      customerEmail,
    });
    res.status(201).json(result);
  }),
);

// [과제 4] PATCH /reservations/:id/cancel
router.patch(
  '/reservations/:id/cancel',
  asyncHandler(async (req, res) => {
    const { customerEmail } = req.body ?? {};
    const result = await cancelReservation(
      Number(req.params.id),
      customerEmail,
    );
    res.json(result);
  }),
);

export default router;
