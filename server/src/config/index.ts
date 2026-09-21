import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * server/.env 를 찾아서 읽습니다.
 * - 로컬:  npm run dev        (cwd = 레포 루트)
 * - EC2:   pm2 start npm -- run dev:server  (cwd = 레포 루트)
 * - 빌드본: node dist/index.js
 */
const candidates = [
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(__dirname, '../../.env'), // server/src/config -> server/.env
  path.resolve(process.cwd(), '.env'),
];

const envPath = candidates.find((p) => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `환경 변수 ${name} 가 필요합니다. server/.env 파일을 확인하세요. (.env.example 참고)`,
    );
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseSchema: process.env.SUPABASE_SCHEMA ?? 'public',
  envPath,
};
