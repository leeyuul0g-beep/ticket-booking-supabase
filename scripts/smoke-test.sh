#!/usr/bin/env bash
# TICKETFLOW API 동작 확인 스크립트 (캡처 6용)
#   로컬:  ./scripts/smoke-test.sh
#   EC2 :  ./scripts/smoke-test.sh http://퍼블릭IP:3001
set -e

BASE="${1:-http://localhost:3001}"
EMAIL="${2:-minsu@example.com}"

echo "=== 1) 공연 목록  GET $BASE/performances ==="
curl -s "$BASE/performances" | head -c 800; echo; echo

echo "=== 2) 공연 상세  GET $BASE/performances/1 ==="
curl -s "$BASE/performances/1" | head -c 800; echo; echo

echo "=== 3) 없는 공연 (404 확인)  GET $BASE/performances/99999 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" "$BASE/performances/99999"; echo

echo "=== 4) 좌석 예매  POST $BASE/reservations ==="
RES=$(curl -s -X POST "$BASE/reservations" \
  -H "Content-Type: application/json" \
  -d "{\"seatId\":1,\"customerName\":\"김민수\",\"customerEmail\":\"$EMAIL\"}")
echo "$RES"; echo

RID=$(echo "$RES" | sed -n 's/.*"reservation_id":\([0-9]*\).*/\1/p')
echo "생성된 reservation_id = ${RID:-(없음 - 이미 예약된 좌석일 수 있습니다)}"; echo

echo "=== 5) 같은 좌석 중복 예매 (400 확인) ==="
curl -s -X POST "$BASE/reservations" \
  -H "Content-Type: application/json" \
  -d "{\"seatId\":1,\"customerName\":\"김민수\",\"customerEmail\":\"$EMAIL\"}"; echo; echo

echo "=== 6) 예매 내역  GET $BASE/reservations?email=$EMAIL ==="
curl -s "$BASE/reservations?email=$EMAIL" | head -c 800; echo; echo

if [ -n "$RID" ]; then
  echo "=== 7) 예매 취소  PATCH $BASE/reservations/$RID/cancel ==="
  curl -s -X PATCH "$BASE/reservations/$RID/cancel" \
    -H "Content-Type: application/json" \
    -d "{\"customerEmail\":\"$EMAIL\"}"; echo; echo
fi

echo "완료. Supabase Table Editor 에서 reservations / seats.is_available 을 확인하세요."
