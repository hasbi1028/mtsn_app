import { query } from '$app/server';
import { getActivityLog } from './activity.service';

export const getActivityLogQ = query(async () => getActivityLog());
