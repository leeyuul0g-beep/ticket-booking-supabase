import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const supabaseUrl = config.supabaseUrl;
const serviceRoleKey = config.supabaseServiceRoleKey;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Supabase 환경 변수가 필요합니다.');
}

/**
 * 서버 전용 Supabase 클라이언트.
 * service_role 키는 RLS를 우회하므로 절대 프론트엔드/깃허브에 노출하지 않습니다.
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  db: { schema: config.supabaseSchema as 'public' },
});
