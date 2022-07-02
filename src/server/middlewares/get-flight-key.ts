export default async (
  { locals: { dataContract }, params: { ref, dest, landing } },
  res,
  next
) => {
  req.locals.key = await dataContract.methods
    .getFlightKey(ref, dest, landing)
    .call()

  next()
}
