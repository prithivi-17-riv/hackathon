/**
 * CampusCare Bundled Script
 * Auto-generated bundle for zero-config file:// and http:// browser compatibility
 */
(function() {
  'use strict';


/* --- js/supabaseClient.js --- */
/**
 * CampusCare Supabase Client Initialization
 * Connects to Supabase using standard CDN JS library
 */
const SUPABASE_URL = 'https://stoqalelfqnbxxvsnrsu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0b3FhbGVsZnFuYnh4dnNucnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTMzMDEsImV4cCI6MjEwNTAyOTMwMX0.pEbuAB9bXdxLZNqLe0iPMsCnsf8yCqDsXMoXrys8KC0';

// Access Supabase from global window (loaded via CDN <script src="...">)
const createClient = (window.supabase && window.supabase.createClient) 
  ? window.supabase.createClient 
  : (url, key) => null;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});


/* --- js/mockData.js --- */
/**
 * CampusCare Master Taxonomy Layer
 */

const INITIAL_USERS = [];

const CAMPUS_LOCATIONS = [
  'Hostel Block B (Cauvery)',
  'Hostel Block A (Ganga)',
  'Central Library (2nd Floor)',
  'Central Library (Ground Floor)',
  'Main Canteen & Food Court',
  'Science Block (Physics Labs)',
  'Tech Park (CS Labs)',
  'Seminar Hall 3 (Auditorium)',
  'Campus Main Gate & Perimeter',
  'Indoor Sports Complex',
  'Mechanical Engg Workshop',
  'Admin Block (Ground Floor)'
];

const CATEGORIES = [
  { id: 'electrical', name: 'Electrical & Power', icon: '⚡', department: 'Electrical & HVAC Maintenance' },
  { id: 'hvac', name: 'AC & Ventilation', icon: '❄️', department: 'Electrical & HVAC Maintenance' },
  { id: 'wifi', name: 'Wi-Fi & Network', icon: '📶', department: 'IT & Network Infrastructure' },
  { id: 'plumbing', name: 'Plumbing & Water', icon: '🚰', department: 'Plumbing & Sanitation' },
  { id: 'furniture', name: 'Furniture & Carpentry', icon: '🪑', department: 'Estate & Civil Works' },
  { id: 'sanitation', name: 'Sanitation & Cleanliness', icon: '🧹', department: 'Plumbing & Sanitation' },
  { id: 'classroom_av', name: 'Classroom AV & Projector', icon: '📽️', department: 'IT & Network Infrastructure' },
  { id: 'security', name: 'Safety & Streetlights', icon: '🛡️', department: 'Campus Security & Electrical' }
];

const INITIAL_COMPLAINTS = [];


/* --- js/state.js --- */
/**
 * CampusCare Global Shared State & Supabase Auth Manager
 * Handles Supabase session synchronization, profiles, and state
 */


const STORAGE_KEY = 'campuscare_state_v1';

class StateManager {
  constructor() {
    this.listeners = [];
    this.session = null;
    this.state = this.loadState();
    this.initSupabaseAuth();
  }

