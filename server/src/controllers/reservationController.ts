import { supabase } from '../lib/supabase';
import { badRequest, notFound } from '../middlewares/errors';
import type { CreateReservationInput } from '../types';

/**
 * [과제 3] 좌석 예매  POST /reservations
 * reservations 행 생성 + seats.is_available = false 를 한 번에 처리해야 하므로
 * Supabase PostgreSQL 함수(reserve_seat)를 RPC로 호출합니다.
 */
export async function createReservation({
  seatId,
  customerName,
  customerEmail,
}: CreateReservationInput) {
  if (!seatId || !customerName || !customerEmail) {
    throw badRequest('seatId, customerName, customerEmail이 필요합니다.');
  }

  // [과제 3-1] reserve_seat RPC 함수를 호출하세요.
  const { data, error } = await supabase.rpc('reserve_seat', {
    p_seat_id: seatId,
    p_customer_name: customerName,
    p_customer_email: customerEmail,
  });

  if (error) throw badRequest(error.message);

  return {
    success: true,
    reservation_id: data?.[0]?.reservation_id,
    message: '예매 완료',
  };
}

/**
 * [과제 4] 예매 취소  PATCH /reservations/:id/cancel
 * 예매 삭제 + 연결된 seats.is_available = true 복구를 cancel_reservation RPC로 처리합니다.
 */
export async function cancelReservation(
  reservationId: number,
  customerEmail: string,
) {
  if (!reservationId || !customerEmail) {
    throw badRequest('reservationId와 customerEmail이 필요합니다.');
  }

  // [과제 4-1] cancel_reservation RPC 함수를 호출하세요.
  const { data, error } = await supabase.rpc('cancel_reservation', {
    p_reservation_id: reservationId,
    p_customer_email: customerEmail,
  });

  if (error) throw notFound(error.message);

  return {
    success: true,
    reservation_id: data?.[0]?.reservation_id,
    seat_id: data?.[0]?.seat_id,
    message: '예매가 취소되었습니다.',
  };
}
