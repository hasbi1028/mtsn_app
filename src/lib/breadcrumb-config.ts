/**
 * Breadcrumb configuration — maps route segments to labels.
 * Used by AppBreadcrumb to auto-generate breadcrumb from URL.
 */

interface BreadcrumbEntry {
  label: string;
  href?: string; // undefined = current page (not a link)
}

/** Static label map for known segments */
const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  ptk: 'Data PTK',
  siswa: 'Data Siswa',
  rombel: 'Rombel',
  profil: 'Profil',
  bansos: 'Bansos',
  cetak: 'Cetak',
  skmt: 'SKMT',
  skbk: 'SKBK',
  skakpt: 'SKAKPT',
  roster: 'Roster',
  activity: 'Aktivitas',
  bel: 'Bel',
  suara: 'Perpustakaan Suara',
  ortu: 'Orang Tua',
  login: 'Login',
};

/** Build breadcrumb trail from pathname */
export function buildBreadcrumb(pathname: string): BreadcrumbEntry[] {
  // Always start with Dashboard
  const entries: BreadcrumbEntry[] = [];
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || segments[0] === '') {
    entries.push({ label: 'Dashboard' });
    return entries;
  }

  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    currentPath += '/' + seg;

    // Skip numeric IDs — we'll handle them via API or skip
    if (/^\d+$/.test(seg)) {
      continue;
    }

    const label = segmentLabels[seg] ?? seg;
    const isLast = i === segments.length - 1;
    const nextSeg = segments[i + 1];

    // If current seg is "siswa" and next is numeric ID, continue to next
    if (seg === 'siswa' && nextSeg && /^\d+$/.test(nextSeg)) {
      // We'll add "Data Siswa" without href, resolve after ID
      entries.push({ label, href: '/siswa' });
      continue;
    }

    // If current seg is "ptk" and next is numeric ID, same pattern
    if (seg === 'ptk' && nextSeg && /^\d+$/.test(nextSeg)) {
      entries.push({ label, href: '/ptk' });
      continue;
    }

    if (isLast) {
      entries.push({ label }); // current page, no link
    } else {
      entries.push({ label, href: currentPath });
    }
  }

  // If first entry is Dashboard but we're not on root, add Dashboard link
  if (segments.length > 0 && segments[0] !== '') {
    entries.unshift({ label: 'Dashboard', href: '/' });
  }

  return entries;
}