  loadState() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          currentUser: parsed.currentUser || null,
          currentRole: parsed.currentRole || 'guest',
          complaints: parsed.complaints || [],
          users: parsed.users || []
        };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage, falling back to defaults:', e);
    }

    return {
      currentUser: null,
      currentRole: 'guest',
      complaints: [],
      users: []
    };
  }

  async initSupabaseAuth() {
    if (!supabase) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.session = session;
        await this.syncProfile(session.user);
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        this.session = session;
        if (session && session.user) {
          await this.syncProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          this.state.currentUser = null;
          this.state.currentRole = 'guest';
          this.saveState();
        }
      });
    } catch (err) {
      console.warn('Supabase auth initialization skipped or failed:', err);
    }
  }

  async syncProfile(authUser) {
    if (!supabase || !authUser) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile && !error) {
        this.state.currentUser = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          rollNo: profile.roll_no,
          department: profile.department,
          hostel: profile.hostel,
          roomNo: profile.room_no,
          phone: profile.phone,
          avatar: profile.avatar || profile.name.substring(0, 2).toUpperCase()
        };
        this.state.currentRole = profile.role;
        this.saveState();
      }
    } catch (err) {
      console.warn('Error fetching Supabase user profile:', err);
    }
  }

  // Supabase Auth Actions
  async signUp({ email, password, name, role = 'student', rollNo, department, hostel, roomNo }) {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          roll_no: rollNo,
          department,
          hostel,
          room_no: roomNo,
          avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        }
      }
    });

    if (error) throw error;
    if (data.user) {
      await this.syncProfile(data.user);
    }
    return data;
  }

  async signIn({ email, password }) {
    if (!supabase) throw new Error('Supabase client not initialized');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (data.user) {
      await this.syncProfile(data.user);
    }
    return data;
  }

  async signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    this.state.currentUser = null;
    this.state.currentRole = 'guest';
    this.saveState();
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.state);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    });
  }

  getState() {
    return this.state;
  }

  setCurrentUser(user) {
    this.state.currentUser = user;
    this.state.currentRole = user ? user.role : 'guest';
    this.saveState();
  }

  setRole(role) {
    this.state.currentRole = role;
    this.saveState();
  }

  getComplaints() {
    return this.state.complaints;
  }

  setComplaints(complaints) {
    this.state.complaints = complaints;
    this.saveState();
  }

  getComplaintById(id) {
    return this.state.complaints.find(c => c.id === id || c.ticket_number === id) || null;
  }

  addComplaint(complaint) {
    this.state.complaints.unshift(complaint);
    this.saveState();
    return complaint;
  }

  updateComplaint(id, updates) {
    const index = this.state.complaints.findIndex(c => c.id === id || c.ticket_number === id);
    if (index !== -1) {
      this.state.complaints[index] = {
        ...this.state.complaints[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.saveState();
      return this.state.complaints[index];
    }
    return null;
  }

  toggleUpvote(complaintId, userId) {
    const complaint = this.getComplaintById(complaintId);
    if (!complaint) return null;

    if (!complaint.upvotedBy) complaint.upvotedBy = [];
    const index = complaint.upvotedBy.indexOf(userId);

    if (index > -1) {
      complaint.upvotedBy.splice(index, 1);
      complaint.upvotes = Math.max(0, (complaint.upvotes || 1) - 1);
    } else {
      complaint.upvotedBy.push(userId);
      complaint.upvotes = (complaint.upvotes || 0) + 1;
    }

    this.updateComplaint(complaintId, {
      upvotes: complaint.upvotes,
      upvotedBy: complaint.upvotedBy
    });

    return complaint;
  }

  resetToDefaults() {
    this.state = {
      currentUser: null,
      currentRole: 'guest',
      complaints: [],
      users: []
    };
    this.saveState();
  }
}

const stateManager = new StateManager();


/* --- js/api.js --- */
/**
 * CampusCare API Service Layer with Real Supabase Backend Queries
 * Supports plain fetch-style Supabase calls (.from().select(), .insert(), .update())
 * with graceful fallback to local state for offline demo mode.
 */


// Simulated network delay helper
const delay = (ms = 180) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * AI Smart Prioritization Scoring Algorithm
 */
function calculatePriorityScore(complaint) {
  const URGENCY_KEYWORDS = [
    { word: 'hazard', weight: 40 },
    { word: 'fire', weight: 50 },
    { word: 'shock', weight: 45 },
    { word: 'danger', weight: 40 },
    { word: 'leakage', weight: 30 },
    { word: 'flooding', weight: 35 },
    { word: 'failure', weight: 25 },
    { word: 'broken', weight: 20 },
    { word: 'overheating', weight: 25 },
    { word: 'exam', weight: 30 },
    { word: 'slippery', weight: 25 },
    { word: 'outage', weight: 25 },
    { word: 'emergency', weight: 45 },
    { word: 'urgent', weight: 30 }
  ];

  let keywordScore = 0;
  const content = `${complaint.title || ''} ${complaint.description || ''}`.toLowerCase();
  
  URGENCY_KEYWORDS.forEach(kw => {
    if (content.includes(kw.word)) {
      keywordScore += kw.weight;
    }
  });

  const createdTime = new Date(complaint.createdAt || complaint.created_at || Date.now()).getTime();
  const now = Date.now();
  const waitHours = Math.max(0, (now - createdTime) / (1000 * 60 * 60));
  const isResolved = complaint.status === 'Resolved';
  const waitScore = isResolved ? 0 : Math.min(40, waitHours * 1.5);

  const upvoteScore = Math.min(30, (complaint.upvotes || 0) * 4);

  let categoryBase = 10;
  const catId = complaint.categoryId || complaint.category_id;
  if (catId === 'security' || catId === 'plumbing') categoryBase = 25;
  if (catId === 'hvac' || catId === 'electrical') categoryBase = 20;

  const totalScore = Math.round(keywordScore + waitScore + upvoteScore + categoryBase);

  let tier = 'Low';
  let badgeClass = 'badge-low';
  if (totalScore >= 80) {
    tier = 'Critical';
    badgeClass = 'badge-critical';
  } else if (totalScore >= 50) {
    tier = 'High';
    badgeClass = 'badge-high';
  } else if (totalScore >= 30) {
    tier = 'Medium';
    badgeClass = 'badge-medium';
  }

  return {
    score: totalScore,
    tier,
    badgeClass,
    factors: {
      keywordScore,
      waitScore: Math.round(waitScore),
      upvoteScore,
      categoryBase
    }
  };
}

// Normalize Supabase DB Row to App Entity Format
function normalizeComplaintRow(row) {
  if (!row) return null;
  return {
    id: row.ticket_number || row.id,
    dbId: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    categoryId: row.category_id,
    location: row.location,
    specificSpot: row.specific_spot,
    status: row.status,
    priority: row.priority,
    upvotes: row.upvotes || 1,
    upvotedBy: row.upvoted_by || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedBy: row.profiles ? {
      id: row.profiles.id,
      name: row.profiles.name,
      email: row.profiles.email,
      rollNo: row.profiles.roll_no
    } : { name: 'Student', email: 'student@campus.edu' },
    assignedTo: row.assigned_profile ? {
      id: row.assigned_profile.id,
      name: row.assigned_profile.name,
      department: row.assigned_profile.department
    } : null,
    estimatedResolutionTime: row.estimated_resolution_time,
    photoUrl: row.photo_url,
    resolutionProof: row.resolution_proof,
    timeline: (row.complaint_timeline || []).map(t => ({
      step: t.step,
      title: t.title,
      description: t.description,
      timestamp: t.timestamp,
      actor: t.actor
    })),
    comments: (row.complaint_comments || []).map(c => ({
      id: c.id,
      author: c.author_name,
      role: c.role,
      text: c.text,
      timestamp: c.created_at
    }))
  };
}

const api = {
  /**
   * Fetch all complaints with computed priority metadata from Supabase
   */
  async getComplaints(filter = {}) {
    if (supabase) {
      try {
        let query = supabase
          .from('complaints')
          .select(`
            *,
            profiles:submitted_by(id, name, email, roll_no),
            assigned_profile:assigned_to(id, name, department),
            complaint_comments(*),
            complaint_timeline(*)
          `);

        if (filter.status && filter.status !== 'All') {
          query = query.eq('status', filter.status);
        }
        if (filter.category && filter.category !== 'All') {
          query = query.or(`category.eq.${filter.category},category_id.eq.${filter.category}`);
        }
        if (filter.location && filter.location !== 'All') {
          query = query.eq('location', filter.location);
        }
        if (filter.assignedTo) {
          query = query.eq('assigned_to', filter.assignedTo);
        }

        const { data, error } = await query;

        if (!error && data) {
          let complaints = data.map(row => normalizeComplaintRow(row));
          complaints = complaints.map(c => ({
            ...c,
            priorityMetrics: calculatePriorityScore(c)
          }));

          if (filter.sortByPriority) {
            complaints.sort((a, b) => b.priorityMetrics.score - a.priorityMetrics.score);
          } else {
            complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          }

          stateManager.setComplaints(complaints);
          return { success: true, data: complaints, count: complaints.length };
        }
      } catch (err) {
        console.warn('Supabase fetch error, using local state fallback:', err);
      }
    }

    // Local state fallback
    await delay();
    let complaints = [...stateManager.getComplaints()];

    complaints = complaints.map(c => ({
      ...c,
      priorityMetrics: calculatePriorityScore(c)
    }));

    if (filter.status && filter.status !== 'All') {
      complaints = complaints.filter(c => c.status === filter.status);
    }
    if (filter.category && filter.category !== 'All') {
      complaints = complaints.filter(c => c.category === filter.category || c.categoryId === filter.category);
    }
    if (filter.location && filter.location !== 'All') {
      complaints = complaints.filter(c => c.location === filter.location);
    }
    if (filter.assignedTo) {
      complaints = complaints.filter(c => c.assignedTo && c.assignedTo.id === filter.assignedTo);
    }

    if (filter.sortByPriority) {
      complaints.sort((a, b) => b.priorityMetrics.score - a.priorityMetrics.score);
    } else {
      complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return { success: true, data: complaints, count: complaints.length };
  },

  /**
   * Get single complaint by ID
   */
  async getComplaintById(id) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('complaints')
          .select(`
            *,
            profiles:submitted_by(id, name, email, roll_no),
            assigned_profile:assigned_to(id, name, department),
            complaint_comments(*),
            complaint_timeline(*)
          `)
          .or(`ticket_number.eq.${id},id.eq.${id}`)
          .single();

        if (!error && data) {
          const complaint = normalizeComplaintRow(data);
          return {
            success: true,
            data: {
              ...complaint,
              priorityMetrics: calculatePriorityScore(complaint)
            }
          };
        }
      } catch (err) {
        console.warn('Supabase fetch by ID error, falling back:', err);
      }
    }

    await delay();
    const complaint = stateManager.getComplaintById(id);
    if (!complaint) {
      throw new Error(`Complaint with ID ${id} not found.`);
    }
    return {
      success: true,
      data: {
        ...complaint,
        priorityMetrics: calculatePriorityScore(complaint)
      }
    };
  },

  /**
   * Create a new complaint in Supabase
   */
  async createComplaint(payload) {
    const currentUser = stateManager.getState().currentUser;
    const ticketNumber = `CMP-${Math.floor(1000 + Math.random() * 9000)}`;

    if (supabase && currentUser && currentUser.id && currentUser.id.includes('-')) {
      try {
        const { data: created, error } = await supabase
          .from('complaints')
          .insert([{
            ticket_number: ticketNumber,
            title: payload.title,
            description: payload.description,
            category: payload.categoryName || payload.category,
            category_id: payload.categoryId || 'electrical',
            location: payload.location,
            specific_spot: payload.specificSpot || 'Not specified',
            status: 'Submitted',
            priority: payload.priority || 'Medium',
            submitted_by: currentUser.id,
            photo_url: payload.photoUrl || null,
            upvotes: 1,
            upvoted_by: [currentUser.id]
          }])
          .select()
          .single();

        if (!error && created) {
          // Add initial timeline entry
          await supabase.from('complaint_timeline').insert([{
            complaint_id: created.id,
            step: 'Submitted',
            title: 'Complaint Registered',
            description: 'Ticket initiated via student portal.',
            actor: currentUser.name || 'Student'
          }]);

          api.sendEmailNotification({
            to: currentUser.email || 'student@campus.edu',
            subject: `CampusCare: Ticket #${ticketNumber} Logged Successfully`,
            message: `Your issue "${payload.title}" has been registered.`
          });

          return { success: true, data: { ...payload, id: ticketNumber } };
        }
      } catch (err) {
        console.warn('Supabase insert error, falling back to local state:', err);
      }
    }

    // Local state fallback
    await delay(250);
    const newComplaint = {
      id: ticketNumber,
      title: payload.title,
      category: payload.categoryName || payload.category,
      categoryId: payload.categoryId || 'electrical',
      location: payload.location,
      specificSpot: payload.specificSpot || 'Not specified',
      description: payload.description,
      submittedBy: {
        name: currentUser ? currentUser.name : 'Student',
        email: currentUser ? currentUser.email : 'student@campus.edu',
        rollNo: currentUser ? currentUser.rollNo : 'Student'
      },
      status: 'Submitted',
      priority: payload.priority || 'Medium',
      upvotes: 1,
      upvotedBy: [currentUser ? currentUser.id : 'anonymous'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: null,
      photoUrl: payload.photoUrl || null,
      timeline: [
        {
          step: 'Submitted',
          title: 'Complaint Registered',
          description: 'Ticket initiated via student portal.',
          timestamp: new Date().toISOString(),
          actor: currentUser ? currentUser.name : 'Student'
        }
      ],
      comments: []
    };

    stateManager.addComplaint(newComplaint);

    api.sendEmailNotification({
      to: newComplaint.submittedBy.email,
      subject: `CampusCare: Ticket #${newComplaint.id} Logged Successfully`,
      message: `Your issue "${newComplaint.title}" has been registered.`
    });

    return { success: true, data: newComplaint };
  },

  /**
   * Update complaint status in Supabase
   */
  async updateStatus(id, newStatus, note = '', actorName = 'Admin') {
    if (supabase) {
      try {
        const { data: ticket } = await supabase
          .from('complaints')
          .select('id, ticket_number, submitted_by')
          .or(`ticket_number.eq.${id},id.eq.${id}`)
          .single();

        if (ticket) {
          await supabase
            .from('complaints')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
              ...(note ? { resolution_proof: note } : {}),
              ...(newStatus === 'Resolved' ? { resolved_at: new Date().toISOString() } : {})
            })
            .eq('id', ticket.id);

          await supabase.from('complaint_timeline').insert([{
            complaint_id: ticket.id,
            step: newStatus,
            title: `Status updated to ${newStatus}`,
            description: note || `Ticket marked as ${newStatus} by ${actorName}.`,
            actor: actorName
          }]);

          api.sendEmailNotification({
            to: 'student@campus.edu',
            subject: `[Update] Ticket #${id} is now ${newStatus}`,
            message: `Your complaint status has moved to: ${newStatus}. Note: ${note || 'Technician update.'}`
          });

          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase update status error:', err);
      }
    }

    // Local fallback
    await delay(200);
    const complaint = stateManager.getComplaintById(id);
    if (!complaint) throw new Error('Ticket not found');

    const timelineEntry = {
      step: newStatus,
      title: `Status updated to ${newStatus}`,
      description: note || `Ticket marked as ${newStatus} by ${actorName}.`,
      timestamp: new Date().toISOString(),
      actor: actorName
    };

    const updated = stateManager.updateComplaint(id, {
      status: newStatus,
      timeline: [...(complaint.timeline || []), timelineEntry],
      ...(note ? { resolutionProof: note } : {})
    });

    api.sendEmailNotification({
      to: complaint.submittedBy.email,
      subject: `[Update] Ticket #${complaint.id} is now ${newStatus}`,
      message: `Your campus complaint has moved to: ${newStatus}. Note: ${note || 'Technician update.'}`
    });

    return { success: true, data: updated };
  },

  /**
   * Assign ticket to technician in Supabase
   */
  async assignTechnician(id, staffUser, estimatedTime = 'Within 24 Hours') {
    if (supabase) {
      try {
        const { data: ticket } = await supabase
          .from('complaints')
          .select('id, status')
          .or(`ticket_number.eq.${id},id.eq.${id}`)
          .single();

        if (ticket) {
          const nextStatus = ticket.status === 'Submitted' ? 'Assigned' : ticket.status;
          await supabase
            .from('complaints')
            .update({
              assigned_to: staffUser.id,
              status: nextStatus,
              estimated_resolution_time: estimatedTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);

          await supabase.from('complaint_timeline').insert([{
            complaint_id: ticket.id,
            step: 'Assigned',
            title: 'Technician Assigned',
            description: `Assigned to ${staffUser.name} (${staffUser.department}). ETA: ${estimatedTime}`,
            actor: 'Admin'
          }]);

          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase assign technician error:', err);
      }
    }

    // Local fallback
    await delay(180);
    const complaint = stateManager.getComplaintById(id);
    if (!complaint) throw new Error('Ticket not found');

    const timelineEntry = {
      step: 'Assigned',
      title: 'Technician Assigned',
      description: `Assigned to ${staffUser.name} (${staffUser.department}). ETA: ${estimatedTime}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin'
    };

    const updated = stateManager.updateComplaint(id, {
      assignedTo: { id: staffUser.id, name: staffUser.name, department: staffUser.department },
      status: complaint.status === 'Submitted' ? 'Assigned' : complaint.status,
      estimatedResolutionTime: estimatedTime,
      timeline: [...(complaint.timeline || []), timelineEntry]
    });

    return { success: true, data: updated };
  },

  /**
   * Toggle Upvote in Supabase
   */
  async upvoteComplaint(complaintId) {
    const currentUser = stateManager.getState().currentUser;
    const userId = currentUser ? currentUser.id : 'usr_student_1';

    if (supabase) {
      try {
        const { data: ticket } = await supabase
          .from('complaints')
          .select('id, upvotes, upvoted_by')
          .or(`ticket_number.eq.${complaintId},id.eq.${complaintId}`)
          .single();

        if (ticket) {
          const list = ticket.upvoted_by || [];
          const idx = list.indexOf(userId);
          let newUpvotes = ticket.upvotes || 1;
          let newList = [...list];

          if (idx > -1) {
            newList.splice(idx, 1);
            newUpvotes = Math.max(0, newUpvotes - 1);
          } else {
            newList.push(userId);
            newUpvotes += 1;
          }

          await supabase
            .from('complaints')
            .update({ upvotes: newUpvotes, upvoted_by: newList })
            .eq('id', ticket.id);

          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase upvote error:', err);
      }
    }

    // Local fallback
    await delay(100);
    const updated = stateManager.toggleUpvote(complaintId, userId);
    return { success: true, data: updated };
  },

  /**
   * AI Duplicate Detection Engine
   */
  async findDuplicates(categoryId, location, titleQuery = '') {
    const res = await api.getComplaints();
    const complaints = (res.data || []).filter(c => c.status !== 'Resolved' && c.status !== 'Rejected');

    const duplicates = complaints.filter(c => {
      const sameLocation = c.location && location && c.location.toLowerCase().includes(location.toLowerCase());
      const sameCategory = c.categoryId === categoryId || (c.category && categoryId && c.category.toLowerCase().includes(categoryId.toLowerCase()));

      if (sameLocation && sameCategory) return true;

      if (titleQuery && titleQuery.length > 5) {
        const words = titleQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const matchCount = words.filter(w => c.title.toLowerCase().includes(w)).length;
        if (matchCount >= 2 && sameLocation) return true;
      }
      return false;
    });

    return {
      success: true,
      duplicates: duplicates.slice(0, 3)
    };
  },

  /**
   * Simulated Email Notification Service
   */
  sendEmailNotification({ to, subject, message }) {
    console.log(`%c[SIMULATED EMAIL DISPATCH] To: ${to} | Subject: ${subject}`, 'color: #D4FF00; background: #1E1B4B; padding: 4px 8px; font-weight: bold;');

    const event = new CustomEvent('campuscare-email-sent', {
      detail: { to, subject, message, timestamp: new Date().toLocaleTimeString() }
    });
    window.dispatchEvent(event);
  },

  /**
   * Analytics & Recurring Issues Scanner
   */
  async getAnalyticsData() {
    const res = await api.getComplaints();
    const complaints = res.data || [];

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
    const pending = complaints.filter(c => c.status === 'Submitted' || c.status === 'Acknowledged').length;

    const clusterMap = {};
    complaints.forEach(c => {
      const key = `${c.location}__${c.category}`;
      if (!clusterMap[key]) {
        clusterMap[key] = { location: c.location, category: c.category, count: 0, complaints: [] };
      }
      clusterMap[key].count += 1;
      clusterMap[key].complaints.push(c);
    });

    const recurringIssues = Object.values(clusterMap)
      .filter(item => item.count >= 3)
      .map(item => ({
        ...item,
        riskScore: item.count >= 4 ? 'Critical' : 'High',
        recommendation: `Preventive overhaul recommended: Replace primary distribution hardware at ${item.location}.`
      }));

    const categoryCounts = {};
    complaints.forEach(c => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    return {
      summary: {
        total,
        resolved,
        inProgress,
        pending,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
        avgResolutionHours: 18.5
      },
      recurringIssues,
      categoryCounts
    };
  },

  /**
   * Generate Real PDF Report via jsPDF
   */
  async exportReport() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('jsPDF library loading... please try in a moment.');
      return false;
    }

    const doc = new jsPDF();
    const res = await api.getComplaints();
    const complaints = res.data || [];
    const analytics = await api.getAnalyticsData();

    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(212, 255, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CAMPUSCARE - AI SMART COMPLAINT AUDIT REPORT', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated: ${new Date().toLocaleString()} | Facility Operations & Estate Management`, 14, 26);

    doc.setFillColor(251, 249, 244);
    doc.roundedRect(14, 38, 182, 24, 3, 3, 'F');
    doc.setDrawColor(232, 226, 213);
    doc.roundedRect(14, 38, 182, 24, 3, 3, 'S');

    doc.setTextColor(30, 27, 75);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Tickets: ${analytics.summary.total}`, 22, 50);
    doc.text(`Resolved: ${analytics.summary.resolved} (${analytics.summary.resolutionRate}%)`, 68, 50);
    doc.text(`Active/In Progress: ${analytics.summary.inProgress}`, 120, 50);
    doc.text(`Pending: ${analytics.summary.pending}`, 165, 50);

    let startY = 70;
    if (analytics.recurringIssues.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('⚠️ AI PREDICTIVE ALERT: RECURRING ISSUE CLUSTERS (>= 3 Incidents)', 14, startY);

      analytics.recurringIssues.forEach((issue, idx) => {
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(`• [${issue.riskScore.toUpperCase()}] ${issue.location} - ${issue.category} (${issue.count} reported cases). Action: ${issue.recommendation}`, 14, startY + 8 + (idx * 6));
      });
      startY += 16 + (analytics.recurringIssues.length * 6);
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 27, 75);
    doc.text('Active Campus Complaints Log', 14, startY);

    const tableRows = complaints.map(c => {
      const p = calculatePriorityScore(c);
      return [
        c.id,
        (c.title || '').substring(0, 36) + ((c.title || '').length > 36 ? '...' : ''),
        c.category,
        c.location,
        c.status,
        `${p.tier} (${p.score})`,
        `${c.upvotes || 0} ▲`
      ];
    });

    if (doc.autoTable) {
      doc.autoTable({
        startY: startY + 4,
        head: [['ID', 'Title', 'Category', 'Location', 'Status', 'AI Priority', 'Votes']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [255, 87, 51], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 246, 240] }
      });
    }

    doc.save(`CampusCare-Complaint-Report-${Date.now()}.pdf`);
    return true;
  }
};


/* --- js/router.js --- */
/**
 * CampusCare SPA Hash-Based Router
 * Handles dynamic route dispatching, param parsing, and client-side role guards
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentView = null;
    this.init();
  }

  register(path, viewHandler, options = {}) {
    this.routes[path] = {
      handler: viewHandler,
      allowedRoles: options.allowedRoles || ['student', 'admin', 'staff', 'guest'],
      title: options.title || 'CampusCare'
    };
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  navigate(hash) {
    window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
  }

  parseRoute(hash) {
    const cleanHash = hash.replace(/^#\/?/, '') || '';
    const parts = cleanHash.split('/');

    // Check exact matches
    if (this.routes[cleanHash]) {
      return { route: this.routes[cleanHash], path: cleanHash, params: {} };
    }

    // Pattern matching: e.g. complaints/:id, admin/complaints/:id, staff/complaints/:id
    for (const routePattern in this.routes) {
      const patternParts = routePattern.split('/');
      if (patternParts.length === parts.length) {
        let isMatch = true;
        const params = {};

        for (let i = 0; i < patternParts.length; i++) {
          if (patternParts[i].startsWith(':')) {
            const paramName = patternParts[i].slice(1);
            params[paramName] = parts[i];
          } else if (patternParts[i] !== parts[i]) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          return { route: this.routes[routePattern], path: routePattern, params };
        }
      }
    }

    // Default fallback
    return { route: this.routes['login'] || this.routes[''], path: 'login', params: {} };
  }

  async handleRoute() {
    const appState = stateManager.getState();
    const userRole = appState.currentRole || 'guest';
    const defaultRoute = userRole === 'guest' ? '#/login' : (userRole === 'admin' ? '#/admin' : (userRole === 'staff' ? '#/staff' : '#/dashboard'));
    const rawHash = window.location.hash || defaultRoute;
    const { route, path, params } = this.parseRoute(rawHash);

    // Route Guard Verification
    if (route && route.allowedRoles && !route.allowedRoles.includes('guest')) {
      if (!route.allowedRoles.includes(userRole)) {
        if (userRole === 'guest') {
          this.navigate('/login');
          return;
        }
        console.warn(`Access Denied: Role "${userRole}" cannot access "${path}". Redirecting.`);
        
        // Show notification toast
        const event = new CustomEvent('campuscare-toast', {
          detail: {
            type: 'error',
            title: 'Restricted Access',
            message: `Your current role (${userRole.toUpperCase()}) does not have permission to access ${path}.`
          }
        });
        window.dispatchEvent(event);

        // Redirect appropriately
        if (userRole === 'admin') {
          this.navigate('/admin');
        } else if (userRole === 'staff') {
          this.navigate('/staff');
        } else {
          this.navigate('/dashboard');
        }
        return;
      }
    }

    // Set Document Title
    document.title = `${route?.title || 'Smart Complaint System'} | CampusCare`;

    // Render View Container
    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    if (this.currentView && typeof this.currentView.onDestroy === 'function') {
      try {
        this.currentView.onDestroy();
      } catch (err) {
        console.error('Error in view onDestroy:', err);
      }
    }

    try {
      // Show smooth fade container
      mainContainer.innerHTML = `
        <div class="view-container" id="view-root">
          <div class="skeleton skeleton-title" style="margin: 20px auto;"></div>
          <div class="skeleton skeleton-card" style="margin: 20px auto;"></div>
        </div>
      `;

      const viewInstance = await route.handler(params);
      this.currentView = viewInstance;

      const viewRoot = document.getElementById('view-root');
      if (viewRoot && viewInstance && viewInstance.render) {
        const renderedHtml = await viewInstance.render();
        viewRoot.innerHTML = renderedHtml;
        if (typeof viewInstance.onMount === 'function') {
          viewInstance.onMount();
        }
      }

      // Update Navigation Active States & Breadcrumbs
      this.updateActiveNavs(rawHash);
      this.updateFloatingBotVisibility(rawHash, userRole);

    } catch (err) {
      console.error('Error rendering route view:', err);
      mainContainer.innerHTML = `
        <div class="page-container">
          <div class="card" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 3rem; margin-bottom: 12px;">⚠️</div>
            <h2 style="color: var(--color-primary); margin-bottom: 8px;">Failed to Load Page</h2>
            <p style="color: var(--color-text-muted); margin-bottom: 20px;">${err.message || 'An unexpected error occurred.'}</p>
            <a href="#/dashboard" class="btn btn-primary">Return to Dashboard</a>
          </div>
        </div>
      `;
    }
  }

  updateActiveNavs(currentHash) {
    const navLinks = document.querySelectorAll('[data-route]');
    navLinks.forEach(link => {
      const targetRoute = link.getAttribute('data-route');
      if (currentHash.includes(targetRoute) && targetRoute !== '') {
        link.classList.add('active');
      } else if (targetRoute === '' && (currentHash === '#' || currentHash === '#/' || currentHash === '#/dashboard')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  updateFloatingBotVisibility(currentHash, role) {
    const floatingBot = document.getElementById('floating-carebot-btn');
    if (!floatingBot) return;

    // Show floating mascot only for student role on student pages
    if (role === 'student' && !currentHash.includes('/chatbot') && !currentHash.includes('/login') && !currentHash.includes('/signup')) {
      floatingBot.style.display = 'flex';
    } else {
      floatingBot.style.display = 'none';
    }
  }
}

const router = new Router();


/* --- js/views/landing.js --- */
/**
 * View: Landing & Sign In View
 */


function createLandingView() {
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


/* --- js/views/signup.js --- */
/**
 * View: User Signup connected to Supabase Auth & Profiles
 * Allows registering as Student, Staff Technician, or Campus Authority/Admin
 */


function createSignupView() {
  return {
    render() {
      return `
        <div class="page-container" style="max-width: 540px; padding-top: 30px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div class="brand-icon" style="margin: 0 auto 12px; width: 48px; height: 48px; font-size: 1.5rem;">⚡</div>
            <h1 style="font-size: 2rem; color: var(--color-secondary); margin-bottom: 6px;">Create Account</h1>
            <p style="color: var(--color-text-muted); font-size: 0.9rem;">Register to access Student, Staff, or Authority Portals</p>
          </div>

          <div class="card card-chunky">
            <!-- Dynamic DOM Error Alert Container -->
            <div id="signup-error-banner" style="display: none; background: #FEE2E2; border: 1.5px solid #FCA5A5; color: #991B1B; padding: 12px 14px; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; margin-bottom: 16px;"></div>

            <form id="signup-form">
              <!-- Account Role Selector -->
              <div class="form-group">
                <label class="form-label">Portal Account Type / Role <span class="required">*</span></label>
                <select id="signup-role" class="form-control" required style="font-weight: 600; border-color: var(--color-primary);">
                  <option value="student">👨‍🎓 Student Portal (Report & Track Issues)</option>
                  <option value="staff">👨‍🔧 Staff / Technician Portal (Resolve Work Orders)</option>
                  <option value="admin">👩‍💼 Authority / Admin Portal (Triage Queue & Analytics)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Full Name <span class="required">*</span></label>
                <input type="text" id="signup-name" class="form-control" placeholder="e.g. Ananya Roy" required>
              </div>

              <div class="form-group">
                <label class="form-label">Campus Email <span class="required">*</span></label>
                <input type="email" id="signup-email" class="form-control" placeholder="name@campus.edu" required>
              </div>

              <div class="form-group">
                <label class="form-label">Password <span class="required">*</span></label>
                <input type="password" id="signup-password" class="form-control" placeholder="Minimum 6 characters" minlength="6" required>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group" id="roll-group">
                  <label class="form-label" id="roll-label">Roll / Employee ID</label>
                  <input type="text" id="signup-roll" class="form-control" placeholder="2024CS220">
                </div>
                <div class="form-group">
                  <label class="form-label">Department <span class="required">*</span></label>
                  <select id="signup-dept" class="form-control" required>
                    <option value="Computer Science & Engg">Computer Science & Engg</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engg">Mechanical Engg</option>
                    <option value="Electrical & HVAC Maintenance">Electrical & HVAC Maintenance</option>
                    <option value="Plumbing & Sanitation">Plumbing & Sanitation</option>
                    <option value="IT & Network Infrastructure">IT & Network Infrastructure</option>
                    <option value="Estate & Civil Works">Estate & Civil Works</option>
                  </select>
                </div>
              </div>

              <div id="student-extra-fields" style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Hostel Residence</label>
                  <select id="signup-hostel" class="form-control">
                    <option value="Hostel Block B (Cauvery)">Hostel Block B (Cauvery)</option>
                    <option value="Hostel Block A (Ganga)">Hostel Block A (Ganga)</option>
                    <option value="Hostel Block C (Godavari)">Hostel Block C (Godavari)</option>
                    <option value="Day Scholar">Day Scholar (Off-Campus)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Room / Office No</label>
                  <input type="text" id="signup-room" class="form-control" placeholder="B-204">
                </div>
              </div>

              <button type="submit" id="signup-submit-btn" class="btn btn-primary w-full" style="margin-top: 14px;">Create Account & Sign In →</button>

              <div style="text-align: center; margin-top: 16px; font-size: 0.85rem; color: var(--color-text-muted);">
                Already have an account? <a href="#/login" style="font-weight: 700;">Sign in here</a>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    onMount() {
      const roleSelect = document.getElementById('signup-role');
      const studentFields = document.getElementById('student-extra-fields');
      const rollLabel = document.getElementById('roll-label');

      roleSelect?.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (selected === 'student') {
          if (studentFields) studentFields.style.display = 'grid';
          if (rollLabel) rollLabel.innerText = 'Roll Number';
        } else {
          if (studentFields) studentFields.style.display = 'none';
          if (rollLabel) rollLabel.innerText = selected === 'staff' ? 'Technician ID' : 'Officer ID';
        }
      });

      document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('signup-submit-btn');
        const errorBanner = document.getElementById('signup-error-banner');

        if (errorBanner) errorBanner.style.display = 'none';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '⏳ Creating Account...';
        }

        const role = document.getElementById('signup-role').value;
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const rollNo = document.getElementById('signup-roll').value.trim();
        const department = document.getElementById('signup-dept').value;
        const hostel = document.getElementById('signup-hostel')?.value || 'Estate Office';
        const roomNo = document.getElementById('signup-room')?.value.trim() || '';

        try {
          await stateManager.signUp({
            email,
            password,
            name,
            role,
            rollNo,
            department,
            hostel,
            roomNo
          });

          window.dispatchEvent(new CustomEvent('campuscare-toast', {
            detail: {
              type: 'success',
              title: 'Account Created!',
              message: `Welcome ${name}! Logged in as ${role.toUpperCase()}.`
            }
          }));

          // Redirect to the appropriate portal
          if (role === 'admin') {
            router.navigate('/admin');
          } else if (role === 'staff') {
            router.navigate('/staff');
          } else {
            router.navigate('/dashboard');
          }
        } catch (err) {
          console.error('Supabase signup error:', err);
          if (errorBanner) {
            errorBanner.innerText = `⚠️ Signup Error: ${err.message || 'Registration failed.'}`;
            errorBanner.style.display = 'block';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Account & Sign In →';
          }
        }
      });
    }
  };
}


