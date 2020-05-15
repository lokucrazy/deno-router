# Deno Router

This is a simple router class for Deno servers.  Import `DenoServer` to create a server and add routes.

example (can be run at [example.ts](./example.ts)):

```typescript
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
```
