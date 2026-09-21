import type { NextFunction, Request, Response } from 'express';
import { HttpError } from './errors';

/** 라우트에서 던진 에러를 Express 에러 핸들러로 넘겨주는 래퍼 */
export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: '존재하지 않는 경로입니다.' });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  const message = err instanceof Error ? err.message : '알 수 없는 오류';
  console.error('[ERROR]', err);
  res.status(500).json({ error: message });
}
