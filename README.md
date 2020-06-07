# Deno Router

This is a simple router class for Deno servers.  Import `Router` to create a router and add routes.

example (can be run at [example.ts](./example.ts)):

```typescript
import Router from "./router.ts"
import { listenAndServe } from "https://deno.land/std@0.50.0/http/server.ts"

const router = new Router()

const customRouter = new Router()
customRouter.get("router", function(req) {
  req.respond({ body: "Custom Route GET"})
})

router.route("custom", customRouter)

router.get("test", function(req) {
  req.respond({ body: "Test route GET"})
})

router.get("this/:id/gets/:another", function(req, params) {
  req.respond({ body: JSON.stringify(params), headers: new Headers([
    ['content-type', 'application/json']
  ])})
})

listenAndServe({ port: 8080 }, router.listen())
```

there is a default 404 route that you can customize by passing in a handler to the router constructor

```typescript
import Router from "./router.ts"
import { listenAndServe } from "https://deno.land/std@0.50.0/http/server.ts"

const router = new Router({ notFound: (req) => req.respond({ body: 'hey this is a customzied 404 route' })})

listenAndServer({ port: 8080}, router.listen())
```