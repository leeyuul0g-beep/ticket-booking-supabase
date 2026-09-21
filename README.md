# TICKETFLOW — Supabase 연동 공연 예매 API 서버

Node.js / Express / TypeScript 로 만든 공연 예매 API 서버입니다.
DB는 Supabase(PostgreSQL) `public` 스키마를 사용하고, 예매/취소는 Supabase RPC 함수로
좌석 상태 변경과 예매 데이터 변경을 하나의 트랜잭션처럼 처리합니다.

## 기술 스택

| 구분 | 사용 기술 |
|------|-----------|
| 서버 | Node.js, Express, TypeScript |
| DB 연동 | `@supabase/supabase-js` |
| DB | Supabase PostgreSQL (`public` schema) |
| 배포 | AWS EC2 (Ubuntu), PM2 |

## 폴더 구조

```
ticket-booking-supabase/
├── package.json
├── tsconfig.json
├── .env.example                      # 환경 변수 템플릿 (.env 는 커밋하지 않음)
├── supabase/
│   └── schema.sql                    # 테이블 + 시드데이터 + RPC 함수 (SQL Editor에 붙여넣기)
├── scripts/
│   └── smoke-test.sh                 # curl API 테스트 스크립트
└── server/
    └── src/
        ├── index.ts                  # 서버 시작 + Supabase 연결 확인
        ├── config/index.ts           # server/.env 로딩
        ├── lib/supabase.ts           # Supabase 클라이언트 생성
        ├── types/index.ts            # 응답 타입
        ├── middlewares/              # 에러 처리
        ├── controllers/
        │   ├── performanceController.ts   # 과제 1, 2
        │   ├── reservationController.ts   # 과제 3, 4
        │   └── userController.ts          # 과제 5
        └── routes/
```

### 요청 흐름

```
HTTP 요청
  -> routes        (req.params, req.body, req.query 파싱)
  -> controllers   (비즈니스 로직, Supabase 조회/가공)
  -> lib/supabase  (@supabase/supabase-js)
  -> Supabase PostgreSQL
```

---

## 1. Supabase 준비

1. <https://supabase.com> 가입 → **New project** 생성
   - Region 은 `Northeast Asia (Seoul)` 권장
   - Database Password 는 따로 메모 (이 과제에서는 직접 쓰지 않습니다)
2. 왼쪽 메뉴 **SQL Editor** → **New query** → [`supabase/schema.sql`](supabase/schema.sql) 내용을
   통째로 붙여넣고 **Run**
   - `performances`, `seats`, `reservations` 테이블
   - 공연 3개 + 공연당 좌석 10석 시드 데이터
   - `reserve_seat`, `cancel_reservation` RPC 함수
   가 한 번에 생성됩니다.
3. **Table Editor** 에서 테이블 3개가 보이는지 확인 → **캡처 1**
4. **Database → Schema Visualizer(ERD)** 에서 `performances → seats → reservations`
   관계 확인 → **캡처 2**
5. **Project Settings → API Keys** 에서 아래 두 값을 복사
   - `Project URL` → `https://프로젝트ID.supabase.co`
   - `service_role` secret key (새 UI라면 `Legacy API keys` 탭 또는 `sb_secret_...` 키)

> ⚠️ `service_role` 키는 RLS를 우회하는 **서버 전용 비밀 키**입니다.
> GitHub, 캡처, 제출물에 절대 노출하지 마세요.

## 2. 로컬 실행

```bash
npm install
cp .env.example server/.env     # 이미 있으면 생략
```

`server/.env` 를 본인 값으로 수정합니다.

```
PORT=3001
SUPABASE_URL=https://프로젝트ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=서버에서만_사용할_키
SUPABASE_SCHEMA=public
```

```bash
npm run dev
```

아래처럼 뜨면 성공입니다.

```
Supabase 연결 확인 완료
서버 시작: http://localhost:3001
```

브라우저에서 <http://localhost:3001/performances> 접속 → **캡처 3**

## 3. API 명세

| 과제 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| 1 | `GET` | `/performances` | 공연 목록 + 좌석 + 잔여/전체 좌석 수 |
| 2 | `GET` | `/performances/:id` | 공연 상세 (없으면 404) |
| 3 | `POST` | `/reservations` | 좌석 예매 (`reserve_seat` RPC) |
| 4 | `PATCH` | `/reservations/:id/cancel` | 예매 취소 (`cancel_reservation` RPC) |
| 5 | `GET` | `/reservations?email=...` | 이메일 기준 예매 내역 (최신순) |

### 요청 예시

```bash
# 과제 1
curl http://localhost:3001/performances

# 과제 2
curl http://localhost:3001/performances/1

# 과제 3 - 예매
curl -X POST http://localhost:3001/reservations \
  -H "Content-Type: application/json" \
  -d '{"seatId":1,"customerName":"김민수","customerEmail":"minsu@example.com"}'

# 과제 4 - 취소
curl -X PATCH http://localhost:3001/reservations/1/cancel \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"minsu@example.com"}'

# 과제 5 - 예매 내역
curl "http://localhost:3001/reservations?email=minsu@example.com"
```

5개 API를 한 번에 확인하려면:

```bash
./scripts/smoke-test.sh
```

