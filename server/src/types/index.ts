export interface Seat {
  id: number;
  row_label: string;
  seat_number: number;
  is_available: boolean;
}

export interface Performance {
  id: number;
  title: string;
  venue: string | null;
  starts_at: string | null;
  price: number | null;
}

export interface PerformanceWithSeats extends Performance {
  seats: Seat[] | null;
}

/** reservations -> seats 는 다대일이라 객체 1개로 내려옵니다. */
export interface ReservationRow {
  id: number;
  customer_name: string;
  customer_email: string;
  reserved_at: string;
  seats: {
    id: number;
    row_label: string;
    seat_number: number;
    performances: Performance | null;
  } | null;
}

export interface CreateReservationInput {
  seatId: number;
  customerName: string;
  customerEmail: string;
}
