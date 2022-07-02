import {NextFunction, Request, Response} from 'express'

export default async (req: Request, _: Response, next: NextFunction) => {
  const { ref, dest, landing } = req.params

  req.locals.key = await req.locals.dataContract.methods
    .getFlightKey(ref, dest, landing)
    .call()

  next()
}
