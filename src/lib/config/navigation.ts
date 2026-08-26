import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import UsersIcon from '@lucide/svelte/icons/users';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
import FileCheckIcon from '@lucide/svelte/icons/file-check';
import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
import BellIcon from '@lucide/svelte/icons/bell-ring';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";

// group = nama modul yang menampilkan menu tsb. 'semua' selalu tampil.
export const navItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboardIcon,
		group: "semua",
	},
	{
		title: "Data PTK",
		url: "/ptk",
		icon: UsersIcon,
		group: "PTK",
	},
	{
		title: "Data Siswa",
		url: "/siswa",
		icon: GraduationCapIcon,
		group: "Kesiswaan",
	},
	{
		title: "SKMT",
		url: "/skmt",
		icon: FileTextIcon,
		group: "Dokumen",
	},
	{
		title: "SKBK",
		url: "/skbk",
		icon: ClipboardListIcon,
		group: "Dokumen",
	},
	{
		title: "SKAKPT",
		url: "/skakpt",
		icon: FileCheckIcon,
		group: "Dokumen",
	},
	{
		title: "Roster",
		url: "/roster",
		icon: CalendarDaysIcon,
		group: "Jadwal",
	},
	{
		title: "Aktivitas",
		url: "/activity",
		icon: BookOpenIcon,
		group: "semua",
	},
	{
		title: "Bel",
		url: "/bel",
		icon: BellIcon,
		group: "Bel",
	},
];

export const teamConfig = {
	name: "MTsN 2 Kolaka Utara",
	logo: GalleryVerticalEndIcon,
	plan: "Sistem Informasi Manajemen Madrasah",
};