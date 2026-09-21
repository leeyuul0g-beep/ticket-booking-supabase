import { supabase } from '../lib/supabase';
import { badRequest } from '../middlewares/errors';
import type { ReservationRow } from '../types';

/**
 * [과제 5] 이메일 기준 예매 내역 조회  GET /reservations?email=...
 * 예매 + 좌석 + 공연 정보를 함께 반환하고 최신 예매가 먼저 오도록 정렬합니다.
 */
export async function getReservationsByEmail(email: string) {
  if (!email) throw badRequest('email 쿼리가 필요합니다.');

  const { data, error } = await supabase
    .from('reservations')
    .select(`
      id,
      customer_name,
      customer_email,
      reserved_at,
      seats(
        id,
        row_label,
        seat_number,
        performances(id, title, venue, starts_at, price)
      )
    `)

    // [과제 5-1] customer_email이 email과 같은 데이터만 조회하세요.
    .eq('customer_email', email)

    // [과제 5-2] reserved_at 기준 최신순으로 정렬하세요.
    .order('reserved_at', { ascending: false });

  if (error) throw error;

  const reservations = (data ?? []) as unknown as ReservationRow[];

  return reservations.map((r) => ({
    reservation_id: r.id,
    customer_name: r.customer_name,
    customer_email: r.customer_email,
    reserved_at: r.reserved_at,
    seat: r.seats
      ? {
          seat_id: r.seats.id,
          row_label: r.seats.row_label,
          seat_number: r.seats.seat_number,
        }
      : null,
    performance: r.seats?.performances ?? null,
  }));
}
