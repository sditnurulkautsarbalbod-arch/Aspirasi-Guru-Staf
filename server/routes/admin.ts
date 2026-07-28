import { Hono } from 'hono';
import { authMiddleware, requireRole, Env } from '../middleware/auth';
import {
  fetchAspirations,
  fetchAspirationById,
  updateAspirationRecord,
  deleteAspirationRecord,
  deleteBulkAspirations,
  deleteAllAspirations,
  exportAspirationsToExcel,
} from '../services/aspirationService';
import { memoryDb, isNeonConfigured, db } from '../db/index';
import { users, audit_logs } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const admin = new Hono<Env>();

// Apply auth and ADMIN role requirement to all admin routes
admin.use('*', authMiddleware, requireRole(['ADMIN']));

// Aspirations endpoints
admin.get('/aspirations', async (c) => {
  try {
    const q = c.req.query('q');
    const status = c.req.query('status');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '20', 10);

    const result = await fetchAspirations({
      q,
      status,
      startDate,
      endDate,
      page,
      limit,
    });

    return c.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Fetch aspirations error:', err);
    return c.json({ success: false, error: 'Gagal mengambil data aspirasi.' }, 500);
  }
});

admin.get('/aspirations/export', async (c) => {
  try {
    const buffer = await exportAspirationsToExcel();
    const today = new Date().toISOString().split('T')[0];
    const fileName = `aspirasi-internal-sdit-nurul-kautsar-${today}.xlsx`;

    const exactBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${fileName}"`);
    c.header('Content-Length', String(exactBuffer.byteLength));

    return c.body(exactBuffer);
  } catch (err: any) {
    console.error('Export Excel error:', err);
    return c.json({ success: false, error: 'Gagal mengeksport data Excel.' }, 500);
  }
});

admin.get('/aspirations/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid.' }, 400);
    }

    const item = await fetchAspirationById(id);
    if (!item) {
      return c.json({ success: false, error: 'Aspirasi tidak ditemukan.' }, 404);
    }

    return c.json({ success: true, data: item });
  } catch (err: any) {
    return c.json({ success: false, error: 'Gagal mengambil detail aspirasi.' }, 500);
  }
});

admin.patch('/aspirations/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const user = c.get('user');

    const updated = await updateAspirationRecord(
      id,
      {
        status: body.status,
        admin_note: body.admin_note,
      },
      String(user.id),
      user.role
    );

    return c.json({
      success: true,
      message: 'Status dan catatan tindak lanjut berhasil diperbarui.',
      data: updated,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Gagal memperbarui aspirasi.' }, 400);
  }
});

admin.delete('/aspirations/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid.' }, 400);
    }

    const user = c.get('user');
    await deleteAspirationRecord(id, String(user.id));

    return c.json({
      success: true,
      message: 'Aspirasi berhasil dihapus.',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Gagal menghapus aspirasi.' }, 400);
  }
});

admin.post('/aspirations/bulk-delete', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { type, ids } = body;
    const user = c.get('user');

    if (type === 'all') {
      await deleteAllAspirations(String(user.id));
      return c.json({
        success: true,
        message: 'Semua rekaman pesan aspirasi berhasil dihapus.',
      });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: 'Pilih minimal satu pesan aspirasi untuk dihapus.' }, 400);
    }

    await deleteBulkAspirations(ids, String(user.id));
    return c.json({
      success: true,
      message: `${ids.length} pesan aspirasi berhasil dihapus.`,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Gagal melakukan penghapusan massal.' }, 500);
  }
});

// User Management Endpoints
admin.get('/users', async (c) => {
  try {
    let userList = [];
    if (isNeonConfigured && db) {
      const res = await db.select().from(users);
      userList = res.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        password: u.plain_password || '********',
        role: u.role,
        is_active: u.is_active,
        is_super_admin: u.is_super_admin,
        created_at: u.created_at,
      }));
    } else {
      userList = await memoryDb.getAllUsers();
    }

    return c.json({ success: true, data: userList });
  } catch (err: any) {
    console.error('Error fetching users:', err);
    return c.json({ success: false, error: err.message || 'Gagal mengambil daftar pengguna.' }, 500);
  }
});

