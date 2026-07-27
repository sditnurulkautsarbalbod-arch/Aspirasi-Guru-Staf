export type UserRole = 'ADMIN' | 'WAKASEK' | 'KEPALA_SEKOLAH';

export type AspirationStatus = 'BARU' | 'DITINJAU' | 'DITINDAKLANJUTI' | 'SELESAI';

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  is_active?: boolean;
  is_super_admin: boolean;
  created_at?: string;
}

export interface Aspiration {
  id: number;
  message: string;
  status: AspirationStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AspirationStats {
  total: number;
  baru: number;
  ditinjau: number;
  ditindaklanjuti: number;
  selesai: number;
}

export interface AspirationsListResponse {
  items: Aspiration[];
  pagination: PaginationInfo;
  stats: AspirationStats;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}
