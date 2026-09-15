/**
 * CampusCare Master Taxonomy Layer
 */

export const INITIAL_USERS = [];

export const CAMPUS_LOCATIONS = [
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

export const CATEGORIES = [
  { id: 'electrical', name: 'Electrical & Power', icon: '⚡', department: 'Electrical & HVAC Maintenance' },
  { id: 'hvac', name: 'AC & Ventilation', icon: '❄️', department: 'Electrical & HVAC Maintenance' },
  { id: 'wifi', name: 'Wi-Fi & Network', icon: '📶', department: 'IT & Network Infrastructure' },
  { id: 'plumbing', name: 'Plumbing & Water', icon: '🚰', department: 'Plumbing & Sanitation' },
  { id: 'furniture', name: 'Furniture & Carpentry', icon: '🪑', department: 'Estate & Civil Works' },
  { id: 'sanitation', name: 'Sanitation & Cleanliness', icon: '🧹', department: 'Plumbing & Sanitation' },
  { id: 'classroom_av', name: 'Classroom AV & Projector', icon: '📽️', department: 'IT & Network Infrastructure' },
  { id: 'security', name: 'Safety & Streetlights', icon: '🛡️', department: 'Campus Security & Electrical' }
];

export const INITIAL_COMPLAINTS = [];
