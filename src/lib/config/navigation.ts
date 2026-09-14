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
import NewspaperIcon from "@lucide/svelte/icons/newspaper";
import MegaphoneIcon from "@lucide/svelte/icons/megaphone";
import CalendarXIcon from "@lucide/svelte/icons/calendar-x";
import ImagesIcon from "@lucide/svelte/icons/images";
import TrophyIcon from "@lucide/svelte/icons/trophy";
import StarIcon from "@lucide/svelte/icons/star";
import MedalIcon from "@lucide/svelte/icons/medal";
import ArchiveRestoreIcon from "@lucide/svelte/icons/archive-restore";
import SettingsIcon from "@lucide/svelte/icons/settings";

export interface NavItem {
	title: string;
	url: string;
	icon?: any;
	group: string;
	roles?: string[];
	children?: { title: string; url: string; icon?: any }[];
}

const A = '/admin';

export const navItems: NavItem[] = [
	{
		title: "Dashboard",
		url: `${A}/dashboard`,
		icon: LayoutDashboardIcon,
		group: "semua",
		roles: ["admin", "kepsek", "guru", "staf"],
	},
	{
		title: "PTK",
		url: `${A}/ptk`,
		icon: UsersIcon,
		group: "PTK",
		roles: ["admin", "kepsek"],
		children: [
			{ title: "Data PTK", url: `${A}/ptk`, icon: UsersIcon },
		],
	},
	{
		title: "Kesiswaan",
		url: `${A}/siswa`,
		icon: GraduationCapIcon,
		group: "Kesiswaan",
		roles: ["admin", "kepsek", "guru", "staf"],
		children: [
			{ title: "Data Siswa", url: `${A}/siswa`, icon: GraduationCapIcon },
			{ title: "Kartu Siswa", url: `${A}/siswa/kartu`, icon: GalleryVerticalEndIcon },
			{ title: "Rombel", url: `${A}/rombel`, icon: UsersRoundIcon },
		],
	},
	{
		title: "Dokumen",
		url: `${A}/skmt`,
		icon: FileTextIcon,
		group: "Dokumen",
		roles: ["admin", "kepsek", "guru"],
		children: [
			{ title: "SKMT", url: `${A}/skmt`, icon: FileTextIcon },
			{ title: "SKBK", url: `${A}/skbk`, icon: ClipboardListIcon },
			{ title: "SKAKPT", url: `${A}/skakpt`, icon: FileCheckIcon },
		],
	},
	{
		title: "Konten",
		url: `${A}/berita`,
		icon: NewspaperIcon,
		group: "Konten",
		roles: ["admin", "kepsek"],
		children: [
			{ title: "Berita", url: `${A}/berita`, icon: NewspaperIcon },
			{ title: "Pengumuman", url: `${A}/pengumuman`, icon: MegaphoneIcon },
			{ title: "Agenda", url: `${A}/agenda`, icon: CalendarXIcon },
			{ title: "Galeri", url: `${A}/galeri`, icon: ImagesIcon },
			{ title: "Prestasi", url: `${A}/prestasi`, icon: MedalIcon },
			{ title: "Ekskul", url: `${A}/ekskul`, icon: StarIcon },
		],
	},
	{
		title: "Jadwal",
		url: `${A}/roster`,
		icon: CalendarDaysIcon,
		group: "Jadwal",
		roles: ["admin", "kepsek", "guru"],
		children: [
			{ title: "Roster", url: `${A}/roster`, icon: CalendarClockIcon },
		],
	},
	{
		title: "Bel",
		url: `${A}/bel`,
		icon: BellIcon,
		group: "Bel",
		roles: ["admin", "staf"],
		children: [
			{ title: "Monitoring", url: `${A}/bel`, icon: BellIcon },
			{ title: "Perpustakaan Suara", url: `${A}/bel/suara`, icon: Volume2Icon },
		],
	},
	{
		title: "Aktivitas",
		url: `${A}/activity`,
		icon: BookOpenIcon,
		group: "semua",
		roles: ["admin", "kepsek", "guru", "staf"],
	},
	{
		title: "Persetujuan",
		url: `${A}/approval`,
		icon: ShieldCheckIcon,
		group: "semua",
		roles: ["admin", "kepsek", "staf"],
	},
	{
		title: "Sistem",
		url: `${A}/backup`,
		icon: ArchiveRestoreIcon,
		group: "Sistem",
		roles: ["admin"],
		children: [
			{ title: "Pengaturan", url: `${A}/pengaturan`, icon: SettingsIcon },
			{ title: "Backup & Restore", url: `${A}/backup`, icon: ArchiveRestoreIcon },
		],
	},
];

export const siswaNavItems = [
	{
		title: "Profil Saya",
		url: "/admin/siswa/profil",
		icon: UserIcon,
	},
	{
		title: "Cek Bansos",
		url: "/admin/siswa/bansos",
		icon: BellIcon,
	},
];

export const ortuNavItems = [
	{
		title: "Profil Anak",
		url: "/admin/ortu/profil",
		icon: UsersRoundIcon,
	},
	{
		title: "Cek Bansos",
		url: "/admin/ortu/bansos",
		icon: BellIcon,
	},
];

export function filterNavByRole(items: typeof navItems, role: string) {
	return items.filter((item) => {
		if (!item.roles || item.roles.length === 0) return true;
		return item.roles.includes(role);
	});
}

export function usesSidebarLayout(role: string): boolean {
	return ['admin', 'kepsek', 'guru', 'staf'].includes(role);
}

export const teamConfig = {
	name: "MTsN 2 Kolaka Utara",
	logo: GalleryVerticalEndIcon,
	plan: "Sistem Informasi Manajemen Madrasah",
};
