import { Request, Response } from 'express'
import { utils } from 'ethers'

export default async (req: Request, res: Response) => {
  const {
    locals: { dataContract },
    params: { key }
  } = req

  // @ts-ignore
  const {
    isRegistered,
    statusCode,
    takeOff,
    landing,
    airline,
    flightRef,
    price,
    from,
    to
  } = await dataContract.flights(key)

  res.json({
    isRegistered,
    statusCode,
    takeOff: new Date(takeOff.toNumber()),
    landing: new Date(landing.toNumber()),
    airline,
    flightRef,
    price: utils.formatEther(price),
    from,
    to
  })
}
