<script lang="ts">
	import { TRANSACTION_CATEGORIES } from '@finance-app/constants';
	import type { ApiResponse } from '@finance-app/types';
	import { isValidEmail } from '@finance-app/validation';

	let apiStatus = $state<{ loading: boolean; connected: boolean; message?: string }>({
		loading: false,
		connected: false
	});

	let testEmail = $state('');
	let emailValidationResult = $state<boolean | null>(null);

	function checkEmail() {
		emailValidationResult = isValidEmail(testEmail);
	}

	async function testApiConnection() {
		apiStatus.loading = true;
		try {
			const res = await fetch('http://localhost:3000/health');
			if (res.ok) {
				const data: ApiResponse<{ status: string; timestamp: string }> = await res.json();
				apiStatus.connected = true;
				apiStatus.message = `Online - Timestamp: ${data.data?.timestamp}`;
			} else {
				apiStatus.connected = false;
				apiStatus.message = `HTTP ${res.status}`;
			}
		} catch (err) {
			apiStatus.connected = false;
			apiStatus.message = 'API Offline (Jalankan: bun run dev:api)';
		} finally {
			apiStatus.loading = false;
		}
	}
</script>

<svelte:head>
	<title>Finance App - Monorepo Dashboard</title>
</svelte:head>

<main class="container">
	<header class="header">
		<div class="badge">Bun + SvelteKit + ElysiaJS</div>
		<h1>Finance App Monorepo</h1>
		<p class="subtitle">Pondasi arsitektur monorepo berhasil diinisialisasi.</p>
	</header>

	<section class="grid">
		<!-- Card 1: Backend Connection Test -->
		<div class="card">
			<h2>Backend API Status</h2>
			<p class="description">Test koneksi HTTP langsung ke ElysiaJS API endpoint (<code>http://localhost:3000/health</code>).</p>
			
			<div class="status-box">
				{#if apiStatus.loading}
					<span class="status-indicator loading"></span> Memeriksa koneksi...
				{:else if apiStatus.connected}
					<span class="status-indicator online"></span>
					<span class="text-success">{apiStatus.message}</span>
				{:else if apiStatus.message}
					<span class="status-indicator offline"></span>
					<span class="text-error">{apiStatus.message}</span>
				{:else}
					<span class="status-indicator idle"></span> Siap diuji
				{/if}
			</div>

			<button class="btn" onclick={testApiConnection} disabled={apiStatus.loading}>
				{apiStatus.loading ? 'Menguji...' : 'Test Koneksi Backend'}
			</button>
		</div>

		<!-- Card 2: Shared Packages Verification -->
		<div class="card">
			<h2>Shared Validation Package</h2>
			<p class="description">Memverifikasi fungsi dari package bersama <code>@finance-app/validation</code>.</p>
			
			<div class="input-group">
				<input
					type="email"
					placeholder="Masukkan email..."
					bind:value={testEmail}
					oninput={checkEmail}
				/>
			</div>

			{#if emailValidationResult !== null}
				<p class="validation-msg">
					Status:
					<strong class={emailValidationResult ? 'text-success' : 'text-error'}>
						{emailValidationResult ? 'Email Valid ✅' : 'Format Email Belum Valid ❌'}
					</strong>
				</p>
			{/if}
		</div>

		<!-- Card 3: Shared Constants -->
		<div class="card full-width">
			<h2>Shared Constants Package</h2>
			<p class="description">Kategori transaksi yang di-import langsung dari <code>@finance-app/constants</code>:</p>
			
			<div class="tags">
				{#each TRANSACTION_CATEGORIES as category}
					<span class="tag">{category}</span>
				{/each}
			</div>
		</div>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: #0f172a;
		color: #f8fafc;
		min-height: 100vh;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
	}

	.header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		background: rgba(99, 102, 241, 0.2);
		color: #a5b4fc;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 1rem;
		border: 1px solid rgba(99, 102, 241, 0.4);
	}

	h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(to right, #38bdf8, #818cf8, #c084fc);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		color: #94a3b8;
		font-size: 1.1rem;
		margin: 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.card {
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
	}

	.full-width {
		grid-column: 1 / -1;
	}

	h2 {
		margin-top: 0;
		font-size: 1.25rem;
		color: #f1f5f9;
	}

	.description {
		color: #94a3b8;
		font-size: 0.9rem;
		margin-bottom: 1.25rem;
	}

	code {
		background: #0f172a;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: monospace;
		color: #38bdf8;
	}

	.status-box {
		background: #0f172a;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-indicator {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}

	.online { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
	.offline { background: #ef4444; }
	.loading { background: #eab308; }
	.idle { background: #64748b; }

	.text-success { color: #4ade80; }
	.text-error { color: #f87171; }

	.btn {
		background: #6366f1;
		color: white;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn:hover:not(:disabled) {
		background: #4f46e5;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.input-group input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.6rem 0.8rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 6px;
		color: #f8fafc;
		font-size: 0.95rem;
	}

	.input-group input:focus {
		outline: none;
		border-color: #6366f1;
	}

	.validation-msg {
		font-size: 0.9rem;
		margin-top: 0.75rem;
		margin-bottom: 0;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		background: #0f172a;
		border: 1px solid #334155;
		padding: 0.35rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-family: monospace;
		color: #cbd5e1;
	}
</style>