/* --- js/views/dashboard.js --- */
/**
 * View: Student Dashboard
 */



function createDashboardView() {
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


/* --- js/views/newComplaint.js --- */
/**
 * View: New Complaint Submission with AI Duplication Detection
 */



function createNewComplaintView() {
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


/* --- js/views/complaintDetail.js --- */
/**
 * View: Complaint Detail & Live Status Tracking
 */



function createComplaintDetailView(params) {
  const complaintId = params.id;

  return {
    async render() {
      let complaint = null;
      try {
        const res = await api.getComplaintById(complaintId);
        complaint = res.data;
      } catch {
        return `
          <div class="page-container" style="text-align: center; padding-top: 60px;">
            <h2 style="color: var(--color-primary);">Complaint Not Found</h2>
            <p style="color: var(--color-text-muted); margin-bottom: 20px;">Ticket #${complaintId} could not be located in the database.</p>
            <a href="#/dashboard" class="btn btn-primary">Return to Dashboard</a>
          </div>
        `;
      }

      const currentUser = stateManager.getState().currentUser || { id: 'usr_student_1', name: 'Student' };
      const hasUpvoted = complaint.upvotedBy && complaint.upvotedBy.includes(currentUser.id);
      
      const TRACKING_STEPS = ['Submitted', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved'];
      const currentStepIdx = TRACKING_STEPS.indexOf(complaint.status);
      const isResolved = complaint.status === 'Resolved';

      return `
        <div class="page-container" style="max-width: 960px;">
          <!-- Breadcrumbs -->
          <div class="breadcrumbs">
            <a href="#/dashboard">Dashboard</a>
            <span class="separator">/</span>
            <span class="current">Ticket #${complaint.id}</span>
          </div>

          <div class="page-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
                <span class="badge ${complaint.priorityMetrics.badgeClass}">
                  ${complaint.priorityMetrics.tier} Priority (${complaint.priorityMetrics.score} pts)
                </span>
                <span class="badge badge-${complaint.status.toLowerCase().replace(/\s+/g, '-')}">
                  ● ${complaint.status}
                </span>
                <span class="badge badge-category">${complaint.category}</span>
              </div>
              <h1 class="page-title" style="font-size: 1.75rem;">${complaint.title}</h1>
            </div>

            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <button class="upvote-btn ${hasUpvoted ? 'upvoted' : ''}" id="detail-upvote-btn" style="padding: 8px 16px;">
                <span>▲</span>
                <span class="upvote-count">${complaint.upvotes || 0}</span>
                <span>${hasUpvoted ? 'Upvoted' : 'Upvote Issue'}</span>
              </button>
              <a href="#/dashboard" class="btn btn-outline btn-sm">← Back</a>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: flex-start;">
            
            <!-- Left Column: Details & Comments -->
            <div>
              <!-- Issue Card -->
              <div class="card card-chunky" style="margin-bottom: 24px;">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 12px;">Issue Description</h3>
                <p style="font-size: 0.95rem; color: var(--color-text-main); line-height: 1.6; margin-bottom: 20px;">
                  ${complaint.description}
                </p>

                ${complaint.photoUrl ? `
                  <div style="margin-bottom: 20px;">
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-secondary); margin-bottom: 6px;">Attached Media / Proof:</div>
                    <img src="${complaint.photoUrl}" alt="Fault preview" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: var(--radius-md); border: 2px solid var(--color-border);">
                  </div>
                ` : ''}

                <!-- Key Meta Table -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: var(--color-bg-alt); padding: 14px 18px; border-radius: var(--radius-md); border: 1.5px solid var(--color-border); font-size: 0.85rem;">
                  <div>
                    <span style="color: var(--color-text-muted);">Campus Location:</span>
                    <div style="font-weight: 700; color: var(--color-secondary);">${complaint.location}</div>
                  </div>
                  <div>
                    <span style="color: var(--color-text-muted);">Specific Spot:</span>
                    <div style="font-weight: 700; color: var(--color-secondary);">${complaint.specificSpot || 'N/A'}</div>
                  </div>
                  <div>
                    <span style="color: var(--color-text-muted);">Submitted By:</span>
                    <div style="font-weight: 700; color: var(--color-secondary);">${complaint.submittedBy?.name || 'Student'} (${complaint.submittedBy?.rollNo || '2024CS108'})</div>
                  </div>
                  <div>
                    <span style="color: var(--color-text-muted);">Assigned Technician:</span>
                    <div style="font-weight: 700; color: #4F46E5;">${complaint.assignedTo ? complaint.assignedTo.name : 'Awaiting Assignment'}</div>
                  </div>
                </div>
              </div>

              <!-- Discussion & Updates Thread -->
              <div class="card">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 16px;">
                  💬 Activity & Technician Notes (${(complaint.comments || []).length})
                </h3>

                <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;" id="comments-thread-container">
                  ${(complaint.comments || []).length === 0 ? `
                    <div style="font-size: 0.85rem; color: var(--color-text-muted); font-style: italic;">
                      No notes yet. Technician updates will appear here.
                    </div>
                  ` : (complaint.comments || []).map(comm => `
                    <div style="background: ${comm.role === 'staff' ? '#F0FDF4' : 'var(--color-bg-alt)'}; border: 1.5px solid ${comm.role === 'staff' ? '#86EFAC' : 'var(--color-border)'}; border-radius: var(--radius-md); padding: 12px 16px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-weight: 800; font-size: 0.85rem; color: var(--color-secondary);">
                          ${comm.author} ${comm.role === 'staff' ? '<span class="badge badge-resolved" style="font-size: 0.65rem; margin-left: 6px;">Staff / Technician</span>' : ''}
                        </span>
                        <span style="font-size: 0.75rem; color: var(--color-text-muted);">
                          ${new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style="font-size: 0.88rem; color: var(--color-text-main); margin: 0;">${comm.text}</p>
                    </div>
                  `).join('')}
                </div>

                <!-- Add Comment Input -->
                <form id="add-comment-form" style="display: flex; gap: 10px;">
                  <input type="text" id="comment-text-input" class="form-control" placeholder="Post a comment or update for the technician..." required>
                  <button type="submit" class="btn btn-primary btn-sm" style="flex-shrink: 0;">Send</button>
                </form>
              </div>
            </div>

            <!-- Right Column: Vertical Live Status Timeline -->
            <div>
              <div class="card card-chunky" style="background: #FFFFFF;">
                <div class="card-header" style="border-bottom: 2px solid var(--color-border); padding-bottom: 10px; margin-bottom: 16px;">
                  <h3 class="card-title" style="font-size: 1.1rem;">📍 Live Status Tracker</h3>
                  <span class="badge ${isResolved ? 'badge-resolved' : 'badge-in-progress'}">
                    ${isResolved ? 'Resolved' : 'In Motion'}
                  </span>
                </div>

                <div class="timeline">
                  ${TRACKING_STEPS.map((step, idx) => {
                    const isCompleted = currentStepIdx > idx || isResolved;
                    const isActive = currentStepIdx === idx && !isResolved;
                    const logEntry = (complaint.timeline || []).find(t => t.step === step);

                    return `
                      <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        <div class="timeline-icon-wrap">
                          ${isCompleted ? '✓' : (idx + 1)}
                        </div>
                        <div class="timeline-body">
                          <div class="timeline-title">${step}</div>
                          <div class="timeline-time">
                            ${logEntry ? new Date(logEntry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : (isCompleted ? 'Completed' : 'Pending')}
                          </div>
                          <div class="timeline-desc">
                            ${logEntry ? logEntry.description : (isActive ? 'Currently undergoing work order triage.' : '')}
                          </div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <!-- Emergency Escalation Box -->
                <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid var(--color-border); text-align: center;">
                  <button class="btn btn-outline btn-sm w-full" id="escalate-ticket-btn" style="color: #DC2626; border-color: #FCA5A5;">
                    ⚠️ Escalate to Senior Warden
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      `;
    },

    onMount() {
      // Upvote action
      document.getElementById('detail-upvote-btn')?.addEventListener('click', async () => {
        await api.upvoteComplaint(complaintId);
        router.handleRoute();
      });

      // Add Comment form
      document.getElementById('add-comment-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('comment-text-input');
        const text = input.value.trim();
        if (!text) return;

        const state = stateManager.getState();
        const user = state.currentUser || { name: 'Student', role: 'student' };
        const complaint = stateManager.getComplaintById(complaintId);

        const newComment = {
          id: `c_${Date.now()}`,
          author: user.name,
          role: user.role,
          text,
          timestamp: new Date().toISOString()
        };

        const updatedComments = [...(complaint.comments || []), newComment];
        stateManager.updateComplaint(complaintId, { comments: updatedComments });
        input.value = '';
        router.handleRoute();
      });

      // Escalate Ticket
      document.getElementById('escalate-ticket-btn')?.addEventListener('click', () => {
        api.updateStatus(complaintId, 'In Progress', 'Ticket escalated by student due to prolonged delay.', 'Chief Warden Office');
        window.dispatchEvent(new CustomEvent('campuscare-toast', {
          detail: {
            type: 'warning',
            title: 'Ticket Escalated',
            message: `Priority boost applied for #${complaintId}. Notification sent to Chief Warden.`
          }
        }));
        router.handleRoute();
      });
    }
  };
}


