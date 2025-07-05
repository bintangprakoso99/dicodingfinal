// Simple hash-based router for SPA
export class Router {
  constructor() {
    this.routes = {}
    this.currentRoute = null
  }

  addRoute(path, handler) {
    this.routes[path] = handler
  }

  init() {
    window.addEventListener("hashchange", () => this.handleRoute())
    window.addEventListener("load", () => this.handleRoute())
  }

  handleRoute() {
    try {
      const hash = window.location.hash.slice(1) || "/"
      const [path, ...params] = hash.split("/")
      const fullPath = "/" + (path || "")

      console.log("Handling route:", hash, "Full path:", fullPath)

      // Handle parameterized routes (like /story/:id)
      const matchedRoute = this.findMatchingRoute(hash)
      if (matchedRoute) {
        this.currentRoute = hash
        this.applyPageTransition(() => {
          matchedRoute.handler(...matchedRoute.params)
        })
      } else if (this.routes[fullPath]) {
        this.currentRoute = fullPath
        this.applyPageTransition(() => {
          this.routes[fullPath]()
        })
      } else {
        console.log("No route found, redirecting to home")
        // Default fallback
        this.navigate("/home")
      }
    } catch (error) {
      console.error("Error handling route:", error)
      this.handleRouteError(error)
    }
  }

  handleRouteError(error) {
    try {
      const container = document.getElementById("app-container")
      if (container) {
        container.innerHTML = `
          <div class="error-container">
            <div class="error">
              <h2>Navigation Error</h2>
              <p>Error: ${error.message}</p>
              <div style="margin-top: 1rem;">
                <button onclick="window.location.hash = '/home'" class="btn btn-primary">Go to Home</button>
                <button onclick="location.reload()" class="btn btn-secondary" style="margin-left: 1rem;">Reload Page</button>
              </div>
            </div>
          </div>
        `
      }
    } catch (fallbackError) {
      console.error("Fallback error handler failed:", fallbackError)
      // Last resort - reload the page
      location.reload()
    }
  }

  findMatchingRoute(hash) {
    try {
      for (const [route, handler] of Object.entries(this.routes)) {
        const routeParts = route.split("/")
        const hashParts = hash.split("/")

        if (routeParts.length === hashParts.length) {
          const params = []
          let isMatch = true

          for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(":")) {
              params.push(hashParts[i])
            } else if (routeParts[i] !== hashParts[i]) {
              isMatch = false
              break
            }
          }

          if (isMatch) {
            return { handler, params }
          }
        }
      }
      return null
    } catch (error) {
      console.error("Error in findMatchingRoute:", error)
      return null
    }
  }

  navigate(path) {
    try {
      window.location.hash = path
    } catch (error) {
      console.error("Error navigating to:", path, error)
    }
  }

  applyPageTransition(callback) {
    try {
      const container = document.getElementById("app-container")

      if (!container) {
        console.error("App container not found for page transition")
        // Try to execute callback anyway
        callback()
        return
      }

      // Use View Transition API if supported
      if ("startViewTransition" in document) {
        document.startViewTransition(() => {
          callback()
          // Update navigation after page transition
          if (window.app) {
            setTimeout(() => {
              window.app.safeUpdateNavigation()
            }, 100)
          }
        })
      } else {
        // Fallback animation
        container.style.opacity = "0"
        container.style.transform = "translateY(20px)"

        setTimeout(() => {
          callback()
          container.style.transition = "opacity 0.3s ease, transform 0.3s ease"
          container.style.opacity = "1"
          container.style.transform = "translateY(0)"

          // Update navigation after page transition
          if (window.app) {
            setTimeout(() => {
              window.app.safeUpdateNavigation()
            }, 100)
          }
        }, 150)
      }
    } catch (error) {
      console.error("Error in applyPageTransition:", error)
      // Fallback - just execute the callback
      try {
        callback()
      } catch (callbackError) {
        console.error("Error in callback:", callbackError)
      }
    }
  }
}