admin.post('/users', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const username = (body.username || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const confirmPassword = (body.confirmPassword || '').trim();
    const role = (body.role || '').trim();

    if (!name || !username || !password || !role) {
      return c.json({ success: false, error: 'Semua field wajib diisi.' }, 400);
    }

    if (username.length < 3) {
      return c.json({ success: false, error: 'Username minimal 3 karakter.' }, 400);
    }

    if (password.length < 8) {
      return c.json({ success: false, error: 'Password minimal 8 karakter.' }, 400);
    }

    if (password !== confirmPassword) {
      return c.json({ success: false, error: 'Konfirmasi password tidak cocok.' }, 400);
    }

    const allowedRoles = ['ADMIN', 'WAKASEK', 'KEPALA_SEKOLAH'];
    if (!allowedRoles.includes(role)) {
      return c.json({ success: false, error: 'Role tidak valid.' }, 400);
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const currentUser = c.get('user');

    if (isNeonConfigured && db) {
      const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existing.length > 0) {
        return c.json({ success: false, error: 'Username sudah digunakan.' }, 400);
      }

      const inserted = await db
        .insert(users)
        .values({
          name,
          username,
          password_hash,
          plain_password: password,
          role,
          is_active: true,
          is_super_admin: false,
        })
        .returning();

      await db.insert(audit_logs).values({
        user_id: String(currentUser.id),
        action: 'CREATE_USER',
        entity: 'USER',
        entity_id: String(inserted[0].id),
      });

      return c.json(
        {
          success: true,
          message: 'Pengguna berhasil ditambahkan.',
          data: {
            id: inserted[0].id,
            name: inserted[0].name,
            username: inserted[0].username,
            password: inserted[0].plain_password || password,
            role: inserted[0].role,
            is_super_admin: inserted[0].is_super_admin,
          },
        },
        201
      );
    } else {
      const newUser = await memoryDb.createUser({ name, username, password_hash, plain_password: password, role });
      await memoryDb.addAuditLog({
        user_id: String(currentUser.id),
        action: 'CREATE_USER',
        entity: 'USER',
        entity_id: String(newUser.id),
      });

      return c.json(
        {
          success: true,
          message: 'Pengguna berhasil ditambahkan.',
          data: {
            id: newUser.id,
            name: newUser.name,
            username: newUser.username,
            password: newUser.plain_password || password,
            role: newUser.role,
            is_super_admin: newUser.is_super_admin,
          },
        },
        201
      );
    }
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Gagal menambahkan pengguna.' }, 400);
  }
});

