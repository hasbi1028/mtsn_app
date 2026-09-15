import HouseIcon from '@lucide/svelte/icons/house';
import UserRoundIcon from '@lucide/svelte/icons/user-round';
import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
import NewspaperIcon from '@lucide/svelte/icons/newspaper';
import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
import TrophyIcon from '@lucide/svelte/icons/trophy';
import ImagesIcon from '@lucide/svelte/icons/images';
import MedalIcon from '@lucide/svelte/icons/medal';
import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
import PhoneIcon from '@lucide/svelte/icons/phone';

export interface PublicNavChild {
	href: string;
	label: string;
}

export interface PublicNavItem {
	href: string;
	label: string;
	icon: any;
	children?: PublicNavChild[];
}

/** Sumber tunggal menu publik — dipakai navbar desktop & sheet mobile. */
export const publicNavItems: PublicNavItem[] = [
	{ href: '/', label: 'Beranda', icon: HouseIcon },
	{
		href: '/profil',
		label: 'Profil',
		icon: UserRoundIcon,
		children: [
			{ href: '/profil', label: 'Tentang Kami' },
			{ href: '/profil/visi-misi', label: 'Visi & Misi' },
			{ href: '/profil/struktur', label: 'Struktur Organisasi' }
		]
	},
	{ href: '/ppdb', label: 'PPDB', icon: ClipboardListIcon },
	{ href: '/berita', label: 'Berita', icon: NewspaperIcon },
	{ href: '/kalender', label: 'Kalender', icon: CalendarDaysIcon },
	{ href: '/ekskul', label: 'Ekskul', icon: TrophyIcon },
	{ href: '/galeri', label: 'Galeri', icon: ImagesIcon },
	{ href: '/prestasi', label: 'Prestasi', icon: MedalIcon },
	{ href: '/guru', label: 'Guru', icon: GraduationCapIcon },
	{ href: '/kontak', label: 'Kontak', icon: PhoneIcon }
];
