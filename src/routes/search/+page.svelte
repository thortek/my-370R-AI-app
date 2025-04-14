<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData, PageData } from './$types'
	import type { ActionResult } from '@sveltejs/kit'

	//import { testData } from './test-data';

	type ImageResult = {
		id: string
		thumbnailUrl: string
		title: string
		[key: string]: any // Allow for additional properties
	}

	const props = $props<{ data: PageData; form: ActionData }>()

	// Track search state
	let searchPerformed = $state(false)
	let searchQuery = $state('')
	let results = $state<ImageResult[]>([])

	function processSubmit() {
		return async ({ result }: { result: ActionResult }) => {
			console.log('Form submission result:', result)
			if (result.type === 'success' && result.data) {
				searchPerformed = true
				searchQuery = result.data.searchQuery || ''

				// Ensure we have an array of properly typed objects
				if (Array.isArray(result.data.images)) {
					results = result.data.images.map((img: any) => ({
						id: img.id || '',
						title: img.title || 'Untitled',
						thumbnailUrl: img.thumbnailUrl || '',
						...img // Include any other properties
					}))
				} else {
					results = []
				}

				console.log(`Got ${results.length} results for "${searchQuery}"`)
			}
		}
	}
</script>

<main class="container mx-auto max-w-4xl p-4">
	<h1 class="text-primary-700 mb-6 text-center text-3xl font-bold">AI Image Search</h1>
	<div class="mb-8 rounded-lg bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-semibold">Search Images</h2>
		<form
			method="POST"
			action="?/imageSearch"
			use:enhance={processSubmit}
			class="flex items-center space-x-2">
			<div class="flex-grow">
				<input
					type="text"
					name="query"
					placeholder="Search for images"
					class="w-full rounded-lg border border-gray-300 p-2" />
			</div>
			<button type="submit" class="bg-primary-500 rounded-lg p-2 text-white"> Search </button>
		</form>
	</div>

	<!-- Debug information -->
	<div class="mb-4 rounded bg-gray-100 p-3 text-sm">
		<p>Search performed: {searchPerformed ? 'Yes' : 'No'}</p>
		<p>Query: {searchQuery || 'None'}</p>
		<p>Results count: {results.length}</p>
	</div>

	<div class="rounded-lg border bg-white">
		<ul class="divide-y divide-gray-200">
			{#each results as result, i}
				<li class="flex items-center gap-4 p-4">
					<span
						class="bg-primary-100 text-primary-800 flex h-8 w-8 items-center justify-center rounded-full font-bold">
						{i + 1}
					</span>
					<div class="flex w-full justify-between gap-4">
						<div class="flex-grow">
							<div>
								<p><strong>Title:</strong>{result.title}</p>
								
							</div>
						</div>
						<div>
							<p><strong>Distance:</strong> {result.distance}</p>
							<p><strong>Match Score:</strong> {result.matchScore}</p>
						</div>
						<div class="flex items-center">
							<img src={result.thumbnailUrl} alt={result.title} class="h-32 w-32 rounded-lg object-cover" />
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</div>

	<div class="mt-8 text-center">
		<a href="/images" class="text-primary-600 hover:underline">Back to Image Collection</a>
	</div>
</main>
