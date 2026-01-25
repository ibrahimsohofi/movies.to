// Accessibility utilities

/**
 * Focus trap for modals and dialogs
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique ID for accessibility labels
 */
let idCounter = 0;
export function generateA11yId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(elements).filter(isElementVisible);
}

/**
 * Handle escape key to close modals
 */
export function handleEscapeKey(callback: () => void): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };
}

/**
 * Format number for screen readers
 */
export function formatNumberForA11y(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} million`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} thousand`;
  }
  return num.toString();
}

/**
 * Create accessible keyboard handler
 */
export function createKeyboardHandler(handlers: {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        handlers.onEnter?.();
        break;
      case ' ':
        e.preventDefault();
        handlers.onSpace?.();
        break;
      case 'Escape':
        handlers.onEscape?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        handlers.onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handlers.onArrowDown?.();
        break;
      case 'ArrowLeft':
        handlers.onArrowLeft?.();
        break;
      case 'ArrowRight':
        handlers.onArrowRight?.();
        break;
    }
  };
}

/**
 * Manage focus for roving tabindex pattern
 */
export class RovingTabIndex {
  private elements: HTMLElement[] = [];
  private currentIndex = 0;

  constructor(container: HTMLElement, selector: string) {
    this.elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
    this.updateTabIndices();
  }

  private updateTabIndices(): void {
    this.elements.forEach((el, index) => {
      el.setAttribute('tabindex', index === this.currentIndex ? '0' : '-1');
    });
  }

  focusNext(): void {
    this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    this.updateTabIndices();
    this.elements[this.currentIndex]?.focus();
  }

  focusPrevious(): void {
    this.currentIndex = (this.currentIndex - 1 + this.elements.length) % this.elements.length;
    this.updateTabIndices();
    this.elements[this.currentIndex]?.focus();
  }

  focusFirst(): void {
    this.currentIndex = 0;
    this.updateTabIndices();
    this.elements[this.currentIndex]?.focus();
  }

  focusLast(): void {
    this.currentIndex = this.elements.length - 1;
    this.updateTabIndices();
    this.elements[this.currentIndex]?.focus();
  }
}

/**
 * Add skip link styles
 */
export function addSkipLinkStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    .sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
  `;
  document.head.appendChild(style);
}

// Initialize skip link styles
if (typeof document !== 'undefined') {
  addSkipLinkStyles();
}
