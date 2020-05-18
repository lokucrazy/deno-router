import { Router } from "./index.ts"
import { listenAndServe } from "https://deno.land/std@0.50.0/http/server.ts"

const router = new Router()

const customRouter = new Router()
customRouter.Get("router", function(req) {
  console.log("Got to custom route")
  req.respond({ body: "Custom Route GET"})
})

router.Route("custom", customRouter)

router.Get("test", function(req) {
  console.log("got to this")
  req.respond({ body: "Test route GET"})
})

listenAndServe({ port: 8080 }, router.listen())