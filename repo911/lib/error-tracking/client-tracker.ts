/**
 * Client-side error tracker for Repo911.
 *
 * Captures unhandled errors, promise rejections, and breadcrumbs
 * (navigation, clicks, inputs). Sends to /api/errors/track.
 */

import type { Breadcrumb } from '@/types';

type ErrorLevel = 'error' | 'warning' | 'fatal' | 'info';

interface ErrorContext {
  tags?: string[];
  extra?: Record<string, unknown>;
  user?: { id?: string; email?: string };
  level?: ErrorLevel;
}

class ErrorTracker {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 30;
  private context: ErrorContext = {};
  private enabled = true;
  private initialized = false;

  /** Call once to wire up global handlers. Safe to call multiple times. */
  init() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;
    this.setupGlobalHandlers();
    this.setupBreadcrumbs();
  }

  // ---------- Global handlers ----------

  private setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.captureException(event.error ?? new Error(event.message), {
        level: 'error',
        extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      this.captureException(error, {
        level: 'error',
        tags: ['unhandled-promise'],
      });
    });
  }

  // ---------- Breadcrumbs ----------

  private setupBreadcrumbs() {
    // Navigation
    const origPush = window.history.pushState.bind(window.history);
    window.history.pushState = (...args: Parameters<typeof origPush>) => {
      this.addBreadcrumb({ type: 'navigation', message: `Navigated to ${String(args[2])}` });
      return origPush(...args);
    };

    // Clicks on buttons/links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.addBreadcrumb({
          type: 'click',
          message: `Clicked ${target.tagName}`,
          data: { text: target.textContent?.substring(0, 50), id: target.id },
        });
      }
    });

    // Form inputs (debounced, no values logged)
    let inputTimer: ReturnType<typeof setTimeout>;
    document.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      clearTimeout(inputTimer);
      inputTimer = setTimeout(() => {
        this.addBreadcrumb({
          type: 'input',
          message: `Input in ${target.name || target.id || 'field'}`,
          data: { name: target.name, type: target.type },
        });
      }, 1000);
    });
  }

  // ---------- Public API ----------

  addBreadcrumb(crumb: Omit<Breadcrumb, 'timestamp'>) {
    this.breadcrumbs.push({ ...crumb, timestamp: Date.now() });
    if (this.breadcrumbs.length > this.maxBreadcrumbs) this.breadcrumbs.shift();
  }

  setContext(ctx: ErrorContext) {
    this.context = { ...this.context, ...ctx };
  }

  setUser(user: { id?: string; email?: string }) {
    this.context.user = user;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
  }

  async captureException(error: Error | string, context?: ErrorContext) {
    if (!this.enabled || typeof window === 'undefined') return;

    try {
      const err = typeof error === 'string' ? new Error(error) : error;
      const browser = getBrowserInfo();

      const payload = {
        type: err.name || 'Error',
        message: err.message,
        stack: err.stack,
        level: context?.level || this.context.level || 'error',
        tags: [...(this.context.tags || []), ...(context?.tags || [])],
        extra: { ...this.context.extra, ...context?.extra },
        user: context?.user || this.context.user,
        breadcrumbs: this.breadcrumbs,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        browser,
      };

      // Use sendBeacon for reliability on page unload, fall back to fetch
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/errors/track', body);
      } else {
        fetch('/api/errors/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Never let the tracker throw
    }
  }

  async captureMessage(message: string, level: ErrorLevel = 'info') {
    await this.captureException(new Error(message), { level });
  }
}

// ---------- Browser detection ----------

function getBrowserInfo() {
  if (typeof navigator === 'undefined') return {};
  const ua = navigator.userAgent;

  let name = 'Unknown';
  let version = 'Unknown';

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    name = 'Chrome';
    version = ua.match(/Chrome\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edg')) {
    name = 'Edge';
    version = ua.match(/Edg\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Firefox')) {
    name = 'Firefox';
    version = ua.match(/Firefox\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
    version = ua.match(/Version\/([\d.]+)/)?.[1] || 'Unknown';
  }

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let device: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) device = 'tablet';
  else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle/i.test(ua)) device = 'mobile';

  return { name, version, os, device };
}

// ---------- Singleton + convenience exports ----------

export const errorTracker = new ErrorTracker();

export const captureException = (error: Error | string, context?: ErrorContext) =>
  errorTracker.captureException(error, context);

export const captureMessage = (message: string, level?: ErrorLevel) =>
  errorTracker.captureMessage(message, level);

export const setUser = (user: { id?: string; email?: string }) =>
  errorTracker.setUser(user);

export const addBreadcrumb = (crumb: Omit<Breadcrumb, 'timestamp'>) =>
  errorTracker.addBreadcrumb(crumb);
