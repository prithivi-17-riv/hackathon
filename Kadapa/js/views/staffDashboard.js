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
      const allComplaints = res.data;

      // Filter to tickets assigned to this staff member or unassigned in their department
      let myTickets = allComplaints.filter(c => {
        if (c.assignedTo && c.assignedTo.id === staffUser.id) return true;
        if (!c.assignedTo && c.category) {
          return c.category.includes('Electrical') || c.category.includes('AC') || c.category.includes('HVAC');
        }
        return false;
      });

      if (statusTab === 'Active') {
        myTickets = myTickets.filter(c => c.status === 'In Progress' || c.status === 'Assigned');
      } else if (statusTab === 'Resolved') {
        myTickets = myTickets.filter(c => c.status === 'Resolved');
      }

      const activeCount = myTickets.filter(c => c.status !== 'Resolved').length;

      return `
        <div class="page-container" style="max-width: 1040px;">
          <!-- Staff Welcome Header -->
          <div class="card card-chunky" style="background: linear-gradient(135deg, #064E3B 0%, #047857 100%); color: #FFFFFF; margin-bottom: 24px; padding: 24px 28px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
              <div>
                <span class="badge badge-resolved" style="background: rgba(255,255,255,0.2); color: #FFFFFF; border-color: rgba(255,255,255,0.4); margin-bottom: 8px;">
                  🔧 Field Technician Console
                </span>
                <h1 style="color: #FFFFFF; font-size: 1.8rem; margin-bottom: 4px;">Welcome back, ${staffUser.name}</h1>
                <p style="color: #A7F3D0; font-size: 0.88rem; margin: 0;">
                  ${staffUser.department} • Active Work Orders Assigned: <strong>${activeCount}</strong>
                </p>
              </div>

              <div style="display: flex; gap: 8px;">
                <button class="btn btn-accent btn-sm" id="staff-refresh-queue-btn">
                  🔄 Refresh Tickets
                </button>
              </div>
            </div>
          </div>

          <!-- Status Filters -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px;" id="staff-status-tabs">
            ${['All', 'Active', 'Resolved'].map(tab => `
              <button class="role-pill-btn ${statusTab === tab ? 'active' : ''}" data-staff-tab="${tab}" style="background: ${statusTab === tab ? 'var(--color-secondary)' : '#FFFFFF'}; color: ${statusTab === tab ? '#FFFFFF' : 'var(--color-secondary)'}; border: 1.5px solid var(--color-border); font-size: 0.85rem; padding: 6px 14px;">
                ${tab} Tickets
              </button>
            `).join('')}
          </div>

          <!-- Work Order Cards -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${myTickets.length === 0 ? `
              <div class="card" style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">🎉</div>
                <h3 style="color: var(--color-secondary); margin-bottom: 6px;">All Assigned Tickets Cleared!</h3>
                <p style="color: var(--color-text-muted);">No open work orders pending in your queue.</p>
              </div>
            ` : myTickets.map(ticket => {
              const statusClass = ticket.status.toLowerCase().replace(/\s+/g, '-');

              return `
                <div class="card card-hoverable" style="border: 2px solid var(--color-border); padding: 20px;">
                  <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
                    
                    <div style="flex: 1; min-width: 280px;">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                        <span class="badge badge-${statusClass}">● ${ticket.status}</span>
                        <span class="badge ${ticket.priorityMetrics.badgeClass}">${ticket.priorityMetrics.tier} Priority</span>
                        <span class="badge badge-category">${ticket.category}</span>
                        <span style="font-size: 0.75rem; color: var(--color-text-light); font-weight: 700;">#${ticket.id}</span>
                      </div>

                      <h3 style="font-size: 1.15rem; color: var(--color-secondary); margin-bottom: 6px;">
                        <a href="#/staff/complaints/${ticket.id}" style="color: inherit;">${ticket.title}</a>
                      </h3>

                      <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 10px;">
                        📍 <strong>Location:</strong> ${ticket.location} (${ticket.specificSpot || 'General'}) • 
                        👤 <strong>Student:</strong> ${ticket.submittedBy?.name} (${ticket.submittedBy?.rollNo || 'Hostel'})
                      </div>

                      <p style="font-size: 0.88rem; color: var(--color-text-main); margin-bottom: 14px; line-height: 1.4;">
                        ${ticket.description}
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
