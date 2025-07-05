// Home View - Pure DOM manipulation, no business logic
export class HomeView {
  constructor() {
    this.container = null
  }

  init() {
    this.container = document.getElementById("app-container")
    if (!this.container) {
      console.error("App container not found")
      return false
    }
    return true
  }

  showLoading() {
    this.container.innerHTML = `
      <section role="main" aria-labelledby="stories-heading">
        <h1 id="stories-heading">Latest Stories</h1>
        <div class="loading" aria-live="polite">Loading stories...</div>
      </section>
    `
  }

  showError(message) {
    this.container.innerHTML = `
      <section role="main" aria-labelledby="stories-heading">
        <h1 id="stories-heading">Latest Stories</h1>
        <div class="error" role="alert">${message}</div>
        <button class="btn btn-primary" id="retry-btn">Try Again</button>
      </section>
    `
  }

  render(stories = []) {
    this.container.innerHTML = `
      <section role="main" aria-labelledby="stories-heading">
        <div class="page-header">
          <h1 id="stories-heading">Latest Stories</h1>
          <div class="page-actions">
            <a href="#/add-story" class="btn btn-primary">
              ➕ Add New Story
            </a>
          </div>
        </div>
        
        <div class="stories-grid" role="list">
          ${this.renderStories(stories)}
        </div>
        
        <section aria-labelledby="map-heading" style="margin-top: 3rem;">
          <h2 id="map-heading">Story Locations</h2>
          <div id="stories-map" class="map-container" role="application" aria-label="Interactive map showing story locations"></div>
        </section>
      </section>
    `
  }

  renderStories(stories) {
    if (stories.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h2>No Stories Yet</h2>
          <p>Be the first to share your story with the community!</p>
          <a href="#/add-story" class="btn btn-primary">Share Your Story</a>
        </div>
      `
    }

    return stories
      .map(
        (story) => `
        <article class="story-card" role="listitem">
          <button class="story-card-button" data-story-id="${story.id}" aria-label="View story by ${story.name}">
            <img 
              src="${story.photoUrl}" 
              alt="Story photo by ${story.name}: ${story.description.substring(0, 50)}..."
              class="story-image"
              loading="lazy"
            />
            <div class="story-content">
              <h3 class="story-title">${story.name}</h3>
              <p class="story-description">${story.description.length > 100 ? story.description.substring(0, 100) + "..." : story.description}</p>
              <div class="story-meta">
                <time datetime="${story.createdAt}">
                  ${new Date(story.createdAt).toLocaleDateString()}
                </time>
                ${story.lat && story.lon ? `<span aria-label="Location available">📍 Location available</span>` : `<span>No location</span>`}
              </div>
            </div>
          </button>
        </article>
      `,
      )
      .join("")
  }

  getMapContainer() {
    const mapContainer = document.getElementById("stories-map")
    if (!mapContainer) {
      console.warn("Map container not found")
      return null
    }
    return mapContainer
  }

  getRetryButton() {
    return document.getElementById("retry-btn")
  }

  bindStoryClick(handler) {
    this.container.addEventListener("click", (event) => {
      const button = event.target.closest(".story-card-button")
      if (button) {
        const storyId = button.dataset.storyId
        handler(storyId)
      }
    })
  }

  bindRetryClick(handler) {
    const retryBtn = this.getRetryButton()
    if (retryBtn) {
      retryBtn.addEventListener("click", handler)
    }
  }
}
