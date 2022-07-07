import { Request, Response } from 'express'

const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FLight Surety API</title>
  </head>
  <body>
    <div>
      <h1>Flight Surety API</h1>
      <h2>Routes</h2>
      <table>
        <tr>
          <th>Method</th>
          <th>Route</th>
        </tr>
        <tr>
          <td>GET</td>
          <td>/flights</td>
        </tr>
        <tr>
          <td>GET</td>
          <td>/flight/:ref.:dest.:landing</td>
        </tr>
        <tr>
          <td>GET</td>
          <td>/response/:ref.:dest.:landing</td>
        </tr>
      </table>
    </div>
    <footer>
      <p>Made by @r1oga</p>
      <a
        rel="stylesheet"
        target="_blank"
        href="https://github.com/r1oga"
        >GitHub</a
      >
    </footer>
  </body>
</html>
`
export default (req: Request, res: Response) => {
  res.send(html)
}
