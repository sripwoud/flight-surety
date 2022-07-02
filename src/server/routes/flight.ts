export default async ({ locals: { dataContract, key } }, res) => {
  const flight = await dataContract.methods.flights(key).call()

  res.send(flight)
}
