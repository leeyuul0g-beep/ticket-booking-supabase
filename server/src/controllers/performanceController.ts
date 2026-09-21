import { supabase } from '../lib/supabase';
import { badRequest, notFound } from '../middlewares/errors';
import type { PerformanceWithSeats } from '../types';

const PERFORMANCE_SELECT =
  'id, title, venue, starts_at, price, seats(id, row_label, seat_number, is_available)';

/**
 * [과제 1] 공연 목록 조회  GET /performances
 * 모든 공연 + 각 공연의 좌석 목록을 함께 반환하고 잔여/전체 좌석 수를 계산합니다.
 */
export async function listPerformances() {
  const { data, error } = await supabase
    .from('performances')
    .select(PERFORMANCE_SELECT)

    // [과제 1-1] id 기준 오름차순으로 정렬하세요.
    .order('id', { ascending: true });

  if (error) throw error;

  const performances = (data ?? []) as unknown as PerformanceWithSeats[];

  return performances.map((p) => {
    const seats = p.seats ?? [];
    return {
      id: p.id,
      title: p.title,
      venue: p.venue,
      starts_at: p.starts_at,
      price: p.price,
      seats,

      // [과제 1-2] 예약 가능한 좌석 수
      available_count: seats.filter((s) => s.is_available).length,

      // [과제 1-3] 전체 좌석 수
      total_count: seats.length,
    };
  });
}

/**
 * [과제 2] 공연 상세 조회  GET /performances/:id
 * 없는 공연 ID 요청 시 404를 반환합니다.
 */
export async function getPerformance(id: number) {
  if (!Number.isInteger(id)) throw badRequest('공연 id는 숫자여야 합니다.');

  const { data, error } = await supabase
    .from('performances')
    .select(PERFORMANCE_SELECT)

    // [과제 2-1] id가 요청받은 id와 같은 공연을 찾으세요.
    .eq('id', id)
    .single();

  // [과제 2-2] 공연이 없을 때 404 에러를 던지세요.
  //  .single()은 결과가 0건이면 PGRST116 에러를 돌려줍니다.
  if (error?.code === 'PGRST116' || !data) {
    throw notFound('공연을 찾을 수 없습니다.');
  }
  if (error) throw error;

  const performance = data as unknown as PerformanceWithSeats;
  const seats = performance.seats ?? [];

  return {
    id: performance.id,
    title: performance.title,
    venue: performance.venue,
    starts_at: performance.starts_at,
    price: performance.price,
    seats,
    available_count: seats.filter((s) => s.is_available).length,
    total_count: seats.length,
  };
}
