declare module 'express-serve-static-core' {
  interface Request {
    locals?: { dataContract: any; appContract: any; server: any; key?: string }
  }
}
