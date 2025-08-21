/**
 * Base Controller class for MVC architecture
 * Provides common functionality for all controllers
 */
class BaseController {
  constructor() {
    this.ensureAuth();
  }

  /**
   * Ensure user is authenticated
   */
  ensureAuth() {
    if (window.location.pathname.endsWith('/login.html')) return;
    if (!this.getUserIdFromCookie()) {
      window.location.href = '/login.html';
    }
  }

  /**
   * Get user ID from cookie
   */
  getUserIdFromCookie() {
    const match = document.cookie.match(/(?:^|; )user_id=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Show loading state
   */
  showLoading(element) {
    if (element) {
      element.innerHTML = '<div class="loading">Carregando...</div>';
    }
  }

  /**
   * Hide loading state
   */
  hideLoading(element) {
    if (element) {
      const loading = element.querySelector('.loading');
      if (loading) loading.remove();
    }
  }

  /**
   * Show error message
   */
  showError(message, container) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    if (container) {
      container.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message, container) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    if (container) {
      container.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
    }
  }

  /**
   * Handle form submission with validation
   */
  handleFormSubmission(formElement, onSubmit) {
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(formElement);
      const data = Object.fromEntries(formData.entries());
      
      try {
        await onSubmit(data);
      } catch (error) {
        this.showError(error.message, formElement.parentElement);
      }
    });
  }
}

// Export for use in other controllers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseController;
}