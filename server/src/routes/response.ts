import { Request, Response } from 'express'

export default async (req: Request, res: Response) => {
  const {
    locals: { appContract },
    params: { key }
  } = req

  const response = await appContract.oracleResponses(key)

  res.send(response)
}
