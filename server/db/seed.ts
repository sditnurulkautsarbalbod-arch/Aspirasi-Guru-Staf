import { db, memoryDb, isNeonConfigured } from './index';
import { users, aspirations } from './schema';
import bcrypt from 'bcryptjs';

export async function runSeed() {
  console.log('Seeding initial data...');
  const adminPass = bcrypt.hashSync('admin890', 10);
  const wakasekPass = bcrypt.hashSync('wakasek890', 10);
  const kepsekPass = bcrypt.hashSync('kepsek890', 10);

  if (isNeonConfigured && db) {
    try {
      // Seed to Neon Postgres
      console.log('Seeding to Neon PostgreSQL...');
      await db.insert(users).values([
        {
          name: 'Administrator',
          username: 'admin',
          password_hash: adminPass,
          role: 'ADMIN',
          is_active: true,
          is_super_admin: true,
        },
        {
          name: 'Wakil Kepala Sekolah',
          username: 'wakasek',
          password_hash: wakasekPass,
          role: 'WAKASEK',
          is_active: true,
          is_super_admin: false,
        },
        {
          name: 'Kepala Sekolah',
          username: 'kepsek',
          password_hash: kepsekPass,
          role: 'KEPALA_SEKOLAH',
          is_active: true,
          is_super_admin: false,
        },
      ]).onConflictDoNothing();

      console.log('Neon DB seeding completed successfully (User accounts initialized).');
    } catch (error) {
      console.error('Error during Neon DB seed:', error);
    }
  } else {
    console.log('Using memory DB seed (already seeded in memoryDb instance).');
  }
}

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  runSeed().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
