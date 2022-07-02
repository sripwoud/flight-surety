export default ({ locals: { server } }, res) => {
  res.json(server.flights)
}
