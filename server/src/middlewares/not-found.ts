import { Request, Response } from 'express'

export default (req: Request, res: Response) => {
  res.status(404).send(`${req.method} ${req.path} not handled`)
}