admin.put('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const name = (body.name || '').trim();
    const username = (body.username || '').trim().toLowerCase();
    const role = (body.role || '').trim();
    const password = (body.password || '').trim();
    const confirmPassword = (body.confirmPassword || '').trim();

    if (!name || !username || !role) {
      return c.json({ success: false, error: 'Nama, username, dan role wajib diisi.' }, 400);
    }

    if (username.length < 3) {
      return c.json({ success: false, error: 'Username minimal 3 karakter.' }, 400);
    }

    const allowedRoles = ['ADMIN', 'WAKASEK', 'KEPALA_SEKOLAH'];
    if (!allowedRoles.includes(role)) {
      return c.json({ success: false, error: 'Role tidak valid.' }, 400);
    }

    let password_hash: string | undefined = undefined;
    let plain_password: string | undefined = undefined;

    if (password) {
      if (password.length < 8) {
        return c.json({ success: false, error: 'Password baru minimal 8 karakter.' }, 400);
      }
      if (password !== confirmPassword) {
        return c.json({ success: false, error: 'Konfirmasi password tidak cocok.' }, 400);
      }
      password_hash = bcrypt.hashSync(password, 10);
      plain_password = password;
    }

    const currentUser = c.get('user');

    if (isNeonConfigured && db) {
      const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existing.length === 0) {
        return c.json({ success: false, error: 'Pengguna tidak ditemukan.' }, 404);
      }

      if (username !== existing[0].username) {
        const checkUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
        if (checkUsername.length > 0) {
          return c.json({ success: false, error: 'Username sudah digunakan oleh pengguna lain.' }, 400);
        }
      }

      const updateData: any = {
        name,
        username,
        role: existing[0].is_super_admin ? existing[0].role : role,
        updated_at: new Date(),
      };

      if (password_hash) {
        updateData.password_hash = password_hash;
        updateData.plain_password = plain_password;
      }

      await db.update(users).set(updateData).where(eq(users.id, id));

      await db.insert(audit_logs).values({
        user_id: String(currentUser.id),
        action: 'UPDATE_USER',
        entity: 'USER',
        entity_id: String(id),
      });
    } else {
      await memoryDb.updateUser(id, {
        name,
        username,
        role,
        password_hash,
        plain_password,
      });

      await memoryDb.addAuditLog({
        user_id: String(currentUser.id),
        action: 'UPDATE_USER',
        entity: 'USER',
        entity_id: String(id),
      });
    }

    return c.json({ success: true, message: 'Data pengguna berhasil diperbarui.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Gagal memperbarui data pengguna.' }, 400);
  }
});

admin.patch('/users/:id/password', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid.' }, 400);
    }

    const body = await c.req.json().catch(() => ({}));
    const newPassword = (body.password || '').trim();
    const confirmPassword = (body.confirmPassword || '').trim();

    if (!newPassword || newPassword.length < 8) {
      return c.json({ success: false, error: 'Password baru minimal 8 karakter.' }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ success: false, error: 'Konfirmasi password baru tidak cocok.' }, 400);
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    const currentUser = c.get('user');

    if (isNeonConfigured && db) {
      const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existing.length === 0) {
        return c.json({ success: false, error: 'Pengguna tidak ditemukan.' }, 404);
      }

      await db
        .update(users)
        .set({ password_hash, plain_password: newPassword, updated_at: new Date() })
        .where(eq(users.id, id));

      await db.insert(audit_logs).values({
        user_id: String(currentUser.id),
        action: 'UPDATE_PASSWORD',
        entity: 'USER',
        entity_id: String(id),
      });
    } else {
      await memoryDb.updateUserPassword(id, password_hash, newPassword);
      await memoryDb.addAuditLog({
        user_id: String(currentUser.id),
        action: 'UPDATE_PASSWORD',
        entity: 'USER',
        entity_id: String(id),
      });
    }

    return c.json({ success: true, message: 'Password pengguna berhasil diperbarui.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Gagal mengubah password.' }, 400);
  }
});

admin.delete('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id)) {
      return c.json({ success: false, error: 'ID tidak valid.' }, 400);
    }

    const currentUser = c.get('user');

    if (isNeonConfigured && db) {
      const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existing.length === 0) {
        return c.json({ success: false, error: 'Pengguna tidak ditemukan.' }, 404);
      }

      if (existing[0].is_super_admin) {
        return c.json({ success: false, error: 'Admin utama tidak dapat dihapus.' }, 400);
      }

      await db.delete(users).where(eq(users.id, id));

      await db.insert(audit_logs).values({
        user_id: String(currentUser.id),
        action: 'DELETE_USER',
        entity: 'USER',
        entity_id: String(id),
      });
    } else {
      await memoryDb.deleteUser(id);
      await memoryDb.addAuditLog({
        user_id: String(currentUser.id),
        action: 'DELETE_USER',
        entity: 'USER',
        entity_id: String(id),
      });
    }

    return c.json({ success: true, message: 'Pengguna berhasil dihapus.' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Gagal menghapus pengguna.' }, 400);
  }
});

export default admin;
