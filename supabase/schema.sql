-- =====================================================================
-- TICKETFLOW - Supabase 초기 세팅 SQL
-- 새 Supabase 프로젝트 > SQL Editor 에 통째로 붙여넣고 [Run] 하세요.
-- 여러 번 실행해도 안전합니다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. 테이블 (performances -> seats -> reservations)
-- ---------------------------------------------------------------------
create table if not exists public.performances (
    id          bigint generated always as identity primary key,
    title       text        not null,
    venue       text        not null,
    starts_at   timestamptz not null,
    price       integer     not null default 0,
    created_at  timestamptz not null default now()
);

create table if not exists public.seats (
    id              bigint generated always as identity primary key,
    performance_id  bigint  not null references public.performances(id) on delete cascade,
    row_label       text    not null,
    seat_number     integer not null,
    is_available    boolean not null default true,
    created_at      timestamptz not null default now(),
    constraint seats_unique_position unique (performance_id, row_label, seat_number)
);

create table if not exists public.reservations (
    id              bigint generated always as identity primary key,
    seat_id         bigint not null references public.seats(id) on delete cascade,
    customer_name   text   not null,
    customer_email  text   not null,
    reserved_at     timestamptz not null default now()
);

create index if not exists idx_seats_performance_id      on public.seats(performance_id);
create index if not exists idx_reservations_seat_id      on public.reservations(seat_id);
create index if not exists idx_reservations_email        on public.reservations(customer_email);

-- ---------------------------------------------------------------------
-- 2. RLS
--    서버는 service_role 키를 쓰므로 RLS를 우회합니다.
--    (RLS를 켜두면 anon 키로는 데이터가 보이지 않아 더 안전합니다.)
-- ---------------------------------------------------------------------
alter table public.performances  enable row level security;
alter table public.seats         enable row level security;
alter table public.reservations  enable row level security;

-- ---------------------------------------------------------------------
-- 3. 시드 데이터 (테이블이 비어 있을 때만 들어갑니다)
-- ---------------------------------------------------------------------
insert into public.performances (title, venue, starts_at, price)
select v.title, v.venue, v.starts_at::timestamptz, v.price
from (values
    ('2026 월드 투어: 아델 내한공연', 'KSPO DOME',          '2026-03-15 10:30:00+00', 180000),
    ('뮤지컬 <레미제라블>',            '블루스퀘어 신한카드홀', '2026-04-02 11:00:00+00', 150000),
    ('서울시향 신년음악회',            '롯데콘서트홀',        '2026-01-20 10:00:00+00',  90000)
) as v(title, venue, starts_at, price)
where not exists (select 1 from public.performances);

-- 각 공연마다 A열 1~5번, B열 1~5번 좌석 생성
insert into public.seats (performance_id, row_label, seat_number)
select p.id, r.row_label, s.seat_number
from public.performances p
cross join (values ('A'), ('B')) as r(row_label)
cross join generate_series(1, 5) as s(seat_number)
on conflict (performance_id, row_label, seat_number) do nothing;

-- ---------------------------------------------------------------------
-- 4. RPC 함수 - 예매 (좌석 잠금 + 예매 생성 + 좌석 상태 변경을 한 트랜잭션으로)
-- ---------------------------------------------------------------------
create or replace function public.reserve_seat(
    p_seat_id bigint,
    p_customer_name text,
    p_customer_email text
)
returns table (reservation_id bigint, seat_id bigint)
language plpgsql
set search_path = public
as $$
declare
    v_seat seats%rowtype;
begin
    select * into v_seat
    from seats
    where id = p_seat_id
    for update;

    if not found or v_seat.is_available = false then
        raise exception '이미 예약되었거나 존재하지 않는 좌석입니다.';
    end if;

    insert into reservations (seat_id, customer_name, customer_email)
    values (p_seat_id, p_customer_name, p_customer_email)
    returning id into reservation_id;

    update seats
    set is_available = false
    where id = p_seat_id;

    seat_id := p_seat_id;
    return next;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. RPC 함수 - 예매 취소 (예매 삭제 + 좌석 복구)
-- ---------------------------------------------------------------------
create or replace function public.cancel_reservation(
    p_reservation_id bigint,
    p_customer_email text
)
returns table (reservation_id bigint, seat_id bigint)
language plpgsql
set search_path = public
as $$
declare
    v_reservation reservations%rowtype;
begin
    select * into v_reservation
    from reservations
    where id = p_reservation_id
      and customer_email = p_customer_email
    for update;

    if not found then
        raise exception '예매를 찾을 수 없습니다.';
    end if;

    delete from reservations
    where id = p_reservation_id;

    update seats
    set is_available = true
    where id = v_reservation.seat_id;

    reservation_id := p_reservation_id;
    seat_id := v_reservation.seat_id;
    return next;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. 확인용 쿼리
-- ---------------------------------------------------------------------
-- select p.id, p.title, count(s.id) as total, count(s.id) filter (where s.is_available) as available
-- from public.performances p left join public.seats s on s.performance_id = p.id
-- group by p.id, p.title order by p.id;
