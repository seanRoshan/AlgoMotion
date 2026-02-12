/**
 * Service worker for AlgoMotion.
 *
 * Caches the app shell (HTML, CSS, JS, fonts) for offline access.
 * Uses a cache-first strategy for static assets and network-first
 * for navigation requests with a cached fallback.
 *
 * Spec reference: Section 17 (Offline Support)
 */

const CACHE_NAME = 'algomotion-v1';

const APP_SHELL_URLS = ['/', '/offline'];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)));
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
			),
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') return;

	// Skip Supabase API calls — always go to network
	if (url.hostname.includes('supabase')) return;

	// Skip Vercel analytics and speed insights
	if (url.pathname.startsWith('/_vercel')) return;

	// Navigation requests: network-first with offline fallback
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					return response;
				})
				.catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
		);
		return;
	}

	// Static assets: cache-first
	if (isStaticAsset(url.pathname)) {
		event.respondWith(
			caches.match(request).then((cached) => {
				if (cached) return cached;
				return fetch(request).then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					}
					return response;
				});
			}),
		);
		return;
	}

	// All other requests: network-first, cache fallback
	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.ok) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
				}
				return response;
			})
			.catch(() => caches.match(request)),
	);
});

function isStaticAsset(pathname) {
	return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp|avif)$/.test(pathname);
}