/* --- js/views/chatbot.js --- */
/**
 * View: CareBot Conversational AI Screen
 * Multi-turn complaint creation wizard + Instant FAQ resolver
 */




function createChatbotView() {
  // Conversational state machine
  // step: 'greeting' | 'ask_category' | 'ask_location' | 'ask_description' | 'confirm_submission' | 'done'
  let conversationState = {
    step: 'greeting',
    draft: {
      category: '',
      categoryId: '',
      location: '',
      description: '',
      title: ''
    }
  };

  const messages = [
    {
      sender: 'bot',
      text: "👋 Hi there! I'm **CareBot**, your 24/7 AI Campus Assistant. I can help you report an issue step-by-step or check the status of your existing complaints.",
      options: ['➕ Report an Issue', '📊 Check My Ticket Status', '📶 Wi-Fi Support Info', '🚨 Campus Emergency Contacts']
    }
  ];

  return {
    render() {
      return `
        <div class="page-container" style="max-width: 760px;">
          <!-- Breadcrumbs -->
          <div class="breadcrumbs">
            <a href="#/dashboard">Dashboard</a>
            <span class="separator">/</span>
            <span class="current">CareBot AI Assistant</span>
          </div>

          <div class="card card-chunky" style="padding: 0; overflow: hidden; height: calc(100vh - 200px); min-height: 540px; display: flex; flex-direction: column;">
            
            <!-- Chat Header -->
            <div style="background: var(--color-secondary); color: #FFFFFF; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid var(--color-primary);">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="floating-bot-btn" style="position: static; padding: 0; width: 42px; height: 42px; border-radius: 50%; box-shadow: none;">
                  <span style="font-size: 1.3rem;">🤖</span>
                </div>
                <div>
                  <h3 style="color: #FFFFFF; font-size: 1.1rem; margin: 0;">CareBot AI Assistant</h3>
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--color-accent);">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--color-accent);"></span>
                    Online & Ready to triage
                  </div>
                </div>
              </div>

              <button class="btn btn-outline btn-sm" id="reset-chat-btn" style="background: rgba(255,255,255,0.1); color: #FFFFFF; border-color: rgba(255,255,255,0.3); font-size: 0.75rem;">
                🔄 Restart Chat
              </button>
            </div>

            <!-- Messages Log Area -->
            <div id="chat-messages-container" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; background: #FAF8F5;">
              ${messages.map(msg => renderMessage(msg)).join('')}
            </div>

            <!-- Chat Input Area -->
            <div style="padding: 16px 20px; background: #FFFFFF; border-top: 2px solid var(--color-border);">
              <form id="chat-input-form" style="display: flex; gap: 10px;">
                <input type="text" id="chat-user-input" class="form-control" placeholder="Type your message or select an option above..." autocomplete="off" required>
                <button type="submit" class="btn btn-primary" id="chat-send-btn" style="flex-shrink: 0; padding: 10px 20px;">
                  Send ➔
                </button>
              </form>
            </div>

          </div>
        </div>
      `;
    },

    onMount() {
      const container = document.getElementById('chat-messages-container');
      const inputForm = document.getElementById('chat-input-form');
      const inputField = document.getElementById('chat-user-input');
      const resetBtn = document.getElementById('reset-chat-btn');

      const scrollToBottom = () => {
        if (container) container.scrollTop = container.scrollHeight;
      };

      const appendMessage = (msg) => {
        messages.push(msg);
        if (container) {
          container.insertAdjacentHTML('beforeend', renderMessage(msg));
          scrollToBottom();
          attachOptionListeners();
        }
      };

      const handleUserResponse = async (userText) => {
        appendMessage({ sender: 'user', text: userText });
        if (inputField) inputField.value = '';

        const lower = userText.toLowerCase().trim();

        // 1. FAQ keywords
        if (lower.includes('status') || lower.includes('check ticket') || lower.includes('my ticket')) {
          const user = stateManager.getState().currentUser;
          const userComplaints = stateManager.getComplaints().filter(c => c.submittedBy?.email === user.email);
          
          if (userComplaints.length === 0) {
            appendMessage({
              sender: 'bot',
              text: `You currently have no active tickets logged under ${user.email}. Would you like to submit one?`,
              options: ['➕ Report an Issue', '🏠 Back to Dashboard']
            });
          } else {
            const latest = userComplaints[0];
            appendMessage({
              sender: 'bot',
              text: `Here is your latest ticket status:\n\n📌 **Ticket #${latest.id}**: *"${latest.title}"*\n📍 Location: ${latest.location}\n📊 Status: **${latest.status}**\n👨‍🔧 Assigned: ${latest.assignedTo ? latest.assignedTo.name : 'Pending Assignment'}`,
              options: [`🔗 View #${latest.id} Details`, '➕ Report Another Issue']
            });
          }
          return;
        }

        if (lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('internet')) {
          appendMessage({
            sender: 'bot',
            text: "📶 **Campus Wi-Fi Helpdesk:**\n• SSID: `Campus_Student_5G`\n• Support Ext: 2404 / it.support@campus.edu\n• If you are experiencing dead zones or router drops, I can log a ticket for the network team.",
            options: ['➕ Report Wi-Fi Issue', '📊 Check My Ticket Status']
          });
          return;
        }

        if (lower.includes('emergency') || lower.includes('contact') || lower.includes('ambulance') || lower.includes('security')) {
          appendMessage({
            sender: 'bot',
            text: "🚨 **24/7 Campus Emergency Hotlines:**\n• Chief Security Officer: `+91 98765 00100`\n• Campus Health Centre / Ambulance: `+91 98765 00108`\n• Women's Safety Cell: `+91 98765 00109`\n• Hostel Chief Warden: `+91 98765 00102`",
            options: ['➕ Report Urgent Hazard', '🏠 Dashboard']
          });
          return;
        }

        // 2. Multi-turn step-by-step complaint creation wizard
        if (conversationState.step === 'greeting' || lower.includes('report') || lower.includes('issue')) {
          conversationState.step = 'ask_category';
          appendMessage({
            sender: 'bot',
            text: "Great! Let's get this fixed quickly. **Step 1/3:** What type of issue are you facing?",
            options: CATEGORIES.map(c => `${c.icon} ${c.name}`)
          });
          return;
        }

        if (conversationState.step === 'ask_category') {
          const matchedCat = CATEGORIES.find(c => lower.includes(c.id) || lower.includes(c.name.toLowerCase()) || userText.includes(c.icon)) || CATEGORIES[0];
          conversationState.draft.category = matchedCat.name;
          conversationState.draft.categoryId = matchedCat.id;
          conversationState.step = 'ask_location';

          appendMessage({
            sender: 'bot',
            text: `Got it: **${matchedCat.name}**. Now **Step 2/3:** Where is this located on campus?`,
            options: CAMPUS_LOCATIONS.slice(0, 6)
          });
          return;
        }

        if (conversationState.step === 'ask_location') {
          conversationState.draft.location = userText.replace(/^[📍\s]+/u, '');
          conversationState.step = 'ask_description';

          appendMessage({
            sender: 'bot',
            text: `Location noted: **${conversationState.draft.location}**.\n\nFinally **Step 3/3:** Please briefly describe the issue (e.g. *Broken AC unit making noise in Room 204*, *Water leaking in corridor*, etc.)`
          });
          return;
        }

        if (conversationState.step === 'ask_description') {
          conversationState.draft.description = userText;
          conversationState.draft.title = userText.length > 55 ? userText.substring(0, 52) + '...' : userText;
          conversationState.step = 'confirm_submission';

          appendMessage({
            sender: 'bot',
            text: `📋 **Ready to submit this ticket!**\n\n• **Category:** ${conversationState.draft.category}\n• **Location:** ${conversationState.draft.location}\n• **Summary:** ${conversationState.draft.title}\n\nShall I create this ticket now?`,
            options: ['✅ Yes, Submit Ticket', '❌ Cancel']
          });
          return;
        }

        if (conversationState.step === 'confirm_submission') {
          if (lower.includes('yes') || lower.includes('submit') || lower.includes('✅')) {
            // Call API to create complaint
            const res = await api.createComplaint({
              title: conversationState.draft.title,
              categoryName: conversationState.draft.category,
              categoryId: conversationState.draft.categoryId,
              location: conversationState.draft.location,
              description: conversationState.draft.description
            });

            conversationState.step = 'done';

            appendMessage({
              sender: 'bot',
              text: `🎉 **Ticket #${res.data.id} Created Successfully!**\n\nOur AI triage has categorized this and notified the ${conversationState.draft.category} department. You can track live updates anytime.`,
              options: [`🔗 Open Ticket #${res.data.id}`, '➕ Report Another Issue', '🏠 Dashboard']
            });
            return;
          } else {
            conversationState.step = 'greeting';
            appendMessage({
              sender: 'bot',
              text: 'Submission cancelled. How else can I assist you?',
              options: ['➕ Report an Issue', '📊 Check My Ticket Status']
            });
            return;
          }
        }

        // Generic fallback response
        appendMessage({
          sender: 'bot',
          text: `I understood: "${userText}". Would you like to file this as a formal complaint or check status?`,
          options: ['➕ File Complaint', '📊 Check Status', '🚨 Emergency Contacts']
        });
      };

      const attachOptionListeners = () => {
        document.querySelectorAll('.chat-option-pill').forEach(pill => {
          pill.onclick = (e) => {
            const optText = e.currentTarget.innerText.trim();
            if (optText.startsWith('🔗 Open Ticket #') || optText.startsWith('🔗 View #')) {
              const ticketId = optText.match(/CMP-\d+/)?.[0];
              if (ticketId) router.navigate(`/complaints/${ticketId}`);
            } else if (optText === '🏠 Dashboard' || optText === '🏠 Back to Dashboard') {
              router.navigate('/dashboard');
            } else {
              handleUserResponse(optText);
            }
          };
        });
      };

      inputForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = inputField?.value.trim();
        if (val) {
          handleUserResponse(val);
        }
      });

      resetBtn?.addEventListener('click', () => {
        conversationState = {
          step: 'greeting',
          draft: { category: '', categoryId: '', location: '', description: '', title: '' }
        };
        messages.length = 0;
        messages.push({
          sender: 'bot',
          text: "👋 Hi there! I'm **CareBot**, your 24/7 AI Campus Assistant. How can I help you today?",
          options: ['➕ Report an Issue', '📊 Check My Ticket Status', '📶 Wi-Fi Support Info']
        });
        if (container) {
          container.innerHTML = messages.map(msg => renderMessage(msg)).join('');
          attachOptionListeners();
        }
      });

      attachOptionListeners();
      scrollToBottom();
    }
  };
}

