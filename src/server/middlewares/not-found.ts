import { NextFunction, Request, Response } from 'express'

// @ts-ignore
export default async (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  throw err
}