### 에러 응답

| 상황 | 응답 |
|------|------|
| 이미 예약된 좌석 | `400 { "error": "이미 예약되었거나 존재하지 않는 좌석입니다." }` |
| 필수값 누락 | `400 { "error": "seatId, customerName, customerEmail이 필요합니다." }` |
| 없는 공연 | `404 { "error": "공연을 찾을 수 없습니다." }` |
| 없는 예매 / 이메일 불일치 | `404 { "error": "예매를 찾을 수 없습니다." }` |

---

## 4. AWS EC2 배포

### 과제 6 — 인스턴스 생성

AWS 콘솔 → EC2 → **인스턴스 시작**

- 이름: `이름-ticketflow-supabase-server`
- OS: **Ubuntu Server 22.04 LTS** (문제 시 24.04)
- 유형: `t2.micro` 또는 `t3.micro`
- 키 페어: 수업 안내에 따름 (웹 터미널 방식이면 키 페어 없이 진행 가능)

보안 그룹 인바운드 규칙

| 유형 | 포트 | 소스 | 용도 |
|------|------|------|------|
| SSH | 22 | 내 IP | EC2 접속 |
| 사용자 지정 TCP | 3001 | Anywhere-IPv4 | Express API 서버 |

> Supabase를 쓰므로 **MySQL 설치 불필요, 3306 포트 열지 않습니다.**

### 과제 7 — 환경 구성 및 실행

인스턴스 상세 → **연결** → **EC2 인스턴스 연결** → **연결**

```bash
# Node.js 20
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v

# PM2
sudo npm install -g pm2
pm2 -v

# 레포 클론
git clone 본인_GitHub_레포_URL
cd ticket-booking-supabase
npm install
```

`server/.env` 생성:

```bash
cat <<'EOF' > server/.env
PORT=3001
SUPABASE_URL=https://프로젝트ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=서버에서만_사용할_키
SUPABASE_SCHEMA=public
EOF

vi server/.env     # 본인 Supabase 값으로 수정
```

PM2 실행:

```bash
pm2 start npm --name "ticketflow-supabase" -- run dev:server
pm2 list
pm2 logs ticketflow-supabase --lines 30
```

`status: online` 이면 성공 → **캡처 4**

```
Supabase 연결 확인 완료
서버 시작: http://localhost:3001
```

### 과제 8 — 외부 접속 확인

EC2 → 인스턴스 → **네트워킹** 탭에서 퍼블릭 IPv4 주소 복사 후 브라우저에서 접속:

```
http://퍼블릭IP:3001/performances
```

공연 목록 JSON이 보이면 완료 → **캡처 5**

> 반드시 `http://` 로 시작해야 합니다. 브라우저가 `https://` 로 바꾸면 접속되지 않습니다.

---

## 5. 제출 체크리스트

- [ ] 성명
- [ ] GitHub 레포 URL (`.env` 미포함 / `.env.example` 만 포함)
- [ ] Supabase 프로젝트 URL `https://프로젝트ID.supabase.co`
- [ ] EC2 퍼블릭 IP
- [ ] API 접속 URL `http://EC2_IP:3001/performances`
- [ ] 캡처 1 — Supabase Table Editor (테이블 3개)
- [ ] 캡처 2 — Supabase ERD
- [ ] 캡처 3 — `http://localhost:3001/performances`
- [ ] 캡처 4 — EC2 `pm2 list` (`online`)
- [ ] 캡처 5 — `http://EC2_IP:3001/performances`
- [ ] (선택) 캡처 6 — curl/Postman 예매·취소 테스트
- [ ] (선택) 캡처 7 — 예매 후 `reservations` 행 생성 / `seats.is_available` 변경

## 6. 주의사항

- `SUPABASE_SERVICE_ROLE_KEY` 는 제출물·캡처에 절대 포함하지 않습니다.
- `.env` 는 `.gitignore` 에 등록되어 있습니다. 커밋 전 `git status` 로 확인하세요.
- **과제 확인 후 AWS EC2 인스턴스를 반드시 종료(Terminate)하세요.** 요금이 발생합니다.
  - EC2 → 인스턴스 선택 → 인스턴스 상태 → 인스턴스 종료

## 7. 트러블슈팅

**Supabase 연결이 안 될 때**
- `server/.env` 파일이 존재하나요?
- `SUPABASE_URL` 이 `https://프로젝트ID.supabase.co` 형식인가요?
- `SUPABASE_SERVICE_ROLE_KEY` 를 끝까지 복사했나요?
- Supabase 프로젝트가 일시정지(Paused) 상태는 아닌가요?
- `performances`, `seats`, `reservations` 테이블이 `public` 스키마에 있나요?
- `reserve_seat`, `cancel_reservation` 함수를 SQL Editor에서 실행했나요?

**EC2 접속이 안 될 때**
- 주소가 `http://` 로 시작하나요?
- 포트 `:3001` 을 붙였나요?
- 보안 그룹에 3001 포트가 Anywhere-IPv4 로 열려 있나요?
- `pm2 list` 에서 `status` 가 `online` 인가요?

**PM2가 errored 일 때**
```bash
pm2 logs ticketflow-supabase --lines 30
```
