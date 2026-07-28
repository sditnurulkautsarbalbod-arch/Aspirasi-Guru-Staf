import { memoryDb, isNeonConfigured, db } from '../db/index';
import { aspirations, users, audit_logs } from '../db/schema';
import { eq, and, isNull, ilike, gte, lte, desc, count, sql, inArray } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export interface AspirationQueryParams {
  q?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function fetchAspirations(params: AspirationQueryParams) {
  if (isNeonConfigured && db) {
    try {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;

      const conditions = [isNull(aspirations.deleted_at)];

      if (params.q && params.q.trim()) {
        const query = `%${params.q.trim()}%`;
        conditions.push(ilike(aspirations.message, query));
      }

      if (params.status && params.status !== 'ALL') {
        conditions.push(eq(aspirations.status, params.status));
      }

      if (params.startDate) {
        const start = new Date(params.startDate);
        start.setHours(0, 0, 0, 0);
        conditions.push(gte(aspirations.created_at, start));
      }

      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        conditions.push(lte(aspirations.created_at, end));
      }

      const whereClause = and(...conditions);

      const items = await db
        .select()
        .from(aspirations)
        .where(whereClause)
        .orderBy(desc(aspirations.created_at))
        .limit(limit)
        .offset(offset);

      const totalRes = await db
        .select({ count: count() })
        .from(aspirations)
        .where(whereClause);

      const total = totalRes[0]?.count || 0;
      const totalPages = Math.ceil(total / limit) || 1;

      // Calculate stats
      const allActive = await db.select().from(aspirations).where(isNull(aspirations.deleted_at));
      const stats = {
        total: allActive.length,
        baru: allActive.filter((a) => a.status === 'BARU').length,
        ditinjau: allActive.filter((a) => a.status === 'DITINJAU').length,
        ditindaklanjuti: allActive.filter((a) => a.status === 'DITINDAKLANJUTI').length,
        selesai: allActive.filter((a) => a.status === 'SELESAI').length,
      };

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
        stats,
      };
    } catch (err) {
      console.error('Neon DB fetchAspirations error, falling back to memoryDb:', err);
      return memoryDb.getAspirations(params);
    }
  } else {
    return memoryDb.getAspirations(params);
  }
}

export async function fetchAspirationById(id: number) {
  if (isNeonConfigured && db) {
    try {
      const res = await db
        .select()
        .from(aspirations)
        .where(and(eq(aspirations.id, id), isNull(aspirations.deleted_at)))
        .limit(1);
      return res[0] || null;
    } catch (err) {
      console.error('Neon DB fetchAspirationById error, falling back to memoryDb:', err);
      return memoryDb.getAspirationById(id);
    }
  } else {
    return memoryDb.getAspirationById(id);
  }
}

export async function updateAspirationRecord(
  id: number,
  data: { status?: string; admin_note?: string },
  userId: string,
  userRole: string
) {
  // Validate status if provided
  const validStatuses = ['BARU', 'DITINJAU', 'DITINDAKLANJUTI', 'SELESAI'];
  if (data.status && !validStatuses.includes(data.status)) {
    throw new Error('Status tidak valid.');
  }

  let updated: any = null;

  if (isNeonConfigured && db) {
    try {
      const existing = await fetchAspirationById(id);
      if (!existing) throw new Error('Aspirasi tidak ditemukan.');

      const updateFields: any = { updated_at: new Date() };
      if (data.status) updateFields.status = data.status;
      if (data.admin_note !== undefined) updateFields.admin_note = data.admin_note;

      const res = await db
        .update(aspirations)
        .set(updateFields)
        .where(eq(aspirations.id, id))
        .returning();

      updated = res[0];

      // Audit log
      try {
        await db.insert(audit_logs).values({
          user_id: userId,
          action: `UPDATE_ASPIRATION_${userRole}`,
          entity: 'ASPIRATION',
          entity_id: String(id),
        });
      } catch (logErr) {
        console.error('Audit log insert failed:', logErr);
      }
    } catch (err) {
      console.error('Neon DB updateAspirationRecord error, falling back to memoryDb:', err);
      updated = await memoryDb.updateAspiration(id, data);
      await memoryDb.addAuditLog({
        user_id: userId,
        action: `UPDATE_ASPIRATION_${userRole}`,
        entity: 'ASPIRATION',
        entity_id: String(id),
      });
    }
  } else {
    updated = await memoryDb.updateAspiration(id, data);
    await memoryDb.addAuditLog({
      user_id: userId,
      action: `UPDATE_ASPIRATION_${userRole}`,
      entity: 'ASPIRATION',
      entity_id: String(id),
    });
  }

  return updated;
}

