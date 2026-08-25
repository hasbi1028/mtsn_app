// PM2 ecosystem — mtsn_app: Go API (3730) + SvelteKit BFF (3720)
module.exports = {
	apps: [
		{
			name: 'mtsn-app-api',
			script: 'api.exe',
			cwd: 'C:/Users/LENOVO/webapp/mtsn_app/backend',
			env: {
				DB_PATH: 'C:/Users/LENOVO/webapp/mtsn_app/local.db',
				PORT: '3730'
			},
			watch: false,
			autorestart: true,
			max_restarts: 5
		},
		{
			name: 'mtsn-app-bff',
			script: 'node',
			args: 'build',
			cwd: 'C:/Users/LENOVO/webapp/mtsn_app',
			env: {
				DATABASE_URL: 'file:C:/Users/LENOVO/webapp/mtsn_app/local.db',
				PORT: '3720',
				ORIGIN: 'http://localhost:3720',
				API_BASE: 'http://localhost:3730'
			},
			watch: false,
			autorestart: true,
			max_restarts: 5
		}
	]
};
