import { Lead, Agent, Visit } from '@/types/crm';

export const mockAgents: Agent[] = [
  { id: 'a1', name: 'Priya Sharma', activeLeads: 12, totalLeads: 45, avgResponseTime: 3.2, conversions: 8, visitsScheduled: 15 },
  { id: 'a2', name: 'Rahul Verma', activeLeads: 9, totalLeads: 38, avgResponseTime: 4.1, conversions: 6, visitsScheduled: 12 },
  { id: 'a3', name: 'Anita Desai', activeLeads: 14, totalLeads: 52, avgResponseTime: 2.8, conversions: 11, visitsScheduled: 18 },
  { id: 'a4', name: 'Vikram Singh', activeLeads: 7, totalLeads: 29, avgResponseTime: 5.5, conversions: 4, visitsScheduled: 9 },
];

export const mockLeads: Lead[] = [
  { id: 'l1', name: 'Aarav Patel', phone: '+91 98765 43210', source: 'whatsapp', status: 'new', assignedAgent: 'Priya Sharma', createdAt: '2026-03-08T09:15:00', lastActivity: '2026-03-08T09:15:00', budget: '₹8,000-12,000', preferredLocation: 'Koramangala' },
  { id: 'l2', name: 'Sneha Reddy', phone: '+91 87654 32109', source: 'website', status: 'contacted', assignedAgent: 'Rahul Verma', createdAt: '2026-03-08T08:30:00', lastActivity: '2026-03-08T08:45:00', firstResponseTime: 3, budget: '₹10,000-15,000', preferredLocation: 'HSR Layout' },
  { id: 'l3', name: 'Karan Mehta', phone: '+91 76543 21098', source: 'instagram', status: 'requirement_collected', assignedAgent: 'Anita Desai', createdAt: '2026-03-07T14:00:00', lastActivity: '2026-03-08T10:00:00', firstResponseTime: 2, budget: '₹7,000-10,000', preferredLocation: 'BTM Layout' },
  { id: 'l4', name: 'Divya Nair', phone: '+91 65432 10987', source: 'facebook', status: 'property_suggested', assignedAgent: 'Priya Sharma', createdAt: '2026-03-06T11:00:00', lastActivity: '2026-03-08T09:30:00', firstResponseTime: 4, budget: '₹12,000-18,000', preferredLocation: 'Indiranagar', property: 'Gharpayy Residency - Indiranagar' },
  { id: 'l5', name: 'Rohit Kumar', phone: '+91 54321 09876', source: 'phone', status: 'visit_scheduled', assignedAgent: 'Vikram Singh', createdAt: '2026-03-05T16:00:00', lastActivity: '2026-03-08T11:00:00', firstResponseTime: 1, budget: '₹9,000-13,000', preferredLocation: 'Marathahalli', visitDate: '2026-03-10T14:00:00', property: 'Gharpayy Heights - Marathahalli' },
  { id: 'l6', name: 'Meera Joshi', phone: '+91 43210 98765', source: 'landing_page', status: 'visit_completed', assignedAgent: 'Anita Desai', createdAt: '2026-03-03T10:00:00', lastActivity: '2026-03-07T16:00:00', firstResponseTime: 2, budget: '₹11,000-16,000', preferredLocation: 'Whitefield', visitOutcome: 'considering', property: 'Gharpayy Villa - Whitefield' },
  { id: 'l7', name: 'Arjun Kapoor', phone: '+91 32109 87654', source: 'whatsapp', status: 'booked', assignedAgent: 'Rahul Verma', createdAt: '2026-02-28T09:00:00', lastActivity: '2026-03-06T14:00:00', firstResponseTime: 3, budget: '₹10,000-14,000', preferredLocation: 'Electronic City', property: 'Gharpayy Nest - Electronic City' },
  { id: 'l8', name: 'Pooja Gupta', phone: '+91 21098 76543', source: 'website', status: 'lost', assignedAgent: 'Vikram Singh', createdAt: '2026-02-25T13:00:00', lastActivity: '2026-03-04T10:00:00', firstResponseTime: 7, budget: '₹6,000-8,000', preferredLocation: 'Yelahanka', notes: 'Found accommodation elsewhere' },
  { id: 'l9', name: 'Nikhil Agarwal', phone: '+91 10987 65432', source: 'whatsapp', status: 'new', assignedAgent: 'Anita Desai', createdAt: '2026-03-08T10:30:00', lastActivity: '2026-03-08T10:30:00', budget: '₹8,500-12,000', preferredLocation: 'JP Nagar' },
  { id: 'l10', name: 'Riya Chatterjee', phone: '+91 98712 34567', source: 'instagram', status: 'contacted', assignedAgent: 'Priya Sharma', createdAt: '2026-03-08T07:00:00', lastActivity: '2026-03-08T07:12:00', firstResponseTime: 4, budget: '₹9,000-11,000', preferredLocation: 'Koramangala' },
  { id: 'l11', name: 'Amit Saxena', phone: '+91 87612 34567', source: 'phone', status: 'new', assignedAgent: 'Rahul Verma', createdAt: '2026-03-08T10:45:00', lastActivity: '2026-03-08T10:45:00', budget: '₹7,500-10,000', preferredLocation: 'HSR Layout' },
  { id: 'l12', name: 'Tanvi Shah', phone: '+91 76512 34567', source: 'landing_page', status: 'requirement_collected', assignedAgent: 'Vikram Singh', createdAt: '2026-03-07T09:00:00', lastActivity: '2026-03-08T08:00:00', firstResponseTime: 5, budget: '₹13,000-18,000', preferredLocation: 'Indiranagar' },
  { id: 'l13', name: 'Suresh Iyer', phone: '+91 65412 34567', source: 'website', status: 'visit_scheduled', assignedAgent: 'Anita Desai', createdAt: '2026-03-06T15:00:00', lastActivity: '2026-03-08T09:00:00', firstResponseTime: 2, budget: '₹10,000-15,000', preferredLocation: 'Whitefield', visitDate: '2026-03-09T11:00:00', property: 'Gharpayy Villa - Whitefield' },
  { id: 'l14', name: 'Kavita Rao', phone: '+91 54312 34567', source: 'facebook', status: 'property_suggested', assignedAgent: 'Priya Sharma', createdAt: '2026-03-05T12:00:00', lastActivity: '2026-03-07T18:00:00', firstResponseTime: 3, budget: '₹8,000-11,000', preferredLocation: 'BTM Layout', property: 'Gharpayy Homes - BTM' },
];

