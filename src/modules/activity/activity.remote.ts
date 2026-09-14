import { query } from '$app/server';
import { requireStaff } from '$lib/server/guard';
import { getActivityLog } from './activity.service';

export const getActivityLogQ = query(async () => {
	requireStaff();
	return getActivityLog();
});
