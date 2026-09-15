/**
 * View: Landing & Sign In View
 */
import { stateManager } from '../state.js';
import { router } from '../router.js';

export function createLandingView() {
  return {
    render() {
      return `
        <div class="page-container" style="max-width: 540px; padding-top: 50px;">
          <!-- Hero Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: var(--color-primary-light); color: var(--color-primary); padding: 6px 14px; border-radius: var(--radius-full); font-weight: 800; font-size: 0.85rem; margin-bottom: 16px; border: 1.5px solid var(--color-primary);">
              ⚡ Next-Gen AI Campus Infrastructure
            </div>
            <h1 style="font-size: 2.5rem; color: var(--color-secondary); margin-bottom: 12px; letter-spacing: -0.03em;">
              Welcome to <span style="color: var(--color-primary);">CampusCare</span>
            </h1>
            <p style="font-size: 1rem; color: var(--color-text-muted); max-width: 480px; margin: 0 auto;">
              Smart complaint tracking, instant AI duplicate detection, and automated technician dispatch for campus facilities.
            </p>
          </div>

          <!-- Standard Login Form -->
          <div class="card card-chunky">
            <h3 style="font-size: 1.25rem; margin-bottom: 20px; text-align: center; color: var(--color-secondary);">Sign In to Your Account</h3>
            
            <div id="login-error-banner" style="display: none; background: #FEE2E2; border: 1.5px solid #FCA5A5; color: #991B1B; padding: 12px 14px; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; margin-bottom: 16px;"></div>

            <form id="custom-login-form">
              <div class="form-group">
                <label class="form-label">Campus Email <span class="required">*</span></label>
                <input type="email" id="login-email" class="form-control" placeholder="your.name@campus.edu" required>
              </div>
              <div class="form-group">
                <label class="form-label">Password <span class="required">*</span></label>
                <input type="password" id="login-pass" class="form-control" placeholder="Enter your password" required>
              </div>
              <button type="submit" id="login-submit-btn" class="btn btn-primary w-full" style="margin-top: 10px;">Sign In</button>
              <div style="text-align: center; margin-top: 18px; font-size: 0.875rem; color: var(--color-text-muted);">
                Don't have an account? <a href="#/signup" style="font-weight: 700;">Sign up here</a>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    onMount() {
      document.getElementById('custom-login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('login-submit-btn');
        const errorBanner = document.getElementById('login-error-banner');

        if (errorBanner) errorBanner.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '⏳ Signing In...';
        }

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-pass').value;

        try {
          await stateManager.signIn({ email, password });
          const user = stateManager.getState().currentUser;

          if (user?.role === 'admin') router.navigate('/admin');
          else if (user?.role === 'staff') router.navigate('/staff');
          else router.navigate('/dashboard');
        } catch (err) {
          console.error('Supabase sign-in error:', err);
          if (errorBanner) {
            errorBanner.innerText = `⚠️ Sign In Error: ${err.message || 'Invalid email or password.'}`;
            errorBanner.style.display = 'block';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Sign In';
          }
        }
      });
    }
  };
}
