declare namespace Express {
  export interface Request {
    locals: { dataContract: any; appContract: any; server: any; key?: string }
    dataContract: any
    appContract: any
  }
}
