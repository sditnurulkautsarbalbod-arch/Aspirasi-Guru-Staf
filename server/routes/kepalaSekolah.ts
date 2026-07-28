import { Hono } from 'hono';
import { authMiddleware, requireRole, Env } from '../middleware/auth';
import {
  fetchAspirations,
  fetchAspirationById,
  updateAspirationRecord,
  deleteBulkAspirations,
  deleteAllAspirations,
  exportAspirationsToExcel,
} from '../services/aspirationService';

const kepalaSekolah = new Hono<Env>();

kepalaSekolah.use('*', authMiddleware, requireRole(['KEPALA_SEKOLAH', 'ADMIN']));

kepalaSekolah.get('/aspirations', async (c) => {
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
    return c.json({ success: false, error: 'Gagal mengambil data aspirasi.' }, 500);
  }
});

kepalaSekolah.get('/aspirations/export', async (c) => {
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

kepalaSekolah.get('/aspirations/:id', async (c) => {
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

kepalaSekolah.patch('/aspirations/:id', async (c) => {
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

kepalaSekolah.post('/aspirations/bulk-delete', async (c) => {
  const user = c.get('user');
  if (user.role !== 'ADMIN') {
    return c.json({ success: false, error: 'Hanya Admin yang memiliki wewenang untuk menghapus aspirasi.' }, 403);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const { type, ids } = body;

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

export default kepalaSekolah;
