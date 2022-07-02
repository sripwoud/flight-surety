export default async ({ locals: { key, appContract } }, res) => {
  const response = await appContract.methods.oracleResponses(key).call()

  res.send(response)
}
