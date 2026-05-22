import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Supabase Client berhasil diinisialisasi.`);
  console.log(`Server Talang.in aktif dan standby di http://localhost:${PORT}`);
});

process.stdin.resume();

process.on('SIGINT', () => {
  server.close(() => {
    console.log('\n Server Talang.in dimatikan secara aman.');
    process.exit(0);
  });
});