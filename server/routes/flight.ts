import { Request, Response } from 'express'

export default async (req: Request, res: Response) => {
  const {
    locals: { dataContract, key }
  } = req

  // @ts-ignore
  const flight = await dataContract.methods.flights(key).call()

  res.send(flight)
}
