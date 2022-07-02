import { Request, Response } from 'express'

export default (req: Request, res: Response) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
}