function renderMessage(msg) {
  const isBot = msg.sender === 'bot';
  // Formats simple bold markdown (**text** or \n)
  let formatted = msg.text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 4px;">$1</code>')
    .replace(/\n/g, '<br>');

  return `
    <div style="display: flex; gap: 10px; align-self: ${isBot ? 'flex-start' : 'flex-end'}; max-width: 82%;">
      ${isBot ? `
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--color-accent); color: var(--color-secondary); border: 2px solid var(--color-secondary); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; box-shadow: 0 2px 0 var(--color-secondary);">
          🤖
        </div>
      ` : ''}

      <div>
        <div style="background: ${isBot ? '#FFFFFF' : 'var(--color-primary)'}; color: ${isBot ? 'var(--color-text-main)' : '#FFFFFF'}; border: 2px solid ${isBot ? 'var(--color-border)' : 'var(--color-secondary)'}; border-radius: var(--radius-lg); padding: 12px 16px; box-shadow: ${isBot ? 'var(--shadow-subtle)' : '0 3px 0 var(--color-secondary)'}; font-size: 0.92rem; line-height: 1.5;">
          ${formatted}
        </div>

        ${isBot && msg.options && msg.options.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            ${msg.options.map(opt => `
              <button type="button" class="chat-option-pill" style="background: #FFFFFF; border: 1.5px solid var(--color-secondary); color: var(--color-secondary); padding: 5px 12px; border-radius: var(--radius-full); font-size: 0.785rem; font-weight: 700; cursor: pointer; box-shadow: 0 2px 0 var(--color-secondary); transition: all 0.15s ease;">
                ${opt}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}


/* --- js/views/adminDashboard.js --- */
/**
 * View: Admin Dashboard with AI Prioritized Queue
 */




