/**
 * Fountain Spell Assist - Toast Notification System
 * 
 * Simple toast notifications for user feedback
 */

let toastContainer: HTMLElement | null = null;

/**
 * Initialize toast container
 */
function initToastContainer(): void {
  if (toastContainer) return;
  
  toastContainer = document.createElement('div');
  toastContainer.id = 'fsa-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
}

/**
 * Show a toast notification
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000): void {
  initToastContainer();
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `fsa-toast fsa-toast-${type}`;
  toast.style.cssText = `
    background: #1a1a1a;
    border: 1px solid #333;
    border-left: 3px solid ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#f97316'};
    border-radius: 8px;
    padding: 12px 16px;
    color: #fafafa;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    pointer-events: auto;
    animation: fsa-toast-slide-in 0.2s ease-out;
    max-width: 300px;
  `;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fsa-toast-slide-out 0.2s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, duration);
}

// Add toast animations to content.css
const style = document.createElement('style');
style.textContent = `
  @keyframes fsa-toast-slide-in {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fsa-toast-slide-out {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
`;
document.head.appendChild(style);

