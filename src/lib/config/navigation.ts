import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import UsersIcon from '@lucide/svelte/icons/users';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
import FileCheckIcon from '@lucide/svelte/icons/file-check';
import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
import BellIcon from '@lucide/svelte/icons/bell-ring';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import UserIcon from '@lucide/svelte/icons/user';
import UsersRoundIcon from '@lucide/svelte/icons/users-round';
import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";
import ListMusicIcon from "@lucide/svelte/icons/list-music";
import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
import FileTextIcon2 from "@lucide/svelte/icons/file-badge";
import CalendarClockIcon from "@lucide/svelte/icons/calendar-clock";
import Volume2Icon from "@lucide/svelte/icons/volume-2";

export interface NavItem {
	title: string;
	url: string;
	icon?: any;
	group: string;
	roles?: string[];
	children?: { title: string; url: string; icon?: any }[];
}

// group = nama modul yang menampilkan menu tsb. 'semua' selalu tampil.
// roles = array role yang boleh lihat item ini. kosong = semua role.
export const navItems: NavItem[] = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboardIcon,
		group: "semua",
		roles: ["admin", "kepsek", "guru", "staf"],
	},
	{
		title: "PTK",
		url: "/ptk",
		icon: UsersIcon,
		group: "PTK",
		roles: ["admin", "kepsek"],
		children: [
			{ title: "Data PTK", url: "/ptk", icon: UsersIcon },
		],
	},
	{
		title: "Kesiswaan",
		url: "/siswa",
		icon: GraduationCapIcon,
		group: "Kesiswaan",
		roles: ["admin", "kepsek", "guru", "staf"],
		children: [
			{ title: "Data Siswa", url: "/siswa", icon: GraduationCapIcon },
		],
	},
	{
		title: "Dokumen",
		url: "/skmt",
		icon: FileTextIcon,
		group: "Dokumen",
		roles: ["admin", "kepsek", "guru"],
		children: [
			{ title: "SKMT", url: "/skmt", icon: FileTextIcon },
			{ title: "SKBK", url: "/skbk", icon: ClipboardListIcon },
			{ title: "SKAKPT", url: "/skakpt", icon: FileCheckIcon },
		],
	},
	{
		title: "Jadwal",
		url: "/roster",
		icon: CalendarDaysIcon,
		group: "Jadwal",
		roles: ["admin", "kepsek", "guru"],
		children: [
			{ title: "Roster", url: "/roster", icon: CalendarClockIcon },
		],
	},
	{
		title: "Bel",
		url: "/bel",
		icon: BellIcon,
		group: "Bel",
		roles: ["admin", "staf"],
		children: [
			{ title: "Monitoring", url: "/bel", icon: BellIcon },
			{ title: "Perpustakaan Suara", url: "/bel/suara", icon: Volume2Icon },
		],
	},
	{
		title: "Aktivitas",
		url: "/activity",
		icon: BookOpenIcon,
		group: "semua",
		roles: ["admin", "kepsek", "guru", "staf"],
	},
];

/** Siswa/ortu minimal navigation (shown outside sidebar) */
export const siswaNavItems = [
	{
		title: "Profil Saya",
		url: "/siswa/profil",
		icon: UserIcon,
	},
	{
		title: "Cek Bansos",
		url: "/siswa/bansos",
		icon: BellIcon,
	},
];

export const ortuNavItems = [
	{
		title: "Profil Anak",
		url: "/ortu/profil",
		icon: UsersRoundIcon,
	},
	{
		title: "Cek Bansos",
		url: "/ortu/bansos",
		icon: BellIcon,
	},
];

/** Filter nav items by role */
export function filterNavByRole(items: typeof navItems, role: string) {
	return items.filter((item) => {
		if (!item.roles || item.roles.length === 0) return true;
		return item.roles.includes(role);
	});
}

/** Check if role uses sidebar layout (admin/kepsek/guru/staf) */
export function usesSidebarLayout(role: string): boolean {
	return ['admin', 'kepsek', 'guru', 'staf'].includes(role);
}

export const teamConfig = {
	name: "MTsN 2 Kolaka Utara",
	logo: GalleryVerticalEndIcon,
	plan: "Sistem Informasi Manajemen Madrasah",
};