function createAdminDashboardView() {
  let statusFilter = 'All';
  let categoryFilter = 'All';
  let searchQuery = '';
  let sortBy = 'priority'; // 'priority' | 'date' | 'upvotes'

  return {
    async render() {
      const state = stateManager.getState();
      const adminUser = state.currentUser || { name: 'Admin', designation: 'Chief Estate Officer' };
      const staffList = state.users.filter(u => u.role === 'staff');

      const res = await api.getComplaints({
        status: statusFilter,
        category: categoryFilter,
        sortByPriority: sortBy === 'priority'
      });

      let complaints = res.data;

      // Search filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        complaints = complaints.filter(c =>
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }

      if (sortBy === 'date') {
        complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'upvotes') {
        complaints.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      }

      const totalActive = complaints.filter(c => c.status !== 'Resolved').length;
      const criticalCount = complaints.filter(c => c.priorityMetrics.tier === 'Critical').length;
      const highCount = complaints.filter(c => c.priorityMetrics.tier === 'High').length;

      return `
        <div class="admin-layout-container">
          <!-- Left Sidebar -->
          <aside class="sidebar">
            <div>
              <div class="sidebar-header">
                <div class="brand-logo" style="margin-bottom: 8px;">
                  <div class="brand-icon" style="width: 32px; height: 32px; font-size: 1rem;">⚡</div>
                  <span class="brand-title" style="font-size: 1.15rem;">Campus<span>Care</span></span>
                </div>
                <div class="sidebar-role-tag">Admin Console</div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 6px;">
                  ${adminUser.name}
                </div>
              </div>

              <ul class="sidebar-menu">
                <li>
                  <a href="#/admin" class="sidebar-link active" data-route="/admin">
                    <span class="icon">📊</span> AI Queue Triage
                  </a>
                </li>
                <li>
                  <a href="#/admin/analytics" class="sidebar-link" data-route="/admin/analytics">
                    <span class="icon">📈</span> Predictive Analytics
                  </a>
                </li>
                <li>
                  <a href="#/dashboard" class="sidebar-link">
                    <span class="icon">🎓</span> Student View
                  </a>
                </li>
              </ul>
            </div>

            <div style="padding-top: 20px; border-top: 2px solid var(--color-border);">
              <button class="btn btn-outline btn-sm w-full" id="admin-export-pdf-sidebar-btn" style="box-shadow: none;">
                📥 Export PDF Audit
              </button>
            </div>
          </aside>

          <!-- Main Admin Content Area -->
          <main class="admin-main-content">
            <div class="page-header">
              <div>
                <h1 class="page-title">AI-Prioritized Complaint Queue</h1>
                <p class="page-subtitle">
                  Sorted dynamically by Urgency Keywords + Wait Duration + Student Upvote Impact
                </p>
              </div>

              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-accent btn-sm" id="admin-export-report-btn">
                  📄 Export PDF Report
                </button>
                <a href="#/admin/analytics" class="btn btn-secondary btn-sm">
                  📈 View Recurring Issues
                </a>
              </div>
            </div>

            <!-- Priority Stats Highlights -->
            <div class="stats-grid" style="margin-bottom: 24px;">
              <div class="stat-card" style="border-left: 6px solid var(--priority-critical);">
                <div>
                  <div class="stat-val" style="color: var(--priority-critical);">${criticalCount}</div>
                  <div class="stat-label">Critical Priority (AI Flagged)</div>
                </div>
                <div class="stat-icon-wrap" style="background: #FEE2E2; color: #DC2626;">🚨</div>
              </div>

              <div class="stat-card" style="border-left: 6px solid var(--priority-high);">
                <div>
                  <div class="stat-val" style="color: var(--priority-high);">${highCount}</div>
                  <div class="stat-label">High Priority Tickets</div>
                </div>
                <div class="stat-icon-wrap" style="background: #FFEDD5; color: #EA580C;">⚡</div>
              </div>

              <div class="stat-card" style="border-left: 6px solid #3B82F6;">
                <div>
                  <div class="stat-val" style="color: #1D4ED8;">${totalActive}</div>
                  <div class="stat-label">Open Active Queue</div>
                </div>
                <div class="stat-icon-wrap" style="background: #DBEAFE; color: #1D4ED8;">📋</div>
              </div>
            </div>

            <!-- Filters & Sort Bar -->
            <div class="card" style="padding: 16px; margin-bottom: 20px; background: #FFFFFF;">
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
                
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); display: block; margin-bottom: 2px;">STATUS</label>
                    <select id="admin-status-filter" class="form-control" style="padding: 6px 12px; font-size: 0.85rem; width: auto; min-width: 130px;">
                      <option value="All" ${statusFilter === 'All' ? 'selected' : ''}>All Statuses</option>
                      <option value="Submitted" ${statusFilter === 'Submitted' ? 'selected' : ''}>Submitted</option>
                      <option value="Acknowledged" ${statusFilter === 'Acknowledged' ? 'selected' : ''}>Acknowledged</option>
                      <option value="Assigned" ${statusFilter === 'Assigned' ? 'selected' : ''}>Assigned</option>
                      <option value="In Progress" ${statusFilter === 'In Progress' ? 'selected' : ''}>In Progress</option>
                      <option value="Resolved" ${statusFilter === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                  </div>

                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); display: block; margin-bottom: 2px;">CATEGORY</label>
                    <select id="admin-category-filter" class="form-control" style="padding: 6px 12px; font-size: 0.85rem; width: auto; min-width: 150px;">
                      <option value="All">All Categories</option>
                      ${CATEGORIES.map(c => `
                        <option value="${c.name}" ${categoryFilter === c.name ? 'selected' : ''}>${c.icon} ${c.name}</option>
                      `).join('')}
                    </select>
                  </div>

                  <div>
                    <label style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); display: block; margin-bottom: 2px;">SORT BY</label>
                    <select id="admin-sort-select" class="form-control" style="padding: 6px 12px; font-size: 0.85rem; width: auto; font-weight: 700; color: var(--color-primary);">
                      <option value="priority" ${sortBy === 'priority' ? 'selected' : ''}>⚡ AI Priority Score (High → Low)</option>
                      <option value="upvotes" ${sortBy === 'upvotes' ? 'selected' : ''}>▲ Student Upvotes</option>
                      <option value="date" ${sortBy === 'date' ? 'selected' : ''}>🕒 Submission Time</option>
                    </select>
                  </div>
                </div>

                <div style="min-width: 240px;">
                  <label style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); display: block; margin-bottom: 2px;">SEARCH QUEUE</label>
                  <input type="text" id="admin-search-input" class="form-control" placeholder="Search ticket #, title..." value="${searchQuery}" style="padding: 6px 12px; font-size: 0.85rem;">
                </div>

              </div>
            </div>

            <!-- Queue Table with AI Prioritization Score Badges -->
            <div class="table-container">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>AI Priority Score</th>
                    <th>Issue Summary & Location</th>
                    <th>Status</th>
                    <th>Upvotes</th>
                    <th>Assign Technician</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${complaints.length === 0 ? `
                    <tr>
                      <td colspan="7" style="text-align: center; padding: 32px; color: var(--color-text-muted);">
                        No complaints match your active filter criteria.
                      </td>
                    </tr>
                  ` : complaints.map(c => {
                    const p = c.priorityMetrics;
                    const statusClass = c.status.toLowerCase().replace(/\s+/g, '-');

                    return `
                      <tr>
                        <!-- Ticket ID -->
                        <td>
                          <a href="#/admin/complaints/${c.id}" style="font-weight: 800; color: var(--color-secondary);">
                            #${c.id}
                          </a>
                          <div style="font-size: 0.7rem; color: var(--color-text-light);">${new Date(c.createdAt).toLocaleDateString()}</div>
                        </td>

                        <!-- AI Priority Badge with score breakdown -->
                        <td>
                          <span class="badge ${p.badgeClass}" title="Score factors: Keywords (${p.factors.keywordScore}) + Wait (${p.factors.waitScore}) + Upvotes (${p.factors.upvoteScore}) + Hazard (${p.factors.categoryBase})">
                            ${p.tier} • ${p.score} pts
                          </span>
                        </td>

                        <!-- Issue Details -->
                        <td>
                          <div style="font-weight: 700; color: var(--color-secondary); margin-bottom: 2px;">
                            <a href="#/admin/complaints/${c.id}" style="color: inherit;">${c.title}</a>
                          </div>
                          <div style="font-size: 0.785rem; color: var(--color-text-muted);">
                            📍 <strong>${c.location}</strong> • <span class="badge badge-category" style="padding: 2px 6px; font-size: 0.7rem;">${c.category}</span>
                          </div>
                        </td>

                        <!-- Status Badge -->
                        <td>
                          <span class="badge badge-${statusClass}">
                            ● ${c.status}
                          </span>
                        </td>

                        <!-- Upvotes -->
                        <td>
                          <span style="font-weight: 800; font-size: 0.9rem; color: var(--color-secondary);">
                            ▲ ${c.upvotes || 0}
                          </span>
                        </td>

                        <!-- Quick Assign Technician Dropdown -->
                        <td>
                          <select class="form-control quick-assign-dropdown" data-complaint-id="${c.id}" style="padding: 4px 8px; font-size: 0.8rem; width: auto;">
                            <option value="">${c.assignedTo ? `👨‍🔧 ${c.assignedTo.name}` : '⚡ Quick Assign...'}</option>
                            ${staffList.map(s => `
                              <option value="${s.id}" ${c.assignedTo?.id === s.id ? 'selected' : ''}>
                                ${s.name} (${s.department.split('&')[0]})
                              </option>
                            `).join('')}
                          </select>
                        </td>

                        <!-- Actions -->
                        <td>
                          <a href="#/admin/complaints/${c.id}" class="btn btn-outline btn-sm" style="padding: 4px 10px; font-size: 0.785rem;">
                            Triage →
                          </a>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

          </main>
        </div>
      `;
    },

    onMount() {
      // PDF Export Handlers
      const triggerPdf = async () => {
        const btn = document.getElementById('admin-export-report-btn');
        if (btn) btn.innerHTML = '⏳ Generating PDF...';
        await api.exportReport();
        if (btn) btn.innerHTML = '📄 Export PDF Report';
      };

      document.getElementById('admin-export-report-btn')?.addEventListener('click', triggerPdf);
      document.getElementById('admin-export-pdf-sidebar-btn')?.addEventListener('click', triggerPdf);

      // Filters
      document.getElementById('admin-status-filter')?.addEventListener('change', (e) => {
        statusFilter = e.target.value;
        router.handleRoute();
      });

      document.getElementById('admin-category-filter')?.addEventListener('change', (e) => {
        categoryFilter = e.target.value;
        router.handleRoute();
      });

      document.getElementById('admin-sort-select')?.addEventListener('change', (e) => {
        sortBy = e.target.value;
        router.handleRoute();
      });

      document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        router.handleRoute();
      });

      // Quick Assign Dropdown Handlers
      document.querySelectorAll('.quick-assign-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', async (e) => {
          const complaintId = e.currentTarget.getAttribute('data-complaint-id');
          const staffId = e.target.value;
          if (!staffId) return;

          const staff = stateManager.getState().users.find(u => u.id === staffId);
          if (staff) {
            await api.assignTechnician(complaintId, staff);
            window.dispatchEvent(new CustomEvent('campuscare-toast', {
              detail: {
                type: 'success',
                title: 'Technician Assigned',
                message: `Assigned #${complaintId} to ${staff.name}. Simulated email dispatched.`
              }
            }));
            router.handleRoute();
          }
        });
      });
    }
  };
}


/* --- js/views/adminAnalytics.js --- */
/**
 * View: Admin Analytics & Predictive Recurring Issue Detection
 */


