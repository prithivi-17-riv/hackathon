/**
 * View: Student Dashboard
 */
import { stateManager } from '../state.js';
import { api } from '../api.js';
import { router } from '../router.js';

export function createDashboardView() {
  let activeTab = 'All';
  let searchQuery = '';

  return {
    async render() {
      const state = stateManager.getState();
      const user = state.currentUser || { name: 'Student', hostel: 'Campus Student' };
      const res = await api.getComplaints();
      const complaints = res.data || [];

      const myComplaints = complaints.filter(c => c.submittedBy?.email === user.email);
      const activeCount = complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Rejected').length;
      const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

      // Filter complaints based on activeTab & search
      let filtered = [...complaints];
      if (activeTab === 'My Complaints') {
        filtered = filtered.filter(c => c.submittedBy?.email === user.email);
      } else if (activeTab === 'In Progress') {
        filtered = filtered.filter(c => c.status === 'In Progress' || c.status === 'Assigned');
      } else if (activeTab === 'Resolved') {
        filtered = filtered.filter(c => c.status === 'Resolved');
      } else if (activeTab === 'Critical') {
        filtered = filtered.filter(c => c.priority === 'Critical');
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(c => 
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }

      return `
        <div class="page-container">
          <!-- Welcome Banner & Quick Action CTA -->
          <div class="card card-chunky" style="background: linear-gradient(135deg, #1E1B4B 0%, #2E2875 100%); color: #FFFFFF; margin-bottom: 28px; padding: 30px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
              <div>
                <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(212, 255, 0, 0.15); color: var(--color-accent); padding: 4px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 800; margin-bottom: 8px;">
                  👋 Logged in as ${user.name} (${user.hostel || 'Campus Student'})
                </div>
                <h1 style="color: #FFFFFF; font-size: 2.1rem; margin-bottom: 6px;">Campus Infrastructure Desk</h1>
                <p style="color: #CBD5E1; font-size: 0.95rem; max-width: 540px;">
                  Notice a broken facility, Wi-Fi failure, or plumbing leak? Report it in seconds or upvote existing tickets for faster resolution.
                </p>
              </div>

              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <a href="#/complaints/new" class="btn btn-accent btn-lg" style="box-shadow: 0 5px 0 #85A300;">
                  <span>➕</span> Report an Issue
                </a>
                <a href="#/chatbot" class="btn btn-outline btn-lg" style="background: rgba(255,255,255,0.1); color: #FFFFFF; border-color: rgba(255,255,255,0.3); box-shadow: none;">
                  <span>🤖</span> Ask CareBot
                </a>
              </div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div>
                <div class="stat-val">${complaints.length}</div>
                <div class="stat-label">Total Campus Tickets</div>
              </div>
              <div class="stat-icon-wrap" style="background: var(--color-primary-light); color: var(--color-primary);">📋</div>
            </div>

            <div class="stat-card">
              <div>
                <div class="stat-val" style="color: #D97706;">${activeCount}</div>
                <div class="stat-label">Active / Under Triage</div>
              </div>
              <div class="stat-icon-wrap" style="background: #FEF3C7; color: #D97706;">⚙️</div>
            </div>

            <div class="stat-card">
              <div>
                <div class="stat-val" style="color: #059669;">${resolvedCount}</div>
                <div class="stat-label">Resolved Issues</div>
              </div>
              <div class="stat-icon-wrap" style="background: #D1FAE5; color: #059669;">✅</div>
            </div>

            <div class="stat-card">
              <div>
                <div class="stat-val" style="color: var(--color-primary);">${myComplaints.length}</div>
                <div class="stat-label">Submitted by You</div>
              </div>
              <div class="stat-icon-wrap" style="background: var(--color-bg-alt); color: var(--color-secondary);">👤</div>
            </div>
          </div>

          <!-- Filter Pills & Search Bar -->
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="tab-filters-container">
              ${['All', 'My Complaints', 'In Progress', 'Resolved', 'Critical'].map(tab => `
                <button class="role-pill-btn ${activeTab === tab ? 'active' : ''}" data-tab="${tab}" style="font-size: 0.85rem; padding: 6px 14px; background: ${activeTab === tab ? 'var(--color-secondary)' : '#FFFFFF'}; color: ${activeTab === tab ? '#FFFFFF' : 'var(--color-secondary)'}; border: 1.5px solid var(--color-border);">
                  ${tab}
                </button>
              `).join('')}
            </div>

            <div style="position: relative; min-width: 260px;">
              <input type="text" id="dashboard-search-input" class="form-control" placeholder="🔍 Search tickets, location..." value="${searchQuery}" style="padding-left: 14px;">
            </div>
          </div>

          <!-- Complaints Feed List -->
          <div style="display: flex; flex-direction: column; gap: 16px;" id="complaints-list-feed">
            ${filtered.length === 0 ? `
              <div class="card" style="text-align: center; padding: 48px 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">🔍</div>
                <h3 style="color: var(--color-secondary); margin-bottom: 6px;">No complaints match this filter</h3>
                <p style="color: var(--color-text-muted); margin-bottom: 16px;">Try switching tabs or report a new infrastructure issue.</p>
                <a href="#/complaints/new" class="btn btn-primary btn-sm">Report New Issue</a>
              </div>
            ` : filtered.map(c => {
              const hasUpvoted = c.upvotedBy && c.upvotedBy.includes(user.id);
              const statusClass = c.status.toLowerCase().replace(/\s+/g, '-');
              const priorityClass = c.priority.toLowerCase();

              return `
                <div class="card card-hoverable" style="border: 2px solid var(--color-border); padding: 20px;" data-complaint-id="${c.id}">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 260px;">
                      <!-- Header Badges -->
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                        <span class="badge badge-${statusClass}">● ${c.status}</span>
                        <span class="badge badge-${priorityClass}">${c.priority} Priority</span>
                        <span class="badge badge-category">${c.category}</span>
                        <span style="font-size: 0.75rem; color: var(--color-text-light); font-weight: 700;">#${c.id}</span>
                      </div>

                      <!-- Title & Location -->
                      <h3 style="font-size: 1.15rem; color: var(--color-secondary); margin-bottom: 6px;">
                        <a href="#/complaints/${c.id}" style="color: inherit; text-decoration: none;">${c.title}</a>
                      </h3>
                      
                      <div style="display: flex; align-items: center; gap: 12px; font-size: 0.825rem; color: var(--color-text-muted); margin-bottom: 12px; flex-wrap: wrap;">
                        <span>📍 <strong>${c.location}</strong> ${c.specificSpot ? `• ${c.specificSpot}` : ''}</span>
                        <span>🕒 Logged ${new Date(c.createdAt).toLocaleDateString()}</span>
                        ${c.assignedTo ? `<span style="color: #4F46E5;">👨‍🔧 Assigned: ${c.assignedTo.name}</span>` : ''}
                      </div>

                      <p style="font-size: 0.88rem; color: var(--color-text-main); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 14px;">
                        ${c.description}
                      </p>
                    </div>

                    <!-- Right Column: Upvote & Detail Action -->
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px; flex-shrink: 0;">
                      <button class="upvote-btn ${hasUpvoted ? 'upvoted' : ''}" data-upvote-id="${c.id}">
                        <span>▲</span>
                        <span class="upvote-count">${c.upvotes || 0}</span>
                        <span>${hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                      </button>

                      <a href="#/complaints/${c.id}" class="btn btn-outline btn-sm">
                        Track Status →
                      </a>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    },

    onMount() {
      // Tab Filters
      document.querySelectorAll('#tab-filters-container button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          activeTab = e.currentTarget.getAttribute('data-tab');
          router.handleRoute();
        });
      });

      // Search Handler
      const searchInput = document.getElementById('dashboard-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          searchQuery = e.target.value;
          // Re-render complaints list without full page reload
          const feed = document.getElementById('complaints-list-feed');
          if (feed) {
            router.handleRoute();
          }
        });
      }

      // Upvote Action Handlers
      document.querySelectorAll('[data-upvote-id]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const complaintId = e.currentTarget.getAttribute('data-upvote-id');
          await api.upvoteComplaint(complaintId);
          router.handleRoute();
        });
      });
    }
  };
}