export async function deleteAspirationRecord(id: number, userId: string) {
  if (isNeonConfigured && db) {
    try {
      const existing = await fetchAspirationById(id);
      if (!existing) throw new Error('Aspirasi tidak ditemukan.');

      await db
        .update(aspirations)
        .set({ deleted_at: new Date(), updated_at: new Date() })
        .where(eq(aspirations.id, id));

      try {
        await db.insert(audit_logs).values({
          user_id: userId,
          action: 'DELETE_ASPIRATION',
          entity: 'ASPIRATION',
          entity_id: String(id),
        });
      } catch (logErr) {
        console.error('Audit log insert failed:', logErr);
      }
      return true;
    } catch (err) {
      console.error('Neon DB deleteAspirationRecord error, falling back to memoryDb:', err);
      const res = await memoryDb.deleteAspiration(id);
      await memoryDb.addAuditLog({
        user_id: userId,
        action: 'DELETE_ASPIRATION',
        entity: 'ASPIRATION',
        entity_id: String(id),
      });
      return res;
    }
  } else {
    const res = await memoryDb.deleteAspiration(id);
    await memoryDb.addAuditLog({
      user_id: userId,
      action: 'DELETE_ASPIRATION',
      entity: 'ASPIRATION',
      entity_id: String(id),
    });
    return res;
  }
}

export async function deleteBulkAspirations(ids: number[], userId: string) {
  if (!ids || ids.length === 0) return true;

  if (isNeonConfigured && db) {
    try {
      await db
        .update(aspirations)
        .set({ deleted_at: new Date(), updated_at: new Date() })
        .where(and(inArray(aspirations.id, ids), isNull(aspirations.deleted_at)));

      try {
        await db.insert(audit_logs).values({
          user_id: userId,
          action: 'BULK_DELETE_ASPIRATIONS',
          entity: 'ASPIRATION',
          entity_id: ids.slice(0, 10).join(',') + (ids.length > 10 ? `...+${ids.length - 10}` : ''),
        });
      } catch (logErr) {
        console.error('Audit log insert failed:', logErr);
      }
      return true;
    } catch (err) {
      console.error('Neon DB deleteBulkAspirations error, falling back to memoryDb:', err);
      for (const id of ids) {
        await memoryDb.deleteAspiration(id).catch(() => {});
      }
      await memoryDb.addAuditLog({
        user_id: userId,
        action: 'BULK_DELETE_ASPIRATIONS',
        entity: 'ASPIRATION',
        entity_id: ids.slice(0, 10).join(','),
      });
      return true;
    }
  } else {
    for (const id of ids) {
      await memoryDb.deleteAspiration(id).catch(() => {});
    }
    await memoryDb.addAuditLog({
      user_id: userId,
      action: 'BULK_DELETE_ASPIRATIONS',
      entity: 'ASPIRATION',
      entity_id: ids.slice(0, 10).join(','),
    });
    return true;
  }
}

export async function deleteAllAspirations(userId: string) {
  if (isNeonConfigured && db) {
    try {
      await db
        .update(aspirations)
        .set({ deleted_at: new Date(), updated_at: new Date() })
        .where(isNull(aspirations.deleted_at));

      try {
        await db.insert(audit_logs).values({
          user_id: userId,
          action: 'DELETE_ALL_ASPIRATIONS',
          entity: 'ASPIRATION',
          entity_id: 'ALL',
        });
      } catch (logErr) {
        console.error('Audit log insert failed:', logErr);
      }
      return true;
    } catch (err) {
      console.error('Neon DB deleteAllAspirations error, falling back to memoryDb:', err);
      const allActive = memoryDb.aspirations.filter((a) => !a.deleted_at);
      for (const item of allActive) {
        item.deleted_at = new Date();
      }
      await memoryDb.addAuditLog({
        user_id: userId,
        action: 'DELETE_ALL_ASPIRATIONS',
        entity: 'ASPIRATION',
        entity_id: 'ALL',
      });
      return true;
    }
  } else {
    const allActive = memoryDb.aspirations.filter((a) => !a.deleted_at);
    for (const item of allActive) {
      item.deleted_at = new Date();
    }
    await memoryDb.addAuditLog({
      user_id: userId,
      action: 'DELETE_ALL_ASPIRATIONS',
      entity: 'ASPIRATION',
      entity_id: 'ALL',
    });
    return true;
  }
}

export async function exportAspirationsToExcel() {
  let allItems: any[] = [];

  if (isNeonConfigured && db) {
    try {
      allItems = await db
        .select()
        .from(aspirations)
        .where(isNull(aspirations.deleted_at))
        .orderBy(desc(aspirations.created_at));
    } catch (err) {
      console.error('Neon DB exportAspirationsToExcel error, falling back to memoryDb:', err);
      allItems = memoryDb.aspirations.filter((a) => !a.deleted_at);
      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  } else {
    allItems = memoryDb.aspirations.filter((a) => !a.deleted_at);
    allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Format data for Excel
  const totalCount = allItems.length;
  const excelData = allItems.map((item, index) => {
    const dateObj = new Date(item.created_at);
    const dateStr = dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      No: totalCount - index,
      Tanggal: dateStr,
      Waktu: timeStr,
      'Isi Aspirasi': item.message,
      Status: item.status,
      'Catatan Tindak Lanjut': item.admin_note || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Tanggal
    { wch: 10 }, // Waktu
    { wch: 60 }, // Isi Aspirasi
    { wch: 18 }, // Status
    { wch: 40 }, // Catatan Tindak Lanjut
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Aspirasi Internal');

  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
