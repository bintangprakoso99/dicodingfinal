// Enhanced main application with PWA features
import { Router } from "./router.js"
import { AuthModel } from "./models/auth-model.js"
import { HomePage } from "./pages/home-page.js"
import { AddStoryPage } from "./pages/add-story-page.js"
import { LoginPage } from "./pages/login-page.js"
import { MapPage } from "./pages/map-page.js"
import { SettingsPage } from "./pages/settings-page.js"
import { FavoritesPage } from "./pages/favorites-page.js"
import { StoryDetailPage } from "./pages/story-detail-page.js"
import { NotificationService } from "./services/notification-service.js"
import { IndexedDBService } from "./services/indexeddb-service.js"

class App {
  constructor() {
    this.router = new Router()
    this.authModel = new AuthModel()
    this.notificationService = new NotificationService()
    this.indexedDBService = new IndexedDBService()
    this.currentPage = null
    this.navigationInitialized = false
    this.init()
  }

  async init() {
    console.log("Initializing app...")
    await this.initializePWA()
    this.setupSkipToContent()
    this.setupMobileMenu()
    this.setupRoutes()
    this.setupNavigation()
    this.checkAuthState()
    this.initializeDarkMode()
    this.setupServiceWorkerMessages()
    this.setupAuthEvents()
    this.router.init()
  }

  setupAuthEvents() {
    // Listen for auth state changes
    window.addEventListener("authStateChanged", (event) => {
      console.log("Auth state changed:", event.detail)
      this.safeUpdateNavigation()
    })
  }

