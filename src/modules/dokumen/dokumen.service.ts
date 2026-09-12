import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export function getSkmtList() {
	return db.all(sql`
		SELECT s.id, p.nama, p.public_id as ptk_public_id, s.instansi, s.status,
			s.nilai_pembelajaran, s.nilai_bimbingan,
			(SELECT COUNT(*) FROM dokumen d WHERE d.ptk_id = s.ptk_id) AS ndok
		FROM skmt_ajuan s JOIN ptk p ON p.id = s.ptk_id
		ORDER BY CASE WHEN s.status='Menunggu' THEN 0 WHEN s.status LIKE 'Disetujui%' THEN 1 ELSE 2 END, p.nama
	`);
}

export function getSkbkList() {
	return db.all(sql`
		SELECT s.id, p.nama, p.public_id as ptk_public_id, s.instansi, s.status, s.jtm_total,
			(SELECT COUNT(*) FROM dokumen d WHERE d.ptk_id = s.ptk_id) AS ndok
		FROM skbk_ajuan s JOIN ptk p ON p.id = s.ptk_id
		ORDER BY CASE WHEN s.status='Belum Diajukan' THEN 0 ELSE 1 END, p.nama
	`);
}

export function getSkakptMonths() {
	const rows = db.all(sql`
		SELECT DISTINCT bulan FROM skakpt WHERE bulan != '' AND bulan IS NOT NULL ORDER BY id DESC
	`);
	return rows.map((r: any) => r.bulan).filter(Boolean);
}

export function getSkakptList(bulan?: string) {
	let rows;
	if (bulan) {
		rows = db.all(sql`
			SELECT COALESCE(s.id,0) as id, p.nama, p.public_id as ptk_public_id, COALESCE(p.nuptk,'') AS nuptk,
				COALESCE(s.bulan,'') as bulan, COALESCE(s.status,'') as status,
				COALESCE(s.tgl_ajuan,'') as tgl_ajuan, COALESCE(s.detail,'') as detail
			FROM ptk p LEFT JOIN skakpt s ON p.id = s.ptk_id AND s.bulan = ${bulan}
			WHERE p.sertifikasi = 1
			ORDER BY p.nama
		`);
	} else {
		rows = db.all(sql`
			SELECT COALESCE(s.id,0) as id, p.nama, p.public_id as ptk_public_id, COALESCE(p.nuptk,'') AS nuptk,
				COALESCE(s.bulan,'') as bulan, COALESCE(s.status,'') as status,
				COALESCE(s.tgl_ajuan,'') as tgl_ajuan, COALESCE(s.detail,'') as detail
			FROM ptk p
			LEFT JOIN skakpt s ON p.id = s.ptk_id
				AND s.bulan = (SELECT bulan FROM skakpt s2 WHERE s2.ptk_id = p.id ORDER BY s2.id DESC LIMIT 1)
			WHERE p.sertifikasi = 1
			ORDER BY p.nama
		`);
	}

	return rows.map((r: any) => {
		let detailObj: any = null;
		let layak = false;
		let totalOk = 0;
		let total = 0;

		if (r.detail) {
			try { detailObj = JSON.parse(r.detail); } catch {}
			if (detailObj?.layak !== undefined) layak = detailObj.layak;
			if (detailObj?.totalOk !== undefined) totalOk = detailObj.totalOk;
			if (detailObj?.total !== undefined) total = detailObj.total;
		}

		const bulanStr = r.bulan || 'Juli 2026';
		const cleanName = r.nama.replace(/ /g, '_').replace(/,/g, '');
		const monthSlug = bulanStr.replace(/ /g, '');
		const pdfFile = `SKAKPT_${cleanName}_${monthSlug}.pdf`;

		let status = 'Belum Terbit';
		if (layak && totalOk >= total && total > 0) {
			status = 'Indikator Lengkap';
		} else if (r.status === 'Belum Layak') {
			status = 'Belum Layak';
		} else if (r.status === 'Menunggu Verifikasi') {
			status = 'Menunggu Verifikasi';
		} else if (r.status === 'Disetujui') {
			status = 'Sudah Terbit';
		}

		return {
			ptkId: r.id, ptkPublicId: r.ptk_public_id, nama: r.nama, nuptk: r.nuptk,
			bulan: bulanStr, status, tglAjuan: r.tgl_ajuan,
			download: false, filename: pdfFile,
			layak, totalOk, totalIndikator: total,
			detail: detailObj
		};
	});
}
