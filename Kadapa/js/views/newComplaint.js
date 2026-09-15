/**
 * View: New Complaint Submission with AI Duplication Detection
 */
import { CATEGORIES, CAMPUS_LOCATIONS } from '../mockData.js';
import { api } from '../api.js';
import { router } from '../router.js';

export function createNewComplaintView() {
  let selectedCategory = CATEGORIES[0];
  let selectedLocation = CAMPUS_LOCATIONS[0];
  let inputMode = 'text'; // 'text' | 'photo' | 'voice'
  let isRecording = false;
  let voiceRecorded = false;
  let uploadedPhotoPreview = null;
  let duplicateMatches = [];

  return {
    render() {
      return `
        <div class="page-container" style="max-width: 820px;">
          <!-- Breadcrumbs -->
          <div class="breadcrumbs">
            <a href="#/dashboard">Dashboard</a>
            <span class="separator">/</span>
            <span class="current">New Complaint</span>
          </div>

          <div class="page-header" style="margin-bottom: 20px;">
            <div>
              <h1 class="page-title">Report a Campus Issue</h1>
              <p class="page-subtitle">AI-assisted categorization, triage, and duplicate prevention</p>
            </div>
            <a href="#/dashboard" class="btn btn-outline btn-sm">← Back to Dashboard</a>
          </div>

          <!-- Main Submission Form Card -->
          <div class="card card-chunky">
            <form id="new-complaint-form">
              
              <!-- 1. Category Selection Tiles -->
              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label">
                  <span>1. Select Issue Category <span class="required">*</span></span>
                  <span style="font-size: 0.8rem; color: var(--color-text-muted); font-weight: 500;">Dispatches to ${selectedCategory.department}</span>
                </label>
                <div class="category-grid" id="category-tiles-grid">
                  ${CATEGORIES.map(cat => `
                    <div class="category-tile ${selectedCategory.id === cat.id ? 'active' : ''}" data-cat-id="${cat.id}">
                      <div class="cat-icon">${cat.icon}</div>
                      <div class="cat-label">${cat.name}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 2. Location & Zone Picker -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div class="form-group">
                  <label class="form-label">Campus Zone / Building <span class="required">*</span></label>
                  <select id="complaint-location-select" class="form-control" required>
                    ${CAMPUS_LOCATIONS.map(loc => `
                      <option value="${loc}" ${selectedLocation === loc ? 'selected' : ''}>${loc}</option>
                    `).join('')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Specific Room / Landmark</label>
                  <input type="text" id="complaint-spot-input" class="form-control" placeholder="e.g. Room B-312, 2nd Floor Corridor, Washroom 4">
                </div>
              </div>

              <!-- LIVE AI DUPLICATE DETECTION BANNER -->
              <div id="duplicate-warning-container">
                <!-- Dynamically injected when duplicates detected -->
              </div>

              <!-- 3. Title -->
              <div class="form-group">
                <label class="form-label">Issue Summary / Title <span class="required">*</span></label>
                <input type="text" id="complaint-title-input" class="form-control" placeholder="e.g. Broken AC compressor unit blowing hot air" required>
              </div>

              <!-- 4. Multi-Modal Input Tabs (Text / Photo / Voice) -->
              <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 8px; border-bottom: 2px solid var(--color-border); padding-bottom: 8px; margin-bottom: 14px;">
                  <button type="button" class="role-pill-btn ${inputMode === 'text' ? 'active' : ''}" data-mode="text" style="background: ${inputMode === 'text' ? 'var(--color-secondary)' : '#FFFFFF'}; color: ${inputMode === 'text' ? '#FFFFFF' : 'var(--color-secondary)'}; border: 1.5px solid var(--color-border);">
                    📝 Detailed Text
                  </button>
                  <button type="button" class="role-pill-btn ${inputMode === 'photo' ? 'active' : ''}" data-mode="photo" style="background: ${inputMode === 'photo' ? 'var(--color-secondary)' : '#FFFFFF'}; color: ${inputMode === 'photo' ? '#FFFFFF' : 'var(--color-secondary)'}; border: 1.5px solid var(--color-border);">
                    📷 Photo Attachment
                  </button>
                  <button type="button" class="role-pill-btn ${inputMode === 'voice' ? 'active' : ''}" data-mode="voice" style="background: ${inputMode === 'voice' ? 'var(--color-secondary)' : '#FFFFFF'}; color: ${inputMode === 'voice' ? '#FFFFFF' : 'var(--color-secondary)'}; border: 1.5px solid var(--color-border);">
                    🎙️ Voice Note (Mock)
                  </button>
                </div>

                <!-- Textarea Tab -->
                <div id="tab-text-content" style="display: ${inputMode === 'text' ? 'block' : 'none'};">
                  <div class="form-group">
                    <label class="form-label">Full Description <span class="required">*</span></label>
                    <textarea id="complaint-desc-input" class="form-control" placeholder="Describe the problem, since when it started, and impact on students..." required></textarea>
                  </div>
                </div>

                <!-- Photo Tab -->
                <div id="tab-photo-content" style="display: ${inputMode === 'photo' ? 'block' : 'none'};">
                  <div style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: 24px; text-align: center; background: var(--color-bg-alt);">
                    <div style="font-size: 2rem; margin-bottom: 8px;">📸</div>
                    <h4 style="color: var(--color-secondary); margin-bottom: 4px;">Upload Damage / Fault Photo</h4>
                    <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 12px;">Supports JPG, PNG (Max 10MB)</p>
                    <input type="file" id="photo-file-input" accept="image/*" style="display: none;">
                    <button type="button" class="btn btn-outline btn-sm" id="trigger-photo-upload-btn">Browse Photo</button>
                    
                    <div id="photo-preview-container" style="margin-top: 14px; display: none;">
                      <img id="photo-preview-img" src="" style="max-height: 160px; border-radius: var(--radius-md); border: 2px solid var(--color-secondary); box-shadow: var(--shadow-card);" alt="Attachment Preview">
                      <div style="margin-top: 6px;">
                        <button type="button" class="btn btn-danger btn-sm" id="remove-photo-btn" style="padding: 2px 8px; font-size: 0.75rem;">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Voice Note Tab -->
                <div id="tab-voice-content" style="display: ${inputMode === 'voice' ? 'block' : 'none'};">
                  <div style="border: 2px solid var(--color-border); border-radius: var(--radius-md); padding: 20px; background: var(--color-bg-alt); text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🎙️</div>
                    <h4 style="color: var(--color-secondary); margin-bottom: 4px;">Record Voice Complaint</h4>
                    <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 14px;">Speak clearly for automated AI speech-to-text transcription</p>
                    
                    <button type="button" class="btn ${isRecording ? 'btn-danger' : 'btn-primary'}" id="toggle-record-btn">
                      ${isRecording ? '⏹️ Stop Recording (0:14)' : (voiceRecorded ? '🔄 Re-record Audio Note' : '🔴 Start Voice Recording')}
                    </button>
                    
                    <div id="voice-status-note" style="margin-top: 10px; font-size: 0.85rem; font-weight: 700; color: ${voiceRecorded ? '#059669' : 'var(--color-text-muted)'};">
                      ${voiceRecorded ? '✅ Voice note captured! AI summary will be appended.' : 'Click record to start speaking'}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Emergency / Safety Hazard Checkbox -->
              <div style="background: #FEF2F2; border: 1.5px solid #FCA5A5; border-radius: var(--radius-md); padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
                <input type="checkbox" id="emergency-toggle" style="width: 18px; height: 18px; accent-color: #DC2626; cursor: pointer;">
                <div>
                  <label for="emergency-toggle" style="font-weight: 700; font-size: 0.9rem; color: #991B1B; cursor: pointer;">
                    🚨 Flag as Urgent Safety / Hazard Emergency
                  </label>
                  <p style="font-size: 0.775rem; color: #7F1D1D; margin: 0;">Applies maximum priority weighting to alert facility duty officers immediately.</p>
                </div>
              </div>

              <!-- Submit Buttons -->
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
                <a href="#/dashboard" class="btn btn-outline">Cancel</a>
                <button type="submit" id="submit-complaint-btn" class="btn btn-primary btn-lg" style="box-shadow: 0 5px 0 #C83818;">
                  🚀 Submit & Queue for Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    onMount() {
      const checkDuplicates = async () => {
        const titleVal = document.getElementById('complaint-title-input')?.value || '';
        const res = await api.findDuplicates(selectedCategory.id, selectedLocation, titleVal);
        const container = document.getElementById('duplicate-warning-container');
        if (!container) return;

        if (res.duplicates && res.duplicates.length > 0) {
          duplicateMatches = res.duplicates;
          container.innerHTML = `
            <div class="duplicate-banner">
              <div class="duplicate-banner-header">
                <span>⚡ AI Duplicate Detection:</span>
                <span>${res.duplicates.length} Similar Open Issue(s) Found Nearby</span>
              </div>
              <p style="font-size: 0.85rem; color: #7C2D12; margin: 0;">
                Students have already logged a similar issue in this location. To speed up repair, you can upvote the existing ticket instead of creating a duplicate.
              </p>
              
              ${res.duplicates.map(d => `
                <div class="duplicate-item">
                  <div class="duplicate-item-info">
                    <div class="duplicate-item-title">#${d.id}: ${d.title}</div>
                    <div class="duplicate-item-meta">📍 ${d.location} • Status: <strong style="color: var(--color-primary);">${d.status}</strong> • Upvotes: ${d.upvotes || 0}</div>
                  </div>
                  <button type="button" class="btn btn-accent btn-sm" data-upvote-instead-id="${d.id}" style="box-shadow: 0 3px 0 #85A300;">
                    ▲ Upvote Instead (+1)
                  </button>
                </div>
              `).join('')}
            </div>
          `;

          // Attach click listeners for "Upvote Instead"
          container.querySelectorAll('[data-upvote-instead-id]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const targetId = e.currentTarget.getAttribute('data-upvote-instead-id');
              await api.upvoteComplaint(targetId);

              window.dispatchEvent(new CustomEvent('campuscare-toast', {
                detail: {
                  type: 'success',
                  title: 'Upvoted Existing Ticket!',
                  message: `Skipped duplicate ticket. Upvoted #${targetId} to increase priority.`
                }
              }));

              router.navigate(`/complaints/${targetId}`);
            });
          });

        } else {
          duplicateMatches = [];
          container.innerHTML = '';
        }
      };

      // Category Tile Click Handlers
      document.querySelectorAll('#category-tiles-grid .category-tile').forEach(tile => {
        tile.addEventListener('click', (e) => {
          const catId = e.currentTarget.getAttribute('data-cat-id');
          selectedCategory = CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
          
          document.querySelectorAll('#category-tiles-grid .category-tile').forEach(t => t.classList.remove('active'));
          e.currentTarget.classList.add('active');
          checkDuplicates();
        });
      });

      // Location Select Handler
      const locSelect = document.getElementById('complaint-location-select');
      if (locSelect) {
        locSelect.addEventListener('change', (e) => {
          selectedLocation = e.target.value;
          checkDuplicates();
        });
      }

      // Title input duplicate checker
      const titleInput = document.getElementById('complaint-title-input');
      if (titleInput) {
        titleInput.addEventListener('input', () => {
          checkDuplicates();
        });
      }

      // Input Mode Switchers (Text / Photo / Voice)
      document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          inputMode = e.currentTarget.getAttribute('data-mode');
          document.getElementById('tab-text-content').style.display = inputMode === 'text' ? 'block' : 'none';
          document.getElementById('tab-photo-content').style.display = inputMode === 'photo' ? 'block' : 'none';
          document.getElementById('tab-voice-content').style.display = inputMode === 'voice' ? 'block' : 'none';
          
          document.querySelectorAll('[data-mode]').forEach(b => {
            b.classList.remove('active');
            b.style.background = '#FFFFFF';
            b.style.color = 'var(--color-secondary)';
          });
          e.currentTarget.classList.add('active');
          e.currentTarget.style.background = 'var(--color-secondary)';
          e.currentTarget.style.color = '#FFFFFF';
        });
      });

      // Photo upload mock
      const photoFileInput = document.getElementById('photo-file-input');
      const triggerPhotoBtn = document.getElementById('trigger-photo-upload-btn');
      const previewContainer = document.getElementById('photo-preview-container');
      const previewImg = document.getElementById('photo-preview-img');
      const removePhotoBtn = document.getElementById('remove-photo-btn');

      triggerPhotoBtn?.addEventListener('click', () => photoFileInput?.click());
      
      photoFileInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            uploadedPhotoPreview = evt.target.result;
            previewImg.src = uploadedPhotoPreview;
            previewContainer.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });

      removePhotoBtn?.addEventListener('click', () => {
        uploadedPhotoPreview = null;
        if (photoFileInput) photoFileInput.value = '';
        previewContainer.style.display = 'none';
      });

      // Voice note simulation
      const recordBtn = document.getElementById('toggle-record-btn');
      const voiceStatus = document.getElementById('voice-status-note');

      recordBtn?.addEventListener('click', () => {
        if (!isRecording) {
          isRecording = true;
          recordBtn.className = 'btn btn-danger';
          recordBtn.innerHTML = '⏹️ Recording... Click to Complete (0:08)';
          voiceStatus.innerText = 'Listening to campus audio note...';
        } else {
          isRecording = false;
          voiceRecorded = true;
          recordBtn.className = 'btn btn-primary';
          recordBtn.innerHTML = '🔄 Re-record Audio Note';
          voiceStatus.innerText = '✅ Voice note transcribed: "AC compressor is making loud noise and leaking fluid in room."';
          
          // Auto-fill description if empty
          const descInput = document.getElementById('complaint-desc-input');
          if (descInput && !descInput.value) {
            descInput.value = 'Transcribed Voice Note: AC compressor is vibrating loudly and venting hot air. Immediate maintenance requested.';
          }
        }
      });

      // Form Submission
      document.getElementById('new-complaint-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-complaint-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Analyzing & Logging Ticket...';

        const title = document.getElementById('complaint-title-input').value.trim();
        const spot = document.getElementById('complaint-spot-input').value.trim();
        let description = document.getElementById('complaint-desc-input')?.value.trim() || '';
        if (voiceRecorded && !description) {
          description = 'Recorded audio complaint submitted via student voice note.';
        }
        const isEmergency = document.getElementById('emergency-toggle')?.checked;

        const payload = {
          title,
          categoryName: selectedCategory.name,
          categoryId: selectedCategory.id,
          location: selectedLocation,
          specificSpot: spot || selectedLocation,
          description: description || title,
          priority: isEmergency ? 'Critical' : 'Medium',
          photoUrl: uploadedPhotoPreview || (inputMode === 'photo' ? 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80' : null)
        };

        const result = await api.createComplaint(payload);

        window.dispatchEvent(new CustomEvent('campuscare-toast', {
          detail: {
            type: 'success',
            title: 'Complaint Logged!',
            message: `Ticket #${result.data.id} has been created and queued for technician triage.`
          }
        }));

        // Redirect to detail page
        router.navigate(`/complaints/${result.data.id}`);
      });

      // Run initial duplicate check
      checkDuplicates();
    }
  };
}
