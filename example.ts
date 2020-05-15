import { DenoServer, Router } from "./index.ts"

const server = new DenoServer({ port: 8080 })

const customRouter = new Router()
customRouter.Get("router", function(req) {
  console.log("Got to custom route")
  req.respond({ body: "Custom Route GET"})
})

server.router.Route("custom", customRouter)

server.router.Get("test", function(req) {
  console.log("got to this")
  req.respond({ body: "Test route GET"})
})

server.listenAndServe()