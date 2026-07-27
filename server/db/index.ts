import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

// In-memory fallback repository for local preview when DATABASE_URL is not set
interface UserRecord {
  id: number;
  name: string;
  username: string;
  password_hash: string;
  plain_password?: string;
  role: string;
  is_active: boolean;
  is_super_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

interface AspirationRecord {
  id: number;
  message: string;
  status: string;
  admin_note: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface AuditLogRecord {
  id: number;
  user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: Date;
}

class MemoryDb {
  users: UserRecord[] = [];
  aspirations: AspirationRecord[] = [];
  audit_logs: AuditLogRecord[] = [];
  private userSeq = 1;
  private aspSeq = 1;
  private logSeq = 1;

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // Hashes for default users
    const adminPassHash = bcrypt.hashSync('admin890', 10);
    const wakasekPassHash = bcrypt.hashSync('wakasek890', 10);
    const kepsekPassHash = bcrypt.hashSync('kepsek890', 10);

    this.users.push(
      {
        id: this.userSeq++,
        name: 'Administrator',
        username: 'admin',
        password_hash: adminPassHash,
        plain_password: 'admin890',
        role: 'ADMIN',
        is_active: true,
        is_super_admin: true,
        created_at: new Date('2026-07-27T00:00:00Z'),
        updated_at: new Date('2026-07-27T00:00:00Z'),
      },
      {
        id: this.userSeq++,
        name: 'Wakil Kepala Sekolah Bidang Kurikulum',
        username: 'wakasek',
        password_hash: wakasekPassHash,
        plain_password: 'wakasek890',
        role: 'WAKASEK',
        is_active: true,
        is_super_admin: false,
        created_at: new Date('2026-07-27T00:00:00Z'),
        updated_at: new Date('2026-07-27T00:00:00Z'),
      },
      {
        id: this.userSeq++,
        name: 'Kepala Sekolah',
        username: 'kepsek',
        password_hash: kepsekPassHash,
        plain_password: 'kepsek890',
        role: 'KEPALA_SEKOLAH',
        is_active: true,
        is_super_admin: false,
        created_at: new Date('2026-07-27T00:00:00Z'),
        updated_at: new Date('2026-07-27T00:00:00Z'),
      }
    );

    // Aspirations list starts empty for production
    this.aspirations = [];
  }

  // Users methods
  async getUserByUsername(username: string) {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.is_active);
  }

  async getUserById(id: number) {
    return this.users.find((u) => u.id === id);
  }

  async getAllUsers() {
    return this.users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      password: u.plain_password || '********',
      role: u.role,
      is_active: u.is_active,
      is_super_admin: u.is_super_admin,
      created_at: u.created_at,
    }));
  }

  async createUser(data: { name: string; username: string; password_hash: string; plain_password?: string; role: string }) {
    const existing = await this.getUserByUsername(data.username);
    if (existing) {
      throw new Error('Username sudah digunakan');
    }
    const newUser: UserRecord = {
      id: this.userSeq++,
      name: data.name,
      username: data.username,
      password_hash: data.password_hash,
      plain_password: data.plain_password,
      role: data.role,
      is_active: true,
      is_super_admin: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, data: { name?: string; username?: string; role?: string; password_hash?: string; plain_password?: string }) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('Pengguna tidak ditemukan');

    if (data.username && data.username.toLowerCase() !== user.username.toLowerCase()) {
      const existing = this.users.find((u) => u.username.toLowerCase() === data.username!.toLowerCase() && u.id !== id);
      if (existing) throw new Error('Username sudah digunakan');
      user.username = data.username;
    }

    if (data.name) user.name = data.name;
    if (data.role && !user.is_super_admin) user.role = data.role;
    if (data.password_hash) {
      user.password_hash = data.password_hash;
      user.plain_password = data.plain_password;
    }
    user.updated_at = new Date();
    return user;
  }

  async updateUserPassword(id: number, password_hash: string, plain_password?: string) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('Pengguna tidak ditemukan');
    user.password_hash = password_hash;
    if (plain_password) user.plain_password = plain_password;
    user.updated_at = new Date();
    return user;
  }

  async deleteUser(id: number) {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new Error('Pengguna tidak ditemukan');
    if (user.is_super_admin) throw new Error('Admin utama tidak dapat dihapus');
    this.users = this.users.filter((u) => u.id !== id);
    return true;
  }

  // Aspirations methods
  async createAspiration(message: string) {
    const newAsp: AspirationRecord = {
      id: this.aspSeq++,
      message,
      status: 'BARU',
      admin_note: null,
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.aspirations.unshift(newAsp);
    return newAsp;
  }

  async getAspirations(params: {
    q?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    let list = this.aspirations.filter((a) => !a.deleted_at);

    if (params.q) {
      const q = params.q.toLowerCase().trim();
      list = list.filter((a) => a.message.toLowerCase().includes(q));
    }

    if (params.status && params.status !== 'ALL') {
      list = list.filter((a) => a.status === params.status);
    }

    if (params.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      list = list.filter((a) => new Date(a.created_at) >= start);
    }

    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter((a) => new Date(a.created_at) <= end);
    }

    // Sort newest to oldest
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const page = params.page || 1;
    const limit = params.limit || 20;
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = list.slice(offset, offset + limit);

    // Calculate stats
    const allActive = this.aspirations.filter((a) => !a.deleted_at);
    const stats = {
      total: allActive.length,
      baru: allActive.filter((a) => a.status === 'BARU').length,
      ditinjau: allActive.filter((a) => a.status === 'DITINJAU').length,
      ditindaklanjuti: allActive.filter((a) => a.status === 'DITINDAKLANJUTI').length,
      selesai: allActive.filter((a) => a.status === 'SELESAI').length,
    };

    return {
      items: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats,
    };
  }

  async getAspirationById(id: number) {
    const asp = this.aspirations.find((a) => a.id === id && !a.deleted_at);
    return asp || null;
  }

  async updateAspiration(id: number, data: { status?: string; admin_note?: string }) {
    const asp = this.aspirations.find((a) => a.id === id && !a.deleted_at);
    if (!asp) throw new Error('Aspirasi tidak ditemukan');
    if (data.status) asp.status = data.status;
    if (data.admin_note !== undefined) asp.admin_note = data.admin_note;
    asp.updated_at = new Date();
    return asp;
  }

  async deleteAspiration(id: number) {
    const asp = this.aspirations.find((a) => a.id === id && !a.deleted_at);
    if (!asp) throw new Error('Aspirasi tidak ditemukan');
    asp.deleted_at = new Date();
    return true;
  }

  async addAuditLog(log: { user_id: string; action: string; entity: string; entity_id: string }) {
    this.audit_logs.push({
      id: this.logSeq++,
      user_id: log.user_id,
      action: log.action,
      entity: log.entity,
      entity_id: log.entity_id,
      created_at: new Date(),
    });
  }
}

