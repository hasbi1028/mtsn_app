// Alokasi siswa kelas 7 ke rombel berdasarkan data pembagian
// Sumber: paste pembagian rombel kelas 7 (VII-A..VII-E)
import Database from 'better-sqlite3';

const db = new Database(process.argv[2] || 'local.db');

// Data: [nama, rombel] — format rombel dinormalisasi ke "VII-A"
const data = [
['Anwar','VII A'],['Afdal','VII A'],['Ariqa Fatin','VII A'],['Aurel Syafira','VII A'],['Fajrih','VII A'],
['Fatima Azzahra','VII A'],['Muh. Rasyid Prajaya','VII A'],['Muhammad Alfin','VII A'],['Muh. Fadli','VII A'],
['Naura Azura','VII A'],['Naura Bilqis Zahra','VII A'],['Nhabil Anwar','VII A'],['Nur Ilmi Amaliah','VII A'],
['Nurul Azhara','VII A'],['Rajwaa Kifaayah','VII A'],['Thalita Naifah','VII A'],['Wulan','VII A'],['Zaqhyla Zyahra','VII A'],
['Adesya Azahra Putri','VII B'],['Adha Asyifa Sahra','VII B'],['Adib Abizar','VII B'],['Asifha Darmawansa','VII B'],
['Alham','VII B'],['Dhafitha Nizza Syakirah','VII B'],['Eghar Ramah','VII B'],['Fitri','VII B'],['Haerulhuda','VII B'],
['Iftitah Khaira Saleh','VII B'],['Jihan Khumairah','VII B'],['Kaila','VII B'],['Muh. Zidan Alfarizy','VII B'],
['Muhammad Fitrah','VII B'],['Muhammad abizar','VII B'],['Muhammad Teguh Wisnu','VII B'],['Naila','VII B'],
['Najwa Khair','VII B'],['Raditya Syaputra','VII B'],
['Adika Putra','VII C'],['Andi Afiva Angraeni','VII C'],['Gilang Ariansyah Dermawan','VII C'],['Muh Abizar','VII C'],
['Muh. Faiz Lutfillah','VII C'],['Muh. Fhatan Al Maisan','VII C'],['Muhammad Irfan Jaya','VII C'],['Muhammad Syahrif','VII C'],
['Naksyadewa Ikmal','VII C'],['Nur Aqila','VII C'],['Nur Fadilla','VII C'],['Nur Iftah Rahmayanti','VII C'],['Nur Aviqha','VII C'],
['Nurhudaya Nur Amin','VII C'],['Nurjunisa Ramadhani','VII C'],['Nurul Inayah Putri','VII C'],['Ulfah Karimah','VII C'],
['Wa Ode Andini Anindya Putri','VII C'],
['Abdul Abid','VII D'],['Afkar Ataullah','VII D'],['Aqila Cahya Pratiwi','VII D'],['Aura Ramadani','VII D'],['Dillah Arianti','VII D'],
['Henra','VII D'],['Marwah','VII D'],['Muhammad Aidil','VII D'],['Muhammad Iqbal','VII D'],['Nabila Santi','VII D'],
['Nadia','VII D'],['Noval Zakiy','VII D'],['Nur Aqilah','VII D'],['Sabir','VII D'],['Sapani Ramadani','VII D'],
['Sahira','VII D'],['Syahrul Ramadhan Hasim','VII D'],['Ufaira Nur Afifah','VII D'],
['Adzkia Zaufah','VII E'],['Alfath Radhinka','VII E'],['Amria Qinara Arsyifa','VII E'],['Anan Gadira Muhti','VII E'],
['Aqila Azzahra','VII E'],['Armayani','VII E'],['Atma Stasya','VII E'],['Liyana Zahira','VII E'],['M. Arlandra Sastra. B','VII E'],
['Muh. Alfaril Sandi','VII E'],['Muh.Padil','VII E'],['Muhammad Ihsan','VII E'],['Muhammad Sahril','VII E'],['Muhammad Habil','VII E'],
['Nur Mughniizzatunnissa. S','VII E'],["Qurrati A'yuni",'VII E'],['Rafli','VII E'],['Rajab Mudding','VII E'],
['Vania Inka Mahya','VII E'],['Nur Fatihah Laila','VII E'],
];

// Normalisasi rombel: "VII A" -> "VII-A"
const norm = (s) => s.trim().replace(/^(\w+)\s+(\w)$/, '$1-$2').replace(/\s+/g, '-');

const hit = [], miss = [];
let updated = 0;

const stmt = db.prepare(`UPDATE siswa SET rombel = ? WHERE id = ? AND kelas = '7'`);
const find = db.prepare(`SELECT id, nama FROM siswa WHERE kelas = '7'`);

// Map nama (lowercase) ke id
const byName = new Map();
for (const r of find.all()) {
  byName.set(r.nama.trim().toLowerCase(), r.id);
}

db.transaction(() => {
  for (const [nama, rombelRaw] of data) {
    const rombel = norm(rombelRaw);
    const id = byName.get(nama.trim().toLowerCase());
    if (id) {
      stmt.run(rombel, id);
      updated++;
      hit.push([nama, rombel]);
    } else {
      miss.push([nama, rombelRaw]);
    }
  }
})();

console.log('=== HASIL ALGORITMA ===');
console.log(`Terupdate: ${updated}/${data.length}`);

// Hitung distribusi per rombel
const dist = db.prepare(`SELECT rombel, COUNT(*) c FROM siswa WHERE kelas='7' AND rombel!='' GROUP BY rombel ORDER BY rombel`).all();
console.log('\nDistribusi kelas 7:');
for (const d of dist) console.log(`  ${d.rombel}: ${d.c} siswa`);

const tanpa = db.prepare(`SELECT COUNT(*) c FROM siswa WHERE kelas='7' AND (rombel IS NULL OR rombel='')`).get().c;
console.log(`\nSisa tanpa rombel (kelas 7): ${tanpa}`);

if (miss.length) {
  console.log('\n⚠️ TIDAK KETEMU (nama tidak cocok di DB):');
  for (const m of miss) console.log(`  - "${m[0]}" -> ${m[1]}`);
}