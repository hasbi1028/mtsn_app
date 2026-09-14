<script lang="ts">
	import PageLayout from '$lib/components/page-layout.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { notify } from '$lib/toast';
	import {
		getUsersQ,
		getPtkBelumAkunQ,
		createUserF,
		toggleUserC,
		resetPasswordC,
		deleteUserC
	} from '$modules/user/user.remote';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
import Trash2Icon from '@lucide/svelte/icons/trash-2';
import UserCheckIcon from '@lucide/svelte/icons/user-check';
	import UserXIcon from '@lucide/svelte/icons/user-x';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	const [users, ptkOptions] = $derived(
		await Promise.all([getUsersQ(), getPtkBelumAkunQ()])
	);

	const userList = $derived((users ?? []) as any[]);
	const ptkList = $derived((ptkOptions ?? []) as any[]);

	let formOpen = $state(false);
	let lastResult: unknown = null;
	let loadingAction = $state<number | null>(null);

	$effect(() => {
		const r: any = createUserF.result;
		if (!r || r === lastResult) return;
		lastResult = r;
		if (r.ok) {
			notify.success(r.pesan || 'Akun dibuat.');
			formOpen = false;
			void getUsersQ().refresh();
			void getPtkBelumAkunQ().refresh();
		} else {
			notify.error(r.error || 'Gagal membuat akun.');
		}
	});

	function handlePtkChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const ptkId = Number(select.value);
		if (!ptkId) return;
		const ptk = ptkList.find((p: any) => p.id === ptkId);
		if (ptk) {
			const usernameInput = document.getElementById('username') as HTMLInputElement;
			if (usernameInput) usernameInput.value = ptk.nip || ptk.nama.toLowerCase().replace(/\s+/g, '.');
		}
	}

	async function handleToggle(userId: number, currentActive: number) {
		loadingAction = userId;
		try {
			const r: any = await toggleUserC({ userId, isActive: currentActive ? 0 : 1 });
			if (r?.ok) {
				notify.success(r.pesan);
				void getUsersQ().refresh();
			} else {
				notify.error(r?.error || 'Gagal.');
			}
		} finally {
			loadingAction = null;
		}
	}

	async function handleReset(userId: number, username: string) {
		if (!confirm(`Reset password "${username}" ke 2026qwerty! ?`)) return;
		loadingAction = userId;
		try {
			const r: any = await resetPasswordC({ userId });
			if (r?.ok) {
				notify.success(r.pesan || `Password direset ke ${r.defaultPassword}`);
			} else {
				notify.error(r?.error || 'Gagal reset.');
			}
		} finally {
			loadingAction = null;
		}
	}

	async function handleDelete(userId: number, username: string) {
		if (!confirm(`Hapus user "${username}"? Tindakan ini tidak bisa dibatalkan.`)) return;
		loadingAction = userId;
		try {
			const r: any = await deleteUserC({ userId });
			if (r?.ok) {
				notify.success(r.pesan);
				void getUsersQ().refresh();
				void getPtkBelumAkunQ().refresh();
			} else {
				notify.error(r?.error || 'Gagal menghapus.');
			}
		} finally {
			loadingAction = null;
		}
	}

	function formatTanggal(ts: number | null): string {
		if (!ts) return '-';
		return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
	}
</script>

<svelte:head><title>Kelola User — SIMAD</title></svelte:head>

<PageLayout
	title="Kelola User"
	description="Buat, lihat, dan kelola akun login guru & staf"