export const memoryDb = new MemoryDb();

const databaseUrl = process.env.DATABASE_URL;

export const isNeonConfigured = !!(
  databaseUrl &&
  databaseUrl.startsWith('postgres') &&
  !databaseUrl.includes('example-123456')
);

export let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

if (isNeonConfigured) {
  try {
    const sql = neon(databaseUrl!);
    db = drizzle(sql, { schema });

    // Auto-create database tables if they do not exist
    (async () => {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            plain_password TEXT,
            role TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            is_super_admin BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `;
        await sql`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password TEXT;
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS aspirations (
            id SERIAL PRIMARY KEY,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'BARU',
            admin_note TEXT,
            deleted_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            entity TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `;

        // Check if users exist in Neon DB, if not, seed default admin users
        const existingUsers = await sql`SELECT id FROM users LIMIT 1;`;
        if (existingUsers.length === 0) {
          const adminPassHash = bcrypt.hashSync('admin890', 10);
          const wakasekPassHash = bcrypt.hashSync('wakasek890', 10);
          const kepsekPassHash = bcrypt.hashSync('kepsek890', 10);

          await sql`
            INSERT INTO users (name, username, password_hash, plain_password, role, is_active, is_super_admin)
            VALUES 
              ('Administrator', 'admin', ${adminPassHash}, 'admin890', 'ADMIN', true, true),
              ('Wakil Kepala Sekolah', 'wakasek', ${wakasekPassHash}, 'wakasek890', 'WAKASEK', true, false),
              ('Kepala Sekolah', 'kepsek', ${kepsekPassHash}, 'kepsek890', 'KEPALA_SEKOLAH', true, false)
            ON CONFLICT (username) DO NOTHING;
          `;
          console.log('Seeded default users to Neon PostgreSQL.');
        } else {
          // Update default users plain_password if null
          await sql`UPDATE users SET plain_password = 'admin890' WHERE username = 'admin' AND (plain_password IS NULL OR plain_password = '');`;
          await sql`UPDATE users SET plain_password = 'wakasek890' WHERE username = 'wakasek' AND (plain_password IS NULL OR plain_password = '');`;
          await sql`UPDATE users SET plain_password = 'kepsek890' WHERE username = 'kepsek' AND (plain_password IS NULL OR plain_password = '');`;
        }
      } catch (schemaErr) {
        console.error('Failed to auto-initialize Neon DB schema:', schemaErr);
      }
    })();
  } catch (err) {
    console.error('Failed to initialize Neon Postgres connection:', err);
    db = null;
  }
}
