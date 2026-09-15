/**
 * CampusCare Main Application Bootstrapper
 * Connects Router, Views, Global Reactive State, Floating Mascot, and Toast System
 */
import { stateManager } from './state.js';
import { router } from './router.js';

// Import Views
import { createLandingView } from './views/landing.js';
import { createSignupView } from './views/signup.js';
import { createDashboardView } from './views/dashboard.js';
import { createNewComplaintView } from './views/newComplaint.js';
import { createComplaintDetailView } from './views/complaintDetail.js';
import { createChatbotView } from './views/chatbot.js';
import { createAdminDashboardView } from './views/adminDashboard.js';
import { createAdminAnalyticsView } from './views/adminAnalytics.js';
import { createAdminComplaintDetailView } from './views/adminComplaintDetail.js';
import { createStaffDashboardView } from './views/staffDashboard.js';
import { createStaffComplaintDetailView } from './views/staffComplaintDetail.js';

class App {
  constructor() {
    this.initToastSystem();
    this.initEmailListener();
    this.registerRoutes();
    this.renderShell();
  }

  registerRoutes() {
    // Public / Auth
    router.register('', createLandingView, { allowedRoles: ['guest', 'student', 'admin', 'staff'], title: 'Welcome' });
    router.register('login', createLandingView, { allowedRoles: ['guest', 'student', 'admin', 'staff'], title: 'Sign In' });
    router.register('signup', createSignupView, { allowedRoles: ['guest', 'student'], title: 'Student Sign Up' });

    // Student Routes
    router.register('dashboard', createDashboardView, { allowedRoles: ['student'], title: 'Student Dashboard' });
    router.register('complaints/new', createNewComplaintView, { allowedRoles: ['student'], title: 'Report Issue' });
    router.register('complaints/:id', (params) => createComplaintDetailView(params), { allowedRoles: ['student', 'admin', 'staff'], title: 'Ticket Tracking' });
    router.register('chatbot', createChatbotView, { allowedRoles: ['student'], title: 'CareBot AI Assistant' });

    // Admin Routes
    router.register('admin', createAdminDashboardView, { allowedRoles: ['admin'], title: 'Admin AI Queue' });
    router.register('admin/analytics', createAdminAnalyticsView, { allowedRoles: ['admin'], title: 'Predictive Analytics' });
    router.register('admin/complaints/:id', (params) => createAdminComplaintDetailView(params), { allowedRoles: ['admin'], title: 'Admin Ticket Triage' });

    // Staff Routes
    router.register('staff', createStaffDashboardView, { allowedRoles: ['staff'], title: 'Staff Field Queue' });
    router.register('staff/complaints/:id', (params) => createStaffComplaintDetailView(params), { allowedRoles: ['staff'], title: 'Staff Resolution Workbench' });
  }

  renderShell() {
    const state = stateManager.getState();
    const user = state.currentUser;
    const role = state.currentRole;

    const appRoot = document.getElementById('app');
    if (!appRoot) return;

    appRoot.innerHTML = `
      <!-- 1. Student Top Navbar (Visible on Student & Public pages) -->
      ${role === 'student' ? `
        <nav class="top-navbar">
          <a href="#/dashboard" class="brand-logo">
            <div class="brand-icon">⚡</div>
            <span class="brand-title">Campus<span>Care</span></span>
          </a>

          <ul class="nav-links">
            <li><a href="#/dashboard" class="nav-link-item" data-route="/dashboard">📋 Dashboard</a></li>
            <li><a href="#/complaints/new" class="nav-link-item" data-route="/complaints/new">➕ Report Issue</a></li>
            <li><a href="#/chatbot" class="nav-link-item" data-route="/chatbot">🤖 CareBot AI</a></li>
          </ul>

          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="user-profile-badge">
              <div class="user-avatar-circle">${user ? user.avatar : 'AS'}</div>
              <span>${user ? user.name : 'Student'}</span>
            </div>
            <button id="signout-btn" class="btn btn-outline btn-sm" style="box-shadow: none; font-size: 0.8rem; padding: 4px 10px;">🚪 Sign Out</button>
          </div>
        </nav>
      ` : ''}

      <!-- 3. Dynamic Page View Container -->
      <main id="main-content" style="flex: 1; display: flex; flex-direction: column;"></main>

      <!-- 4. Mobile Bottom Navigation (Students) -->
      ${role === 'student' ? `
        <nav class="mobile-bottom-nav">
          <ul class="mobile-nav-items">
            <li>
              <a href="#/dashboard" class="mobile-nav-link" data-route="/dashboard">
                <span class="icon">📋</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#/complaints/new" class="mobile-nav-link" data-route="/complaints/new">
                <span class="icon">➕</span>
                <span>Report</span>
              </a>
            </li>
            <li>
              <a href="#/chatbot" class="mobile-nav-link" data-route="/chatbot">
                <span class="icon">🤖</span>
                <span>CareBot</span>
              </a>
            </li>
          </ul>
        </nav>
      ` : ''}

      <!-- 5. Floating CareBot Mascot Button (Student Pages) -->
      <a href="#/chatbot" id="floating-carebot-btn" class="floating-bot-btn" title="Chat with CareBot AI">
        <div class="bot-pulse-ring"></div>
        <div class="bot-avatar">🤖</div>
        <span>Ask CareBot</span>
      </a>

      <!-- 6. Global Toast Notifications Queue -->
      <div id="toast-container"></div>
    `;

    // Bind sign-out button
    document.getElementById('signout-btn')?.addEventListener('click', async () => {
      await stateManager.signOut();
      this.renderShell();
      router.navigate('/login');
    });
  }

  initToastSystem() {
    window.addEventListener('campuscare-toast', (e) => {
      this.showToast(e.detail);
    });
  }

  initEmailListener() {
    // Listen for simulated email dispatches and surface as a specialized email toast
    window.addEventListener('campuscare-email-sent', (e) => {
      const { to, subject, message } = e.detail;
      this.showToast({
        type: 'email',
        title: '📧 Simulated Email Dispatched',
        message: `To: ${to} | ${subject} — ${message.substring(0, 45)}...`,
        duration: 5000
      });
    });
  }

  showToast({ type = 'success', title, message, duration = 4000 }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '🔔';
    if (type === 'email') icon = '📧';
    else if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'error') icon = '❌';

    toast.innerHTML = `
      <div style="font-size: 1.3rem;">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" title="Dismiss">✕</button>
      <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// Reliable Bootstrap on DOM ready or immediate if already interactive
function bootstrapApp() {
  try {
    new App();
    router.handleRoute();

    // Subscribe to state updates to update shell if role changes
    stateManager.subscribe(() => {
      // Reactively refresh active views
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    const appRoot = document.getElementById('app');
    if (appRoot) {
      appRoot.innerHTML = `
        <div style="padding: 40px; text-align: center; font-family: system-ui, sans-serif;">
          <h2 style="color: #DC2626; margin-bottom: 8px;">Initialization Error</h2>
          <p style="color: #64607D; margin-bottom: 16px;">${err.message || 'Failed to start CampusCare application.'}</p>
          <button onclick="localStorage.clear(); window.location.reload();" style="padding: 10px 20px; background: #FF5733; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
            🔄 Clear Cache & Reload
          </button>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

