import { ServerRequest } from "https://deno.land/std@0.50.0/http/server.ts"

const enum Method {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

type Routes = { [index: string]: HandlerCompose | Router | undefined }
type Handler = ((req: ServerRequest, params?: object) => void)
type HandlerCompose = (m: Method) => Handler | undefined
type RouterOptions = {
  routes: Routes | undefined,
  notFound: Handler | undefined
}

export default class Router {
  routes: Routes
  notFoundRoute: Handler
  constructor(options?: RouterOptions) {
    const { notFound } = options ?? {}
    this.routes = {}
    this.notFoundRoute = notFound ?? ((req: ServerRequest) => req.respond({ status: 404, body: "Not Found" }))
  }

  get(path: string, handler: Handler) {
    this.addHandler(Method.GET, path, handler)
  }

  post(path: string, handler: Handler) {
    this.addHandler(Method.POST, path, handler)
  }

  put(path: string, handler: Handler) {
    this.addHandler(Method.PUT, path, handler)
  }

  delete(path: string, handler: Handler) {
    this.addHandler(Method.DELETE, path, handler)
  }

  route(path: string, router: Router) {
    this.addRouter(path, router)
  }
  
  findHandler(req: ServerRequest, method: Method, url: string): void {
    let handle: Router | HandlerCompose | undefined
    let path = url
    let params: object | undefined
    Object.keys(this.routes).forEach((route) => {
      console.log(route, url)
      const matcher = new Matcher(url, route)
      if (matcher.urlMatch()) {
        path = route
        handle = this.routes[route]
        params = matcher.buildParams()
      }
    })
    if (handle === undefined) {
      return this.notFoundRoute(req)
    }
    if (handle instanceof Router) {
      const depthURL = url.split(path)
      return (handle as Router).findHandler(req, method, depthURL[depthURL.length-1])
    } else {
      return (handle(method) as Handler)(req, params)
    }
  }

  listen(): Handler {
    return (req) => {
      this.findHandler(req, (req.method as Method), req.url)
    }
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
}

class Matcher {
  private url: string
  private matchTokens: string[]
  private regex: RegExp
  private matchRegex: RegExp
  constructor(url: string, route: string) {
    this.url = url
    this.regex = /:[^/]+/g
    this.matchTokens = route.match(this.regex)?.map(token => token.substring(1)) ?? []
    this.matchRegex = new RegExp(`^${route.replace(this.regex, '([^/]+)')}`)
  }

  urlMatch(): boolean {
    const [correct] = this.url.toString().match(this.matchRegex) ?? []
    return !!correct
  }

  buildParams(): object {
    const searchParams = new URLSearchParams(this.url.match(/\?.+/)?.[0])
    const [_, ...urlTokens] = this.url.toString().match(this.matchRegex) ?? []
    const params = this.matchTokens.reduce((params: {[index: string]: string}, token: string, index: number) => { 
        params[token] = urlTokens[index] 
        return params
      }, {})
    searchParams.forEach((value, key) => { console.log(key, value), params[key] = value} )
    return params
  }
}