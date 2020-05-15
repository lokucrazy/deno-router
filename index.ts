import type { HTTPOptions } from "https://deno.land/std@0.50.0/http/server.ts"
import { serve, Server, ServerRequest } from "https://deno.land/std@0.50.0/http/server.ts"

interface Routes {
  [index: string]: HandlerCompose | Router | undefined
}

enum Method {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

type Handler = (req: ServerRequest) => void
type HandlerCompose = (m: Method) => Handler | undefined

export class Router {
  routes: Routes
  constructor() {
    this.routes = {}
  }

  Get(path: string, handler: Handler) {
    this.addHandler(Method.GET, path, handler)
  }

  Post(path: string, handler: Handler) {
    this.addHandler(Method.POST, path, handler)
  }

  Put(path: string, handler: Handler) {
    this.addHandler(Method.PUT, path, handler)
  }

  Delete(path: string, handler: Handler) {
    this.addHandler(Method.DELETE, path, handler)
  }

  Route(path: string, router: Router) {
    this.addRouter(path, router)
  }

  private addHandler(method: Method, path: string, handler: Handler) {
    const route = path[0] !== "/" ? `/${path}` : path
    this.routes[route] = (m: Method) => {
      return m !== method ? undefined : handler
    }
  }

  private addRouter(path: string, router: Router) {
    const route = path[0] !== "/" ? `/${path}` : path
    this.routes[route] = router
  }

  findHandler(method: Method, url: string): Handler {
    let handle: Router | HandlerCompose | undefined
    let path = url
    Object.keys(this.routes).forEach((route) => {
      if (url.match(route)) {
        path = route
        handle = this.routes[route]
      }
    })
    if (handle === undefined) {
      return (req: ServerRequest) => {
        req.respond({ status: 404, body: "Not Found" })
      }
    }
    if (handle instanceof Router) {
      const depthURL = url.split(path)
      return (handle as Router).findHandler(method, depthURL[depthURL.length-1])
    } else {
      return (handle(method) as Handler)
    }
  }
}

export class DenoServer {
  private server: Server
  readonly router: Router
  constructor(options: HTTPOptions) {
    this.server = serve(options)
    this.router = new Router()
  }

  async listenAndServe() {
    for await (const req of this.server) {
      this.router.findHandler(Method.GET, req.url)(req)
    }
  }
}