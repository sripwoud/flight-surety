import { Request, Response } from 'express'

export default async (req: Request, res: Response) => {
  const { appContract, key } = req.locals
  const response = await appContract.oracleResponses(key)

  res.send(response)
}
