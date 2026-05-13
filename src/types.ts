export type UserRole = 'master_admin' | 'admin' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  last_visit?: string;
  last_service?: string;
  last_bill_amount?: number;
  created_at?: string;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  commission_pct: number;
  duration_mins: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
  unit: string;
  price: number;
  image_url?: string;
}

export interface Appointment {
  id: number;
  customer_id: number;
  employee_id: number;
  service_id: number;
  start_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  employee_name?: string;
  service_name?: string;
}

export interface Transaction {
  id: number;
  appointment_id?: number;
  customer_id: number;
  employee_id: number;
  total_amount: number;
  commission_amount: number;
  payment_method: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  salonProfit: number;
  appointments: number;
  customers: number;
  pendingCommission?: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentRevenue: { date: string; amount: number }[];
  topServices: { name: string; count: number }[];
  recentAppointments: Appointment[];
}
