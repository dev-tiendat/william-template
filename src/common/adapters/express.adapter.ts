import type { NextFunction, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import express from 'express'

export function setupExpress(app: express.Express) {
  app.set('trust proxy', true)

  app.use(cookieParser('cookie-secret'))

  app.use(express.json({ limit: '6mb' }))
  app.use(express.urlencoded({ extended: true, limit: '6mb' }))

  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (!req.headers.origin) {
      req.headers.origin = req.headers.host
    }

    if (req.url.endsWith('.php')) {
      res.statusMessage = 'Eh. PHP is not support on this machine. Yep, I also think PHP is bestest programming language. But for me it is beyond my reach.'
      res.status(418).send()
      return
    }

    if (req.url.match(/favicon.ico$/) || req.url.match(/manifest.json$/)) {
      res.status(204).send()
      return
    }

    next()
  })
}