function createAdminAnalyticsView() {
  return {
    async render() {
      const state = stateManager.getState();
      const adminUser = state.currentUser || { name: 'Admin' };
      const analytics = await api.getAnalyticsData();

      const { summary, recurringIssues, categoryCounts } = analytics;

      return `
        <div class="admin-layout-container">
          <!-- Sidebar -->
          <aside class="sidebar">
            <div>
              <div class="sidebar-header">
                <div class="brand-logo" style="margin-bottom: 8px;">
                  <div class="brand-icon" style="width: 32px; height: 32px; font-size: 1rem;">⚡</div>
                  <span class="brand-title" style="font-size: 1.15rem;">Campus<span>Care</span></span>
                </div>
                <div class="sidebar-role-tag">Analytics Engine</div>
                <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 6px;">
                  ${adminUser.name}
                </div>
              </div>

              <ul class="sidebar-menu">
                <li>
                  <a href="#/admin" class="sidebar-link" data-route="/admin">
                    <span class="icon">📊</span> AI Queue Triage
                  </a>
                </li>
                <li>
                  <a href="#/admin/analytics" class="sidebar-link active" data-route="/admin/analytics">
                    <span class="icon">📈</span> Predictive Analytics
                  </a>
                </li>
                <li>
                  <a href="#/dashboard" class="sidebar-link">
                    <span class="icon">🎓</span> Student View
                  </a>
                </li>
              </ul>
            </div>

            <div style="padding-top: 20px; border-top: 2px solid var(--color-border);">
              <button class="btn btn-accent btn-sm w-full" id="analytics-export-pdf-sidebar-btn">
                📄 Export Audit PDF
              </button>
            </div>
          </aside>

          <!-- Main Analytics Area -->
          <main class="admin-main-content">
            <div class="page-header">
              <div>
                <h1 class="page-title">Campus Infrastructure Analytics</h1>
                <p class="page-subtitle">Predictive maintenance alerts, failure recurrence clustering, and resolution performance</p>
              </div>

              <button class="btn btn-accent btn-sm" id="analytics-export-pdf-btn">
                📄 Export Full PDF Report
              </button>
            </div>

            <!-- KPI Metric Cards -->
            <div class="stats-grid">
              <div class="stat-card">
                <div>
                  <div class="stat-val">${summary.total}</div>
                  <div class="stat-label">Total Logged Cases</div>
                </div>
                <div class="stat-icon-wrap" style="background: var(--color-primary-light); color: var(--color-primary);">📋</div>
              </div>

              <div class="stat-card">
                <div>
                  <div class="stat-val" style="color: #059669;">${summary.resolutionRate}%</div>
                  <div class="stat-label">Resolution SLA Rate</div>
                </div>
                <div class="stat-icon-wrap" style="background: #D1FAE5; color: #059669;">⚡</div>
              </div>

              <div class="stat-card">
                <div>
                  <div class="stat-val" style="color: #D97706;">${summary.avgResolutionHours}h</div>
                  <div class="stat-label">Average Turnaround Time</div>
                </div>
                <div class="stat-icon-wrap" style="background: #FEF3C7; color: #D97706;">⏱️</div>
              </div>

              <div class="stat-card">
                <div>
                  <div class="stat-val" style="color: #DC2626;">${recurringIssues.length}</div>
                  <div class="stat-label">High-Risk Clusters Flagged</div>
                </div>
                <div class="stat-icon-wrap" style="background: #FEE2E2; color: #DC2626;">⚠️</div>
              </div>
            </div>

            <!-- PREDICTIVE RECURRING ISSUE DETECTION PANEL (Flagged for Preventive Maintenance) -->
            <div style="margin-bottom: 28px;">
              <h2 style="font-size: 1.3rem; color: var(--color-secondary); margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
                <span>🛡️</span> AI Recurring Issue Detector (Threshold ≥ 3 Incidents)
              </h2>

              ${recurringIssues.length === 0 ? `
                <div class="card" style="padding: 24px; text-align: center; color: var(--color-text-muted);">
                  ✅ No recurring failure clusters detected. Campus infrastructure is operating within standard tolerances.
                </div>
              ` : recurringIssues.map(cluster => `
                <div class="alert-recurring">
                  <div class="alert-recurring-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="font-size: 1.5rem;">⚠️</span>
                      <div>
                        <h3 style="color: #991B1B; font-size: 1.15rem; margin: 0;">
                          ${cluster.location} — ${cluster.category}
                        </h3>
                        <div style="font-size: 0.8rem; color: #7F1D1D; font-weight: 600; margin-top: 2px;">
                          Pattern Detected: ${cluster.count} separate student complaints logged for this subsystem
                        </div>
                      </div>
                    </div>
                    <span class="alert-recurring-badge">Flagged for Preventive Maintenance</span>
                  </div>

                  <div style="background: rgba(255,255,255,0.85); border: 1.5px solid #FCA5A5; border-radius: var(--radius-md); padding: 14px; margin-top: 12px;">
                    <div style="font-weight: 800; font-size: 0.85rem; color: #991B1B; margin-bottom: 4px;">
                      🤖 AI Root-Cause Diagnostic & Recommendation:
                    </div>
                    <p style="font-size: 0.88rem; color: #7F1D1D; line-height: 1.4; margin-bottom: 10px;">
                      ${cluster.recommendation} Frequency indicates recurring component exhaustion rather than isolated wear.
                    </p>
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      ${cluster.complaints.map(c => `
                        <a href="#/admin/complaints/${c.id}" class="badge" style="background: #FFFFFF; color: #991B1B; border-color: #F87171; text-transform: none;">
                          #${c.id}: ${c.title.substring(0, 24)}...
                        </a>
                      `).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Visual Charts & Distribution Section -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
              
              <!-- Category Breakdown Bar Chart -->
              <div class="card">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 16px;">
                  📊 Complaints by Facility Category
                </h3>

                <div style="display: flex; flex-direction: column; gap: 14px;">
                  ${Object.entries(categoryCounts).map(([cat, count]) => {
                    const pct = Math.round((count / summary.total) * 100);
                    return `
                      <div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                          <span style="color: var(--color-secondary);">${cat}</span>
                          <span style="color: var(--color-primary);">${count} tickets (${pct}%)</span>
                        </div>
                        <div style="height: 10px; background: var(--color-bg-alt); border-radius: var(--radius-full); overflow: hidden; border: 1px solid var(--color-border);">
                          <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-hover) 100%); border-radius: var(--radius-full);"></div>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Status Pipeline Visual Distribution -->
              <div class="card">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 16px;">
                  ⚙️ Resolution Pipeline Status
                </h3>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                      <span style="color: #047857;">Resolved</span>
                      <span>${summary.resolved}</span>
                    </div>
                    <div style="height: 12px; background: var(--color-bg-alt); border-radius: var(--radius-full); overflow: hidden;">
                      <div style="height: 100%; width: ${Math.round((summary.resolved / summary.total) * 100)}%; background: #10B981;"></div>
                    </div>
                  </div>

                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                      <span style="color: #6D28D9;">Assigned / In Progress</span>
                      <span>${summary.inProgress}</span>
                    </div>
                    <div style="height: 12px; background: var(--color-bg-alt); border-radius: var(--radius-full); overflow: hidden;">
                      <div style="height: 100%; width: ${Math.round((summary.inProgress / summary.total) * 100)}%; background: #8B5CF6;"></div>
                    </div>
                  </div>

                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">
                      <span style="color: #B45309;">Submitted / Acknowledging</span>
                      <span>${summary.pending}</span>
                    </div>
                    <div style="height: 12px; background: var(--color-bg-alt); border-radius: var(--radius-full); overflow: hidden;">
                      <div style="height: 100%; width: ${Math.round((summary.pending / summary.total) * 100)}%; background: #F59E0B;"></div>
                    </div>
                  </div>
                </div>

                <div style="margin-top: 24px; padding: 14px; background: var(--color-bg-alt); border-radius: var(--radius-md); border: 1.5px solid var(--color-border); font-size: 0.825rem; color: var(--color-text-muted);">
                  💡 <strong>Recommendation:</strong> Allocate 2 additional electrical engineers to Hostel Block B to eliminate the recurring AC compressor bottleneck.
                </div>
              </div>

            </div>
          </main>
        </div>
      `;
    },

    onMount() {
      const triggerPdf = async () => {
        const btn = document.getElementById('analytics-export-pdf-btn');
        if (btn) btn.innerHTML = '⏳ Generating PDF...';
        await api.exportReport();
        if (btn) btn.innerHTML = '📄 Export Full PDF Report';
      };

      document.getElementById('analytics-export-pdf-btn')?.addEventListener('click', triggerPdf);
      document.getElementById('analytics-export-pdf-sidebar-btn')?.addEventListener('click', triggerPdf);
    }
  };
}


/* --- js/views/adminComplaintDetail.js --- */
/**
 * View: Admin Complaint Detail & Triage Console
 */



function createAdminComplaintDetailView(params) {
  const complaintId = params.id;

  return {
    async render() {
      let complaint = null;
      try {
        const res = await api.getComplaintById(complaintId);
        complaint = res.data;
      } catch {
        return `
          <div class="page-container" style="text-align: center; padding-top: 60px;">
            <h2 style="color: var(--color-primary);">Ticket Not Found</h2>
            <a href="#/admin" class="btn btn-primary">Return to Admin Queue</a>
          </div>
        `;
      }

      const state = stateManager.getState();
      const staffList = state.users.filter(u => u.role === 'staff');
      const p = complaint.priorityMetrics;

      return `
        <div class="page-container" style="max-width: 980px;">
          <!-- Breadcrumbs -->
          <div class="breadcrumbs">
            <a href="#/admin">Admin Queue</a>
            <span class="separator">/</span>
            <span class="current">Triage #${complaint.id}</span>
          </div>

          <div class="page-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="badge ${p.badgeClass}">${p.tier} Priority (${p.score} pts)</span>
                <span class="badge badge-${complaint.status.toLowerCase().replace(/\s+/g, '-')}">● ${complaint.status}</span>
                <span class="badge badge-category">${complaint.category}</span>
              </div>
              <h1 class="page-title" style="font-size: 1.8rem;">#${complaint.id}: ${complaint.title}</h1>
            </div>

            <div style="display: flex; gap: 10px;">
              <a href="#/admin" class="btn btn-outline btn-sm">← Back to Queue</a>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px;">
            
            <!-- Left Column: Details & Audit Trail -->
            <div>
              <div class="card card-chunky" style="margin-bottom: 24px;">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 12px;">Reported Details</h3>
                <p style="font-size: 0.95rem; line-height: 1.5; color: var(--color-text-main); margin-bottom: 20px;">
                  ${complaint.description}
                </p>

                ${complaint.photoUrl ? `
                  <div style="margin-bottom: 16px;">
                    <img src="${complaint.photoUrl}" alt="Proof" style="width: 100%; max-height: 240px; object-fit: cover; border-radius: var(--radius-md); border: 2px solid var(--color-border);">
                  </div>
                ` : ''}

                <!-- AI Score Factor Breakdown Box -->
                <div style="background: var(--color-bg-alt); border: 2px solid var(--color-secondary); border-radius: var(--radius-md); padding: 16px; margin-bottom: 18px;">
                  <div style="font-weight: 800; font-family: var(--font-display); font-size: 0.9rem; color: var(--color-secondary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                    <span>⚡</span> AI Smart Priority Diagnostic Breakdown
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; font-size: 0.8rem;">
                    <div>Keyword Urgency: <strong>+${p.factors.keywordScore} pts</strong></div>
                    <div>Wait Delay: <strong>+${p.factors.waitScore} pts</strong></div>
                    <div>Upvotes (${complaint.upvotes || 0}): <strong>+${p.factors.upvoteScore} pts</strong></div>
                    <div>Subsystem Base: <strong>+${p.factors.categoryBase} pts</strong></div>
                  </div>
                </div>

                <!-- Meta Table -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem; color: var(--color-text-muted);">
                  <div>
                    <span>Location:</span>
                    <strong style="display: block; color: var(--color-secondary);">${complaint.location} (${complaint.specificSpot || 'N/A'})</strong>
                  </div>
                  <div>
                    <span>Submitted By:</span>
                    <strong style="display: block; color: var(--color-secondary);">${complaint.submittedBy?.name} (${complaint.submittedBy?.email})</strong>
                  </div>
                </div>
              </div>

              <!-- Complete Audit Timeline -->
              <div class="card">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 14px;">📜 Ticket Audit Trail</h3>
                <div class="timeline">
                  ${(complaint.timeline || []).map(t => `
                    <div class="timeline-step completed">
                      <div class="timeline-icon-wrap">✓</div>
                      <div class="timeline-body">
                        <div class="timeline-title">${t.title}</div>
                        <div class="timeline-time">${new Date(t.timestamp).toLocaleString()} • ${t.actor || 'System'}</div>
                        <div class="timeline-desc">${t.description}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Right Column: Admin Actions Workbench -->
            <div>
              <div class="card card-chunky" style="background: #FFFFFF;">
                <div class="card-header" style="border-bottom: 2px solid var(--color-border); padding-bottom: 12px; margin-bottom: 20px;">
                  <h3 class="card-title" style="font-size: 1.1rem;">🛠️ Triage Actions</h3>
                </div>

                <form id="admin-triage-form">
                  <!-- Update Status -->
                  <div class="form-group">
                    <label class="form-label">Update Ticket Status</label>
                    <select id="admin-update-status" class="form-control">
                      <option value="Submitted" ${complaint.status === 'Submitted' ? 'selected' : ''}>Submitted (New)</option>
                      <option value="Acknowledged" ${complaint.status === 'Acknowledged' ? 'selected' : ''}>Acknowledged (Triaged)</option>
                      <option value="Assigned" ${complaint.status === 'Assigned' ? 'selected' : ''}>Assigned to Tech</option>
                      <option value="In Progress" ${complaint.status === 'In Progress' ? 'selected' : ''}>In Progress (On-site)</option>
                      <option value="Resolved" ${complaint.status === 'Resolved' ? 'selected' : ''}>Resolved (Complete)</option>
                      <option value="Rejected" ${complaint.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                  </div>

                  <!-- Assign Technician -->
                  <div class="form-group">
                    <label class="form-label">Assign Technician</label>
                    <select id="admin-assign-staff" class="form-control">
                      <option value="">-- Select Technician --</option>
                      ${staffList.map(s => `
                        <option value="${s.id}" ${complaint.assignedTo?.id === s.id ? 'selected' : ''}>
                          ${s.name} (${s.department})
                        </option>
                      `).join('')}
                    </select>
                  </div>

                  <!-- Estimated SLA -->
                  <div class="form-group">
                    <label class="form-label">Estimated SLA Turnaround</label>
                    <select id="admin-sla-select" class="form-control">
                      <option value="Within 4 Hours">Emergency: Within 4 Hours</option>
                      <option value="Within 24 Hours" selected>Standard: Within 24 Hours</option>
                      <option value="Within 48 Hours">Moderate: Within 48 Hours</option>
                      <option value="Next Scheduled Maintenance Window">Preventive: Scheduled Window</option>
                    </select>
                  </div>

                  <!-- Internal Note -->
                  <div class="form-group">
                    <label class="form-label">Triage & Resolution Note</label>
                    <textarea id="admin-note-input" class="form-control" placeholder="Add dispatch instructions or reason for status update..."></textarea>
                  </div>

                  <div style="padding: 12px; background: var(--color-bg-alt); border-radius: var(--radius-md); font-size: 0.775rem; color: var(--color-text-muted); margin-bottom: 20px;">
                    📧 <strong>Simulated Email Trigger:</strong> Saving changes will automatically dispatch an email update to <em>${complaint.submittedBy?.email}</em>.
                  </div>

                  <button type="submit" class="btn btn-primary w-full" id="admin-save-triage-btn">
                    💾 Save Changes & Notify Student
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      `;
    },

    onMount() {
      document.getElementById('admin-triage-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('admin-save-triage-btn');
        btn.disabled = true;
        btn.innerHTML = '⏳ Applying Triage...';

        const newStatus = document.getElementById('admin-update-status').value;
        const staffId = document.getElementById('admin-assign-staff').value;
        const sla = document.getElementById('admin-sla-select').value;
        const note = document.getElementById('admin-note-input').value.trim();

        if (staffId) {
          const staff = stateManager.getState().users.find(u => u.id === staffId);
          if (staff) {
            await api.assignTechnician(complaintId, staff, sla);
          }
        }

        await api.updateStatus(complaintId, newStatus, note, 'Dr. Radhika Menon (Admin)');

        window.dispatchEvent(new CustomEvent('campuscare-toast', {
          detail: {
            type: 'success',
            title: 'Triage Updated Successfully',
            message: `Ticket #${complaintId} status changed to ${newStatus}. Simulated email sent.`
          }
        }));

        router.navigate(`/admin`);
      });
    }
  };
}


