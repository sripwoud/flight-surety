import { NextFunction, Request, Response } from 'express'

export default async (req: Request, _: Response, next: NextFunction) => {
  const { flightRef, to, landing } = req.body

  req.locals.key = await req.locals.dataContract.getFlightKey(
    flightRef,
    to,
    new Date(landing).getTime()
  )

  next()
}
