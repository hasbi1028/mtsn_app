import { getKartuList } from '$modules/siswa/siswa.service';

export const load = async () => {
	const list = getKartuList();
	return { list };
};
