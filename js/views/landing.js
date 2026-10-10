/**
 * View: Landing & Sign In View
 */
import { stateManager } from '../state.js';
import { router } from '../router.js';

export function createLandingView() {
  return {
    render() {
      return `
        <div class="page-container" style="max-width: 480px; padding-top: 60px;">
          <!-- Hero Header -->
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-flex; align-items: center; gap: 6px; background: var(--color-primary-light); color: var(--color-primary); padding: 5px 14px; border-radius: var(--radius-full); font-weight: 600; font-size: 0.8rem; margin-bottom: 14px; border: 1px solid rgba(37, 99, 235, 0.2);">
              Campus Operations & Facilities Management
            </div>
            <h1 style="font-size: 2.1rem; font-weight: 700; color: var(--color-secondary); margin-bottom: 8px; letter-spacing: -0.02em;">
              Sign In to <span style="color: var(--color-primary);">UniVerse</span>
            </h1>
            <p style="font-size: 0.925rem; color: var(--color-text-muted); max-width: 420px; margin: 0 auto;">
              Centralized complaint tracking, intelligent duplicate resolution, and dispatch workflow.
            </p>
          </div>

          <!-- Standard Login Form -->
          <div class="card" style="padding: 28px; border: 1px solid var(--color-border); box-shadow: var(--shadow-card);">
            <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 18px; text-align: center; color: var(--color-secondary);">Account Sign In</h3>
            
            <div id="login-error-banner" style="display: none; background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; padding: 10px 14px; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 500; margin-bottom: 16px;"></div>

            <form id="custom-login-form">
              <div class="form-group">
                <label class="form-label">Campus Email <span class="required">*</span></label>
                <input type="email" id="login-email" class="form-control" placeholder="name@campus.edu" required>
              </div>
              <div class="form-group">
                <label class="form-label">Password <span class="required">*</span></label>
                <input type="password" id="login-pass" class="form-control" placeholder="Enter your password" required>
              </div>
              <button type="submit" id="login-submit-btn" class="btn btn-primary w-full" style="margin-top: 8px;">Sign In</button>
              <div style="text-align: center; margin-top: 16px; font-size: 0.85rem; color: var(--color-text-muted);">
                Don't have an account? <a href="#/signup" style="font-weight: 600;">Register as Student</a>
              </div>

              <!-- Quick Demo Access for Hackathon Judges & Evaluators -->
              <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); text-align: center;">
                <div style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
                  ⚡ Quick Demo Portals
                </div>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
                  <button type="button" class="btn btn-outline btn-sm quick-demo-btn" data-demo-role="student" style="font-size: 0.78rem; padding: 5px 10px;">
                    🎓 Student
                  </button>
                  <button type="button" class="btn btn-outline btn-sm quick-demo-btn" data-demo-role="staff" style="font-size: 0.78rem; padding: 5px 10px;">
                    👨‍🔧 Staff
                  </button>
                  <button type="button" class="btn btn-outline btn-sm quick-demo-btn" data-demo-role="admin" style="font-size: 0.78rem; padding: 5px 10px;">
                    🏛️ Admin
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    onMount() {
      // Quick Demo Switcher
      document.querySelectorAll('.quick-demo-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const role = e.currentTarget.getAttribute('data-demo-role');
          const state = stateManager.getState();
          const target = (state.users || []).find(u => u.role === role) || {
            role,
            name: role === 'admin' ? 'Dr. Ramesh Patel' : (role === 'staff' ? 'Suresh Kumar' : 'Aarav Sharma'),
            email: role === 'admin' ? 'warden.cauvery@campus.edu' : (role === 'staff' ? 'suresh.maintenance@campus.edu' : 'aarav.sharma@campus.edu'),
            id: role === 'admin' ? 'usr_admin_1' : (role === 'staff' ? 'usr_staff_1' : 'usr_student_1')
          };
          stateManager.setCurrentUser(target);
          if (window.__universe_app) {
            window.__universe_app.renderShell();
          }
          if (role === 'admin') router.navigate('/admin');
          else if (role === 'staff') router.navigate('/staff');
          else router.navigate('/dashboard');
        });
      });

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

          if (window.__universe_app) {
            window.__universe_app.renderShell();
          }

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
