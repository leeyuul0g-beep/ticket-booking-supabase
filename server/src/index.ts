import cors from 'cors';
import express from 'express';
import { config } from './config';
import { supabase } from './lib/supabase';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import routes from './routes';

/** 부팅 시 Supabase 연결과 테이블 존재 여부를 한 번 확인합니다. */
async function checkSupabaseConnection() {
  const { error } = await supabase.from('performances').select('id').limit(1);
  if (error) {
    throw new Error(
      `Supabase 연결 실패: ${error.message}\n` +
        '- server/.env 의 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 확인하세요.\n' +
        '- performances, seats, reservations 테이블이 public 스키마에 있는지 확인하세요.',
    );
  }
}

async function main() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  await checkSupabaseConnection();
  console.log('Supabase 연결 확인 완료');

  // EC2 외부 접속을 위해 0.0.0.0 으로 바인딩합니다.
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`서버 시작: http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