/* --- js/views/staffDashboard.js --- */
/**
 * View: Staff / Technician Work Order Queue
 */



function createStaffDashboardView() {
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


/* --- js/views/staffComplaintDetail.js --- */
/**
 * View: Staff Ticket Detail & Resolution Workbench
 */



function createStaffComplaintDetailView(params) {
  const complaintId = params.id;

  return {
    async render() {
      let complaint = null;
      try {
        const res = await api.getComplaintById(complaintId);
        complaint = res.data;
      } catch {
        return `
          <div class="page-container" style="text-align: center; padding-top: 60px;">
            <h2 style="color: var(--color-primary);">Ticket Not Found</h2>
            <a href="#/staff" class="btn btn-primary">Return to Staff Queue</a>
          </div>
        `;
      }

      const isResolved = complaint.status === 'Resolved';
      const isInProgress = complaint.status === 'In Progress';

      return `
        <div class="page-container" style="max-width: 960px;">
          <!-- Breadcrumbs -->
          <div class="breadcrumbs">
            <a href="#/staff">Staff Work Orders</a>
            <span class="separator">/</span>
            <span class="current">Ticket #${complaint.id}</span>
          </div>

          <div class="page-header">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <span class="badge ${complaint.priorityMetrics.badgeClass}">${complaint.priorityMetrics.tier} Priority</span>
                <span class="badge badge-${complaint.status.toLowerCase().replace(/\s+/g, '-')}">● ${complaint.status}</span>
                <span class="badge badge-category">${complaint.category}</span>
              </div>
              <h1 class="page-title" style="font-size: 1.8rem;">#${complaint.id}: ${complaint.title}</h1>
            </div>

            <a href="#/staff" class="btn btn-outline btn-sm">← Back to Staff Queue</a>
          </div>

          <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px;">
            
            <!-- Left: Fault Details -->
            <div>
              <div class="card card-chunky" style="margin-bottom: 24px;">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 12px;">Fault Information</h3>
                <p style="font-size: 0.95rem; line-height: 1.5; color: var(--color-text-main); margin-bottom: 20px;">
                  ${complaint.description}
                </p>

                ${complaint.photoUrl ? `
                  <div style="margin-bottom: 16px;">
                    <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;">Student Attached Photo:</div>
                    <img src="${complaint.photoUrl}" alt="Fault" style="width: 100%; max-height: 240px; object-fit: cover; border-radius: var(--radius-md); border: 2px solid var(--color-border);">
                  </div>
                ` : ''}

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem; background: var(--color-bg-alt); padding: 14px; border-radius: var(--radius-md); border: 1.5px solid var(--color-border);">
                  <div>
                    <span style="color: var(--color-text-muted);">Exact Location:</span>
                    <strong style="display: block; color: var(--color-secondary);">${complaint.location}</strong>
                    <span style="color: var(--color-text-muted); font-size: 0.8rem;">${complaint.specificSpot || ''}</span>
                  </div>
                  <div>
                    <span style="color: var(--color-text-muted);">Contact Student:</span>
                    <strong style="display: block; color: var(--color-secondary);">${complaint.submittedBy?.name}</strong>
                    <span style="color: var(--color-text-muted); font-size: 0.8rem;">${complaint.submittedBy?.email}</span>
                  </div>
                </div>
              </div>

              <!-- Activity Log -->
              <div class="card">
                <h3 class="card-title" style="font-size: 1.1rem; margin-bottom: 14px;">Recent Work Order Updates</h3>
                <div class="timeline">
                  ${(complaint.timeline || []).map(t => `
                    <div class="timeline-step completed">
                      <div class="timeline-icon-wrap">✓</div>
                      <div class="timeline-body">
                        <div class="timeline-title">${t.title}</div>
                        <div class="timeline-time">${new Date(t.timestamp).toLocaleTimeString()} • ${t.actor}</div>
                        <div class="timeline-desc">${t.description}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Right: Technician Action Box -->
            <div>
              <div class="card card-chunky" style="background: #FFFFFF;">
                <div class="card-header" style="border-bottom: 2px solid var(--color-border); padding-bottom: 12px; margin-bottom: 20px;">
                  <h3 class="card-title" style="font-size: 1.1rem;">⚡ Field Actions</h3>
                  <span class="badge ${isResolved ? 'badge-resolved' : 'badge-in-progress'}">
                    ${isResolved ? 'Resolved' : 'Active Ticket'}
                  </span>
                </div>

                ${isResolved ? `
                  <div style="background: #F0FDF4; border: 2px solid #86EFAC; border-radius: var(--radius-md); padding: 20px; text-align: center;">
                    <div style="font-size: 2.5rem; margin-bottom: 8px;">✅</div>
                    <h3 style="color: #166534; font-size: 1.15rem; margin-bottom: 6px;">Ticket Marked as Resolved</h3>
                    <p style="font-size: 0.85rem; color: #15803D; margin-bottom: 14px;">
                      Resolution details and closure notice sent to student.
                    </p>
                    <div style="font-size: 0.825rem; background: #FFFFFF; padding: 10px; border-radius: var(--radius-sm); border: 1px solid #86EFAC; text-align: left;">
                      <strong>Note logged:</strong> ${complaint.resolutionProof || 'No additional notes'}
                    </div>
                  </div>
                ` : `
                  <!-- In-Progress Quick Trigger -->
                  ${!isInProgress ? `
                    <div style="margin-bottom: 20px;">
                      <button type="button" class="btn btn-secondary w-full" id="staff-mark-in-progress-btn">
                        🚚 Mark "In Progress" (On-Site Arrival)
                      </button>
                    </div>
                  ` : ''}

                  <!-- Resolution Form -->
                  <form id="staff-resolution-form">
                    <h4 style="font-size: 0.95rem; color: var(--color-secondary); margin-bottom: 10px;">
                      📝 Complete & Mark Resolved
                    </h4>

                    <div class="form-group">
                      <label class="form-label">Work Done & Fix Details <span class="required">*</span></label>
                      <textarea id="staff-fix-notes" class="form-control" placeholder="e.g. Replaced split capacitor, flushed drain line, and pressure tested unit." required></textarea>
                    </div>

                    <div class="form-group">
                      <label class="form-label">Replacement Parts Used (Optional)</label>
                      <input type="text" id="staff-parts-used" class="form-control" placeholder="e.g. 1x Capacitor 45uF, 2m CPVC Pipe">
                    </div>

                    <div style="padding: 12px; background: var(--color-bg-alt); border-radius: var(--radius-md); font-size: 0.775rem; color: var(--color-text-muted); margin-bottom: 18px;">
                      📧 <strong>Automated Student Notification:</strong> Submitting will trigger an instant email notification to <em>${complaint.submittedBy?.email}</em>.
                    </div>

                    <button type="submit" class="btn btn-primary w-full" id="staff-resolve-submit-btn" style="background: #059669; border-color: #047857; box-shadow: 0 4px 0 #047857;">
                      🎉 Mark as Resolved & Close Ticket
                    </button>
                  </form>
                `}
              </div>
            </div>

          </div>
        </div>
      `;
    },

    onMount() {
      // Mark In Progress
      document.getElementById('staff-mark-in-progress-btn')?.addEventListener('click', async () => {
        const staff = stateManager.getState().currentUser;
        await api.updateStatus(complaintId, 'In Progress', 'Technician arrived on-site with replacement components.', staff.name);
        
        window.dispatchEvent(new CustomEvent('campuscare-toast', {
          detail: {
            type: 'success',
            title: 'Status Updated: In Progress',
            message: 'Student notified that technician is working on-site.'
          }
        }));

        router.handleRoute();
      });

      // Mark Resolved Form
      document.getElementById('staff-resolution-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('staff-resolve-submit-btn');
        btn.disabled = true;
        btn.innerHTML = '⏳ Closing Ticket...';

        const notes = document.getElementById('staff-fix-notes').value.trim();
        const parts = document.getElementById('staff-parts-used')?.value.trim();
        const fullNote = parts ? `${notes} (Parts replaced: ${parts})` : notes;

        const staff = stateManager.getState().currentUser;
        await api.updateStatus(complaintId, 'Resolved', fullNote, `${staff.name} (Technician)`);

        // Confetti celebration
        if (window.confetti) {
          window.confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }

        window.dispatchEvent(new CustomEvent('campuscare-toast', {
          detail: {
            type: 'success',
            title: 'Issue Resolved! 🎉',
            message: `Ticket #${complaintId} closed. Student notified via email.`
          }
        }));

        router.handleRoute();
      });
    }
  };
}


/* --- js/app.js --- */
/**
 * CampusCare Main Application Bootstrapper
 * Connects Router, Views, Global Reactive State, Floating Mascot, and Toast System
 */


// Import Views











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



})();
