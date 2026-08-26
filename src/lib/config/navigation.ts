import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import UsersIcon from '@lucide/svelte/icons/users';
import FileTextIcon from '@lucide/svelte/icons/file-text';
import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
import FileCheckIcon from '@lucide/svelte/icons/file-check';
import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
import BookOpenIcon from '@lucide/svelte/icons/book-open';
import GalleryVerticalEndIcon from "@lucide/svelte/icons/gallery-vertical-end";

export const navItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboardIcon,
	},
	{
		title: "Data PTK",
		url: "/ptk",
		icon: UsersIcon,
	},
	{
		title: "Data Siswa",
		url: "/siswa",
		icon: GraduationCapIcon,
	},
	{
		title: "SKMT",
		url: "/skmt",
		icon: FileTextIcon,
	},
	{
		title: "SKBK",
		url: "/skbk",
		icon: ClipboardListIcon,
	},
	{
		title: "SKAKPT",
		url: "/skakpt",
		icon: FileCheckIcon,
	},
	{
		title: "Roster",
		url: "/roster",
		icon: CalendarDaysIcon,
	},
	{
		title: "Aktivitas",
		url: "/activity",
		icon: BookOpenIcon,
	},
];

export const teamConfig = {
	name: "MTsN 2 Kolaka Utara",
	logo: GalleryVerticalEndIcon,
	plan: "Smart Digital School",
};