export const mockVisits: Visit[] = [
  { id: 'v1', leadId: 'l5', leadName: 'Rohit Kumar', property: 'Gharpayy Heights - Marathahalli', dateTime: '2026-03-10T14:00:00', assignedStaff: 'Vikram Singh', confirmed: true },
  { id: 'v2', leadId: 'l13', leadName: 'Suresh Iyer', property: 'Gharpayy Villa - Whitefield', dateTime: '2026-03-09T11:00:00', assignedStaff: 'Anita Desai', confirmed: true },
  { id: 'v3', leadId: 'l6', leadName: 'Meera Joshi', property: 'Gharpayy Villa - Whitefield', dateTime: '2026-03-07T15:00:00', assignedStaff: 'Anita Desai', confirmed: true, outcome: 'considering' },
  { id: 'v4', leadId: 'l4', leadName: 'Divya Nair', property: 'Gharpayy Residency - Indiranagar', dateTime: '2026-03-11T10:00:00', assignedStaff: 'Priya Sharma', confirmed: false },
];

export const dashboardStats = {
  totalLeads: 147,
  newToday: 8,
  avgResponseTime: 3.9,
  visitsScheduled: 12,
  visitsCompleted: 34,
  bookingsClosed: 29,
  conversionRate: 19.7,
  responseWithinSLA: 82,
};
