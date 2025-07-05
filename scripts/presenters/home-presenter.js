// Home Presenter - Pure business logic, no DOM manipulation or Web API calls
import { HomeView } from "../views/home-view.js"
import { StoryModel } from "../models/story-model.js"
import { MapService } from "../services/map-service.js"

export class HomePresenter {
  constructor(router) {
    this.storyModel = new StoryModel()
    this.mapService = new MapService()
    this.router = router
    this.view = new HomeView()
    this.stories = []
  }

  async init() {
    try {
      if (!this.view.init()) {
        throw new Error("Failed to initialize home view - app container not found")
      }

      this.view.showLoading()
      await this.loadStories()
      this.initializeMap()
      this.bindEvents()
    } catch (error) {
      console.error("Error initializing home presenter:", error)
      this.handleInitError(error)
    }
  }

  handleInitError(error) {
    try {
      if (this.view && this.view.container) {
        this.view.showError(`Failed to initialize: ${error.message}`)
      } else {
        // Fallback if view is not available
        const container = document.getElementById("app-container")
        if (container) {
          container.innerHTML = `
            <div class="error-container">
              <div class="error">
                <h2>Initialization Error</h2>
                <p>Error: ${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
              </div>
            </div>
          `
        }
      }
    } catch (fallbackError) {
      console.error("Fallback error handler failed:", fallbackError)
    }
  }

  async loadStories() {
    try {
      const result = await this.storyModel.getAllStories(1, 20, 1)

      if (result.success) {
        this.stories = result.data || []
        this.view.render(this.stories)
      } else {
        throw new Error(result.message || "Failed to load stories")
      }
    } catch (error) {
      console.error("Error loading stories:", error)
      this.view.showError(error.message || "Failed to load stories")
    }
  }

  initializeMap() {
    try {
      const mapContainer = this.view.getMapContainer()
      if (mapContainer && this.stories.length > 0) {
        this.mapService.initializeMap(mapContainer, this.stories)
      }
    } catch (error) {
      console.error("Failed to initialize map:", error)
      // Don't throw error, just log it as map is optional
    }
  }

  bindEvents() {
    try {
      this.view.bindStoryClick((storyId) => {
        if (storyId && this.router) {
          this.router.navigate(`/story/${storyId}`)
        }
      })

      this.view.bindRetryClick(() => {
        this.loadStories()
      })
    } catch (error) {
      console.error("Error binding events:", error)
    }
  }

  cleanup() {
    try {
      if (this.mapService) {
        this.mapService.cleanup()
      }
    } catch (error) {
      console.error("Error during cleanup:", error)
    }
  }
}
