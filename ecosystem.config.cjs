// PM2 ecosystem — mtsn_app (SIMAD) untuk server Linux MTsN 2 Koluta Utara
// Jalankan: pm2 start ecosystem.config.linux.cjs && pm2 save
// Catatan: worker-bel adalah worker Windows (.exe) — tidak dijalankan di Linux.
const APP_DIR = '/home/servermtsn2kolut/mtsn_app';

module.exports = {
	apps: [
		{
			name: 'mtsn-app-bff',
			script: 'node',
			args: 'build',
			cwd: APP_DIR,
			env: {
				NODE_ENV: 'production',
				PORT: '8021',
				// Dipublikasikan via Cloudflare Tunnel di domain ini.
				// ORIGIN harus sama dengan origin yang dilihat browser, jika tidak
				// SvelteKit menolak POST/remote-function sebagai cross-site (CSRF).
				ORIGIN: 'https://mtsn2kolut.sch.id',
				DATABASE_URL: `file:${APP_DIR}/local.db`,
				BEL_API: 'http://127.0.0.1:8093',
				BEL_API_KEY: '',
				// Modul backup (spec 027). Default adapter-node 512 KB → unggah ZIP gagal.
				BODY_SIZE_LIMIT: '209715200',
				BACKUP_DIR: 'data/backups'
			},
			watch: false,
			autorestart: true,
			max_restarts: 5
		}
	]
};
