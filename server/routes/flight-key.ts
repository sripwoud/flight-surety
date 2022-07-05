import { Request, Response } from 'express'
import { utils } from 'ethers'

export default (req: Request, res: Response) => {
  const { flightRef, from, to, takeOff } = req.body
  const key = utils.solidityKeccak256(
    ['string', 'string', 'string', 'uint'],
    [flightRef, from, to, new Date(takeOff).getTime()]
  )

  res.send(key)
}