  async initializePWA() {
    try {
      // Initialize IndexedDB
      await this.indexedDBService.init()
      console.log("IndexedDB initialized")

      // Register service worker dengan path yang benar
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("./sw.js", {
          scope: "./",
        })
        console.log("Service Worker registered:", registration)

        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              this.showUpdateAvailable()
            }
          })
        })
      }

      // Handle online/offline events
      window.addEventListener("online", () => {
        this.handleOnline()
      })

      window.addEventListener("offline", () => {
        this.handleOffline()
      })

      // Show install prompt
      this.setupInstallPrompt()
    } catch (error) {
      console.error("Failed to initialize PWA features:", error)
    }
  }

  setupInstallPrompt() {
    let deferredPrompt

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      deferredPrompt = e
      this.showInstallButton(deferredPrompt)
    })

    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed")
      this.hideInstallButton()
      this.showNotification("App installed successfully!", "success")
    })
  }

  showInstallButton(deferredPrompt) {
    const installBtn = document.createElement("button")
    installBtn.id = "install-btn"
    installBtn.className = "btn btn-primary install-btn"
    installBtn.innerHTML = "📱 Install App"
    installBtn.setAttribute("aria-label", "Install Dicoding Stories app")

    installBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)
        deferredPrompt = null
        this.hideInstallButton()
      }
    })

    const navbar = document.querySelector(".nav-menu")
    if (navbar && !document.getElementById("install-btn")) {
      navbar.appendChild(installBtn)
    }
  }

  hideInstallButton() {
    const installBtn = document.getElementById("install-btn")
    if (installBtn) {
      installBtn.remove()
    }
  }

  showUpdateAvailable() {
    const updateBanner = document.createElement("div")
    updateBanner.className = "update-banner"
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>🔄 A new version is available!</span>
        <button id="update-btn" class="btn btn-sm btn-primary">Update Now</button>
        <button id="dismiss-update" class="btn btn-sm btn-secondary">Later</button>
      </div>
    `

    document.body.appendChild(updateBanner)

    document.getElementById("update-btn").addEventListener("click", () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" })
      }
      window.location.reload()
    })

    document.getElementById("dismiss-update").addEventListener("click", () => {
      updateBanner.remove()
    })
  }

  async handleOnline() {
    console.log("App is online")
    this.showNotification("You're back online! Syncing data...", "success")

    // Sync offline queue
    try {
      const storyModel = new (await import("./models/story-model.js")).StoryModel()
      const result = await storyModel.syncOfflineQueue()
      if (result.success && result.results.length > 0) {
        const successCount = result.results.filter((r) => r.success).length
        if (successCount > 0) {
          this.showNotification(`${successCount} offline stories synced successfully!`, "success")
        }
      }
    } catch (error) {
      console.error("Failed to sync offline data:", error)
    }
  }

  handleOffline() {
    console.log("App is offline")
    this.showNotification("You're offline. Some features may be limited.", "warning")
  }

  setupServiceWorkerMessages() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "BACKGROUND_SYNC") {
          this.handleOnline()
        }
      })
    }
  }

  showNotification(message, type) {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message
    notification.setAttribute("role", "alert")
    notification.setAttribute("aria-live", "polite")

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("show")
    }, 100)

    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove()
        }
      }, 300)
    }, 5000)
  }

  setupSkipToContent() {
    const mainContent = document.querySelector("#main-content")
    const skipLink = document.querySelector(".skip-link")

    if (skipLink && mainContent) {
      skipLink.addEventListener("click", (event) => {
        event.preventDefault()
        skipLink.blur()
        mainContent.focus()
        mainContent.scrollIntoView()
      })
    }
  }

  setupMobileMenu() {
    const mobileToggle = document.getElementById("mobile-menu-toggle")
    const navMenu = document.getElementById("nav-menu")

    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener("click", () => {
        const isActive = navMenu.classList.contains("active")

        if (isActive) {
          navMenu.classList.remove("active")
          mobileToggle.classList.remove("active")
          mobileToggle.setAttribute("aria-expanded", "false")
        } else {
          navMenu.classList.add("active")
          mobileToggle.classList.add("active")
          mobileToggle.setAttribute("aria-expanded", "true")
        }
      })

      // Close mobile menu when clicking nav links
      navMenu.addEventListener("click", (e) => {
        if (e.target.classList.contains("nav-link")) {
          navMenu.classList.remove("active")
          mobileToggle.classList.remove("active")
          mobileToggle.setAttribute("aria-expanded", "false")
        }
      })

      // Close mobile menu when clicking outside
      document.addEventListener("click", (e) => {
        if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navMenu.classList.remove("active")
          mobileToggle.classList.remove("active")
          mobileToggle.setAttribute("aria-expanded", "false")
        }
      })
    }
  }

  setupRoutes() {
    console.log("Setting up routes...")
    this.router.addRoute("/", () => this.redirectToHome())
    this.router.addRoute("/home", () => this.showPage(HomePage))
    this.router.addRoute("/login", () => this.showPage(LoginPage, false))
    this.router.addRoute("/register", () => this.showPage(LoginPage, true))
    this.router.addRoute("/add-story", () => this.showPage(AddStoryPage))
    this.router.addRoute("/map", () => this.showPage(MapPage))
    this.router.addRoute("/settings", () => this.showPage(SettingsPage))
    this.router.addRoute("/favorites", () => this.showPage(FavoritesPage))
    this.router.addRoute("/story/:id", (storyId) => this.showPage(StoryDetailPage, storyId))
  }

  async showPage(PageClass, ...args) {
    console.log("Showing page:", PageClass.name, "with args:", args)

    try {
      // Check authentication for protected routes
      const protectedRoutes = [HomePage, AddStoryPage, MapPage, SettingsPage, FavoritesPage, StoryDetailPage]
      if (protectedRoutes.includes(PageClass) && !this.authModel.isAuthenticated()) {
        console.log("User not authenticated, redirecting to login")
        this.router.navigate("/login")
        return
      }

      // Show loading state
      const container = document.getElementById("app-container")
      if (container) {
        container.innerHTML = `
          <div class="loading-container">
            <div class="loading">Loading...</div>
          </div>
        `
      }

      // Destroy current page
      if (this.currentPage?.destroy) {
        try {
          this.currentPage.destroy()
        } catch (error) {
          console.warn("Error destroying current page:", error)
        }
      }

      // Create and render new page
      this.currentPage = new PageClass(this.router, ...args)
      console.log("Created page instance:", this.currentPage)

      await this.currentPage.render()
      console.log("Page rendered successfully")

      // Update navigation after page is rendered
      this.safeUpdateNavigation()
    } catch (error) {
      console.error("Error showing page:", error)
      const container = document.getElementById("app-container")
      if (container) {
        container.innerHTML = `
          <div class="error-container">
            <div class="error">
              <h2>Oops! Something went wrong</h2>
              <p>Error: ${error.message}</p>
              <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
            </div>
          </div>
        `
      }
    }
  }

  safeUpdateNavigation() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          this.updateNavigation()
        })
      } else {
        // Use setTimeout to ensure DOM elements are available
        setTimeout(() => {
          this.updateNavigation()
        }, 50)
      }
    } catch (error) {
      console.error("Error in safeUpdateNavigation:", error)
    }
  }

  updateNavigation() {
    try {
      const isAuthenticated = this.authModel.isAuthenticated()
      console.log("Updating navigation, authenticated:", isAuthenticated)

      // Get navigation elements with null checks
      const navigationElements = {
        logoutBtn: document.getElementById("logout-btn"),
        homeLink: document.getElementById("home-link"),
        addStoryLink: document.getElementById("add-story-link"),
        mapLink: document.getElementById("map-link"),
        settingsLink: document.getElementById("settings-link"),
        favoritesLink: document.getElementById("favorites-link"),
      }

      // Check if any elements are missing
      const missingElements = Object.entries(navigationElements)
        .filter(([key, element]) => !element)
        .map(([key]) => key)

      if (missingElements.length > 0) {
        console.warn("Missing navigation elements:", missingElements)
        // Try again after a short delay
        setTimeout(() => {
          this.updateNavigation()
        }, 100)
        return
      }

      // Update visibility based on authentication state
      Object.values(navigationElements).forEach((element) => {
        if (element && element.style) {
          element.style.display = isAuthenticated ? "block" : "none"
        }
      })

      this.navigationInitialized = true
      console.log("Navigation updated successfully")
    } catch (error) {
      console.error("Error updating navigation:", error)
      // Retry after a delay
      setTimeout(() => {
        this.updateNavigation()
      }, 200)
    }
  }

  checkAuthState() {
    const isAuthenticated = this.authModel.isAuthenticated()
    console.log("Checking auth state:", isAuthenticated)

    // Update navigation with delay to ensure DOM is ready
    setTimeout(() => {
      this.safeUpdateNavigation()
    }, 100)

    if (!isAuthenticated && !window.location.hash.includes("login") && !window.location.hash.includes("register")) {
      this.router.navigate("/login")
    }
  }

  initializeDarkMode() {
    const isDarkMode = localStorage.getItem("dark-mode-enabled") === "true"
    if (isDarkMode) {
      document.body.classList.add("dark-mode")
    }
  }

  redirectToHome() {
    this.router.navigate("/home")
  }

  setupNavigation() {
    // Use event delegation to handle logout button
    document.addEventListener("click", (event) => {
      if (event.target && event.target.id === "logout-btn") {
        this.authModel.logout()
        this.router.navigate("/login")
        // Trigger auth state change event
        window.dispatchEvent(
          new CustomEvent("authStateChanged", {
            detail: { authenticated: false },
          }),
        )
      }
    })
  }

  // Method to be called when login is successful
  onLoginSuccess() {
    console.log("Login successful, updating navigation")
    this.safeUpdateNavigation()
    // Trigger auth state change event
    window.dispatchEvent(
      new CustomEvent("authStateChanged", {
        detail: { authenticated: true },
      }),
    )
  }
}

// Make App instance globally available
window.app = null

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing app...")
  window.app = new App()
})
