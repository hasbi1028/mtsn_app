// PM2 ecosystem — mtsn_app: SvelteKit (3720) + worker-bel (8093)
module.exports = {
	apps: [
		{
			name: 'mtsn-app-bff',
			script: 'node',
			args: 'build',
			cwd: 'C:/Users/LENOVO/webapp/mtsn_app',
			env: {
				DATABASE_URL: 'file:C:/Users/LENOVO/webapp/mtsn_app/local.db',
				PORT: '3720',
				ORIGIN: 'http://localhost:3720',
				BEL_API: 'http://127.0.0.1:8093',
				BEL_API_KEY: '',
				// Modul backup (spec 027). BODY_SIZE_LIMIT default adapter-node = 512 KB
				// → unggah ZIP arsip pasti gagal tanpa ini.
				BODY_SIZE_LIMIT: '209715200',
				BACKUP_DIR: 'data/backups'
			},
			watch: false,
			autorestart: true,
			max_restarts: 5
		},
		{
			name: 'simad-bel',
			script: 'worker-bel.exe',
			cwd: 'C:/Users/LENOVO/webapp/mtsn_app/worker-bel',
			env: {
				DB_PATH: 'C:/Users/LENOVO/webapp/mtsn_app/local.db',
				SOUND_BASE: 'C:/Users/LENOVO/webapp/mtsn_app/static/uploads/bel',
				POLL_SECONDS: '30',
				BEL_PORT: '8093',
				BEL_API_KEY: ''
			},
			watch: false,
			autorestart: true,
			max_restarts: 10
		}
	]
};
