// Auth Model - Handles authentication data and localStorage
export class AuthModel {
  constructor() {
    this.baseUrl = "https://story-api.dicoding.dev/v1"
    this.tokenKey = "dicoding-story-token"
    this.userKey = "dicoding-story-user"
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!data.error) {
        this.saveToken(data.loginResult.token)
        this.saveUser({
          userId: data.loginResult.userId,
          name: data.loginResult.name,
        })

        // Trigger auth state change event
        window.dispatchEvent(
          new CustomEvent("authStateChanged", {
            detail: { authenticated: true, user: data.loginResult },
          }),
        )

        return { success: true, data: data.loginResult }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      return { success: false, message: "Network error occurred" }
    }
  }

  async register(name, email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()
      return { success: !data.error, message: data.message }
    } catch (error) {
      return { success: false, message: "Network error occurred" }
    }
  }

  saveToken(token) {
    localStorage.setItem(this.tokenKey, token)
  }

  saveUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user))
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  getUser() {
    const user = localStorage.getItem(this.userKey)
    return user ? JSON.parse(user) : null
  }

  isAuthenticated() {
    return !!this.getToken()
  }

  logout() {
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)

    // Trigger auth state change event
    window.dispatchEvent(
      new CustomEvent("authStateChanged", {
        detail: { authenticated: false },
      }),
    )
  }
}
