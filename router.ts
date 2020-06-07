// Copyright 2020 Ryan Lokugamage. All rights reserved. MIT License

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
  notFound: Handler | undefined
}

/** Handles routing for defined api routes */
export default class Router {
  routes: Routes
  notFoundRoute: Handler

  /**
   * Creates a router
   * @param options {RouterOptions} - router options to change some internals
   */
  constructor(options?: RouterOptions) {
    const { notFound } = options ?? {}
    this.routes = {}
    this.notFoundRoute = notFound ?? ((req: ServerRequest) => req.respond({ status: 404, body: "Not Found" }))
  }

  /**
   * Adds a handler with GET method to path
   * @param path - url path to add handler
   * @param handler - function to run when accessing path
   */
  get(path: string, handler: Handler) {
    this.addHandler(Method.GET, path, handler)
  }

  /**
   * Adds a handler with POST method to path
   * @param path - url path to add handler
   * @param handler - function to run when accessing path
   */
  post(path: string, handler: Handler) {
    this.addHandler(Method.POST, path, handler)
  }

  /**
   * Adds a handler with PUT method to path
   * @param path - url path to add handler
   * @param handler - function to run when accessing path
   */
  put(path: string, handler: Handler) {
    this.addHandler(Method.PUT, path, handler)
  }

  /**
   * Adds a handler with DELETE method to path
   * @param path - url path to add handler
   * @param handler - function to run when accessing path
   */
  delete(path: string, handler: Handler) {
    this.addHandler(Method.DELETE, path, handler)
  }

  /**
   * Adds another router to path
   * @param path - url path to add handler
   * @param router - router to run when accessing path
   */
  route(path: string, router: Router) {
    this.addRouter(path, router)
  }
  
  private findHandler(req: ServerRequest, method: Method, url: string): void {
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

/** Handles url matching to routes defined in a router */
class Matcher {
  private url: string
  private matchTokens: string[]
  private regex: RegExp
  private matchRegex: RegExp

  /**
   * Creates a matcher
   * @param url - the url from the serve request
   * @param route - the route defined in a router
   */
  constructor(url: string, route: string) {
    this.url = url
    this.regex = /:[^/]+/g
    this.matchTokens = route.match(this.regex)?.map(token => token.substring(1)) ?? []
    this.matchRegex = new RegExp(`^${route.replace(this.regex, '([^/]+)')}`)
  }

  /**
   * Compares url to route
   */
  urlMatch(): boolean {
    const [correct] = this.url.toString().match(this.matchRegex) ?? []
    return !!correct
  }

  /**
   * Build params object with search and route parameters
   */
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