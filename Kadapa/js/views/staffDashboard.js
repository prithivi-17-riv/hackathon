/**
 * View: Staff / Technician Work Order Queue
 */
import { stateManager } from '../state.js';
import { api } from '../api.js';
import { router } from '../router.js';

export function createStaffDashboardView() {
  let statusTab = 'All';

  return {
    async render() {
      const state = stateManager.getState();
      const staffUser = state.currentUser || { id: 'usr_staff_1', name: 'Suresh Kumar', department: 'Electrical & HVAC' };
      
      const res = await api.getComplaints();
      const allComplaints = (res && Array.isArray(res.data)) ? res.data : [];

      // Filter to tickets assigned to this staff member or unassigned in their department
      let myTickets = allComplaints.filter(c => {
        if (!c) return false;
        const assignedId = c.assignedTo && typeof c.assignedTo === 'object' ? c.assignedTo.id : c.assignedTo;
        if (assignedId && (assignedId === staffUser.id || assignedId === staffUser.email)) return true;
        if (!c.assignedTo && c.category) {
          const cat = String(c.category).toLowerCase();
          const dept = String(staffUser.department || '').toLowerCase();
          return cat.includes('electrical') || cat.includes('ac') || cat.includes('hvac') || dept.includes(cat);
        }
        return false;
      });

      if (statusTab === 'Active') {
        myTickets = myTickets.filter(c => c && ((c.status || '') === 'In Progress' || (c.status || '') === 'Assigned'));
      } else if (statusTab === 'Resolved') {
        myTickets = myTickets.filter(c => c && (c.status || '') === 'Resolved');
      }

      const activeCount = myTickets.filter(c => c && (c.status || '') !== 'Resolved').length;
      const totalTickets = allComplaints.length;
      const totalActive = allComplaints.filter(c => c && (c.status || '') !== 'Resolved' && (c.status || '') !== 'Rejected').length;
      const totalResolved = allComplaints.filter(c => c && (c.status || '') === 'Resolved').length;
      const assignedCount = myTickets.length;

      return `
        <div class="page-container" style="max-width: 1040px;">
          <!-- Staff Welcome Header -->
          <div class="card" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: #FFFFFF; margin-bottom: 24px; padding: 24px 28px; border: 1px solid #1E293B;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
              <div>
                <span class="badge badge-resolved" style="background: rgba(5, 150, 105, 0.2); color: #6EE7B7; border-color: rgba(5, 150, 105, 0.4); margin-bottom: 8px;">
                  Staff & Faculty Console
                </span>
                <h1 style="color: #FFFFFF; font-size: 1.75rem; font-weight: 700; margin-bottom: 4px;">Welcome back, ${staffUser.name}</h1>
                <p style="color: #94A3B8; font-size: 0.88rem; margin: 0;">
                  ${staffUser.department} • Active Work Orders Assigned: <strong>${activeCount}</strong>
                </p>
              </div>

              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn btn-primary btn-sm" id="staff-refresh-queue-btn">
                  Refresh Tickets
                </button>
                <button class="btn btn-outline btn-sm btn-signout" data-action="signout" id="staff-signout-btn" style="box-shadow: none; color: #DC2626; border-color: #FECACA; background: #FEF2F2; display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          <!-- 4 Stats Columns: Visible to Teachers & Staff -->
          <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card">
              <div>
                <div class="stat-val">${totalTickets}</div>
                <div class="stat-label">Total Campus Tickets</div>
              </div>
              <div class="stat-icon-wrap">📋</div>
            </div>

            <div class="stat-card">
              <div>
                <div class="stat-val" style="color: #D97706;">${totalActive}</div>
                <div class="stat-label">Active / Under Triage</div>
              </div>
              <div class="stat-icon-wrap" style="background: #FEF3C7; color: #D97706;">⚙️</div>
            </div>

            <div class="stat-card">
              <div>
                <div class="stat-val" style="color: #059669;">${totalResolved}</div>
                <div class="stat-label">Resolved Issues</div>
              </div>
              <div class="stat-icon-wrap" style="background: #ECFDF5; color: #059669;">✓</div>
            </div>

            <div class="stat-card">
              <div>
                <div class="stat-val" style="color: var(--color-primary);">${assignedCount}</div>
                <div class="stat-label">Assigned to You</div>
              </div>
              <div class="stat-icon-wrap" style="background: var(--color-bg-alt); color: var(--color-secondary);">👨‍🔧</div>
            </div>
          </div>

          <!-- Status Filters -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px;" id="staff-status-tabs">
            ${['All', 'Active', 'Resolved'].map(tab => `
              <button class="role-pill-btn ${statusTab === tab ? 'active' : ''}" data-staff-tab="${tab}" style="background: ${statusTab === tab ? 'var(--color-primary)' : '#FFFFFF'}; color: ${statusTab === tab ? '#FFFFFF' : 'var(--color-text-muted)'}; border: 1px solid ${statusTab === tab ? 'var(--color-primary)' : 'var(--color-border)'}; font-size: 0.825rem; padding: 6px 14px;">
                ${tab} Tickets
              </button>
            `).join('')}
          </div>

          <!-- Work Order Cards -->
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${myTickets.length === 0 ? `
              <div class="card" style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 2.2rem; margin-bottom: 8px; color: #059669;">✓</div>
                <h3 style="color: var(--color-secondary); margin-bottom: 6px;">All Assigned Tickets Cleared</h3>
                <p style="color: var(--color-text-muted);">No open work orders pending in your queue.</p>
              </div>
            ` : myTickets.map(ticket => {
              if (!ticket) return '';
              const statusStr = ticket.status || 'Submitted';
              const statusClass = statusStr.toLowerCase().replace(/\s+/g, '-');
              const p = ticket.priorityMetrics || { tier: ticket.priority || 'Medium', badgeClass: 'badge-medium' };
              const tier = p.tier || ticket.priority || 'Medium';
              const badgeClass = p.badgeClass || 'badge-medium';
              const studentName = ticket.submittedBy?.name || 'Student';
              const studentInfo = ticket.submittedBy?.rollNo || ticket.submittedBy?.email || 'Hostel';

              return `
                <div class="card card-hoverable" style="padding: 20px;">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    
                    <div style="flex: 1; min-width: 280px;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                        <span class="badge badge-${statusClass}">● ${statusStr}</span>
                        <span class="badge ${badgeClass}">${tier} Priority</span>
                        <span class="badge badge-category">${ticket.category || 'General'}</span>
                        <span style="font-size: 0.75rem; color: var(--color-text-light); font-weight: 700;">#${ticket.id}</span>
                      </div>

                      <h3 style="font-size: 1.15rem; color: var(--color-secondary); margin-bottom: 6px;">
                        <a href="#/staff/complaints/${ticket.id}" style="color: inherit;">${ticket.title || 'Untitled Work Order'}</a>
                      </h3>

                      <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 10px;">
                        📍 <strong>Location:</strong> ${ticket.location || 'Campus'} (${ticket.specificSpot || 'General'}) • 
                        👤 <strong>Student:</strong> ${studentName} (${studentInfo})
                      </div>

                      <p style="font-size: 0.88rem; color: var(--color-text-main); margin-bottom: 14px; line-height: 1.4;">
                        ${ticket.description || ''}
                      </p>

                      ${ticket.resolutionProof ? `
                        <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.8rem; color: #166534;">
                          ✅ <strong>Resolution Proof:</strong> ${ticket.resolutionProof}
                        </div>
                      ` : ''}
                    </div>

                    <!-- Actions -->
                    <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end; flex-shrink: 0;">
                      <a href="#/staff/complaints/${ticket.id}" class="btn btn-primary btn-sm">
                        Inspect & Resolve →
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
      document.querySelectorAll('[data-staff-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          statusTab = e.currentTarget.getAttribute('data-staff-tab');
          router.handleRoute();
        });
      });

      document.getElementById('staff-refresh-queue-btn')?.addEventListener('click', () => {
        router.handleRoute();
      });
    }
  };
}