>
	{#snippet actions()}
		<Button size="sm" class="h-8 cursor-pointer" onclick={() => (formOpen = !formOpen)}>
			<UserPlusIcon class="size-4 mr-1" />
			Tambah Akun
		</Button>
	{/snippet}

	<!-- Statistik -->
	<div class="grid grid-cols-2 gap-2 md:grid-cols-4">
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">Total User</p>
			<p class="text-xl font-bold">{userList.length}</p>
		</div>
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">Aktif</p>
			<p class="text-xl font-bold text-green-600">{userList.filter((u: any) => u.isActive).length}</p>
		</div>
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">Wajib Ganti Password</p>
			<p class="text-xl font-bold text-amber-600">{userList.filter((u: any) => u.mustChangePassword).length}</p>
		</div>
		<div class="rounded-lg border p-3">
			<p class="text-xs text-muted-foreground">PTK Belum Punya Akun</p>
			<p class="text-xl font-bold text-muted-foreground">{ptkList.length}</p>
		</div>
	</div>

	<!-- Form tambah akun -->
	{#if formOpen}
		<form
			{...createUserF}
			class="rounded-lg border p-3 space-y-3"
		>
			<p class="text-sm font-semibold">Buat Akun Baru</p>
			<div class="grid gap-2 md:grid-cols-3">
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="ptkId">PTK</label>
					<select id="ptkId" name="ptkId" class="h-8 w-full rounded-md border bg-background px-2 text-xs" required onchange={handlePtkChange}>
						<option value="">— Pilih PTK —</option>
						{#each ptkList as p (p.id)}
							<option value={p.id}>{p.nama}{#if p.nip} ({p.nip}){/if}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="username">Username (NIP)</label>
					<Input id="username" name="username" placeholder="NIP atau username" class="h-8 text-xs" required />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="password">Password Default</label>
					<Input id="password" name="password" value="2026qwerty!" class="h-8 text-xs" required />
				</div>
				<div class="space-y-1">
					<label class="text-xs text-muted-foreground" for="role">Role</label>
					<select id="role" name="role" class="h-8 w-full rounded-md border bg-background px-2 text-xs" required>
						<option value="guru">Guru</option>
						<option value="staf">Staf</option>
						<option value="admin">Admin</option>
					</select>
				</div>
			</div>
			<p class="text-[11px] text-muted-foreground">
				Password default: <code class="font-mono">2026qwerty!</code> — guru wajib ganti saat pertama login.
			</p>
			<div class="flex gap-2">
				<Button type="submit" size="sm" class="h-8 cursor-pointer" disabled={createUserF.pending > 0}>
					{#if createUserF.pending > 0}
						<LoaderCircleIcon class="size-4 mr-1 animate-spin" />
					{/if}
					Buat Akun
				</Button>
				<Button type="button" size="sm" variant="outline" class="h-8 cursor-pointer" onclick={() => (formOpen = false)}>
					Batal
				</Button>
			</div>
		</form>
	{/if}

	<!-- Daftar user -->
	<div class="rounded-lg border">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
						<th class="px-3 py-2">Username</th>
						<th class="px-3 py-2">Nama PTK</th>
						<th class="px-3 py-2">NIP</th>
						<th class="px-3 py-2">Role</th>
						<th class="px-3 py-2">Status</th>
						<th class="px-3 py-2">Ganti Password</th>
						<th class="px-3 py-2">Terakhir Login</th>
						<th class="px-3 py-2 text-right">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each userList as u (u.id)}
						<tr class="border-b last:border-0 hover:bg-muted/30">
							<td class="px-3 py-2 font-mono text-xs font-semibold">{u.username}</td>
							<td class="px-3 py-2 text-xs">{u.ptkNama ?? '-'}</td>
							<td class="px-3 py-2 font-mono text-xs">{u.ptkNip ?? '-'}</td>
							<td class="px-3 py-2">
								<Badge variant={u.role === 'admin' ? 'default' : 'secondary'} class="text-[10px]">{u.role}</Badge>
							</td>
							<td class="px-3 py-2">
								{#if u.isActive}
									<Badge variant="secondary" class="text-[10px] bg-green-100 text-green-700">Aktif</Badge>
								{:else}
									<Badge variant="destructive" class="text-[10px]">Nonaktif</Badge>
								{/if}
							</td>
							<td class="px-3 py-2">
								{#if u.mustChangePassword}
									<Badge variant="outline" class="text-[10px] border-amber-400 text-amber-600">Wajib Ganti</Badge>
								{:else}
									<span class="text-xs text-muted-foreground">-</span>
								{/if}
							</td>
							<td class="px-3 py-2 text-xs text-muted-foreground">
								{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('id-ID') : 'Belum pernah'}
							</td>
							<td class="px-3 py-2 text-right">
								<div class="flex items-center justify-end gap-1">
									{#if loadingAction === u.id}
										<LoaderCircleIcon class="size-4 animate-spin text-muted-foreground" />
									{:else}
										<Button
											size="sm"
											variant="ghost"
											class="h-7 cursor-pointer px-2 text-xs"
											title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
											onclick={() => handleToggle(u.id, u.isActive)}
										>
											{#if u.isActive}
												<UserXIcon class="size-3.5" />
											{:else}
												<UserCheckIcon class="size-3.5" />
											{/if}
										</Button>
										<Button
											size="sm"
											variant="ghost"
											class="h-7 cursor-pointer px-2 text-xs"
											title="Reset Password"
											onclick={() => handleReset(u.id, u.username)}
										>
											<KeyRoundIcon class="size-3.5" />
										</Button>
										{#if u.role !== 'admin'}
											<Button
												size="sm"
												variant="ghost"
												class="h-7 cursor-pointer px-2 text-xs text-destructive"
												title="Hapus"
												onclick={() => handleDelete(u.id, u.username)}
											>
												<Trash2Icon class="size-3.5" />
											</Button>
										{/if}
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-3 py-8 text-center text-sm text-muted-foreground">
								Belum ada user. Klik "Tambah Akun" atau jalankan <code class="font-mono">npx tsx scripts/seed-users-guru.ts</code>.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</PageLayout>
