import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { config } from '../config';

const supabaseUrl = config.supabaseUrl;
const serviceRoleKey = config.supabaseServiceRoleKey;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase 환경 변수가 필요합니다.');
}

/**
 * Node 22 미만에는 전역 WebSocket이 없어서 createClient가 실패합니다.
 * (EC2의 Node 20 등) 이 서버는 realtime 기능을 쓰지 않지만
 * 클라이언트 생성 시점에 WebSocket 구현체를 요구하므로 ws 를 주입합니다.
 */
const wsTransport = WebSocket as unknown as typeof globalThis.WebSocket;

/**
 * 서버 전용 Supabase 클라이언트.
 * service_role 키는 RLS를 우회하므로 절대 프론트엔드/깃허브에 노출하지 않습니다.
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  db: { schema: config.supabaseSchema as 'public' },
  realtime: { transport: wsTransport },
});
