import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export function getActivityLog() {
	return db.all(sql`
		SELECT a.id, u.username, a.action, a.detail, a.created_at
		FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
		ORDER BY a.created_at DESC LIMIT 50
	`);
}
