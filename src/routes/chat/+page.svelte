<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import TypingIndicator from '$lib/utils/typingIndicator.svelte';
	import { readableStreamStore } from '$lib/readableStreamStore.svelte';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	type MessageBody = { chats: { role: 'user' | 'assistant'; content: string }[] };

	let chatHistory = $state(
		typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('chatHistory') || '[]') : []
	);

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
		}
	});

	const response = readableStreamStore();

	let responseText = $state('');

	$effect(() => {
		if (response.text !== '') {
			(async () => {
				const parsedText = await marked.parse(response.text);
				responseText = DOMPurify.sanitize(parsedText)
					.replace(/<script>/g, '&lt;script&gt;')
					.replace(/<\/script>/g, '&lt;/script&gt;');
			})();
		}
	});

	async function handleSubmit(this: HTMLFormElement, event: Event) {
		event?.preventDefault();
		if (response.loading) return; // prevent request while waiting for response

		const formData: FormData = new FormData(this);
		const message = formData.get('message');

		if (!message) {
			return;
		}

		chatHistory = [...chatHistory, { role: 'user', content: message as string }];

		try {
			const answer = response.request(
				new Request('/api/chat', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						chats: chatHistory
					})
				})
			);

			this.reset(); // clear the form

			const answerText = (await answer) as string;

			const parsedAnswer = await marked.parse(answerText)
			const purifiedText = DOMPurify.sanitize(parsedAnswer)
				.replace(/<script>/g, '&lt;script&gt;')
				.replace(/<\/script>/g, '&lt;/script&gt;');

			// put the answer into the chat history with role 'assistant'

			chatHistory = [...chatHistory, { role: 'assistant', content: purifiedText }];

			console.log(answerText);

		} catch (error) {
			console.error(error);
		}
	}

	function deleteAllChats() {
		chatHistory = [];
	}
</script>

<main class="flex min-h-screen w-screen flex-col items-center bg-primary-50-950">
	<form onsubmit={handleSubmit} class="flex w-full max-w-7xl flex-col p-2 m-4 border-2 rounded-md border-primary-500">
		<div class="space-y-4">
			<div class="flex space-x-2">
				<Avatar src="/img-tutor-girl.png" name="Tutor girl image" />
				<div class="assistant-chat">Hello! How can I help you?</div>
			</div>
			<!-- Need to display each chat item here -->
			{#each chatHistory as chat, i}
				{#if chat.role === 'user'}
					<div class="ml-auto flex justify-end">
						<div>
							<Avatar src="/PikaThorAnime.png" name="User image" />
						</div>
						<div class="user-chat">
							{chat.content}
						</div>
					</div>
					<!-- this else handles the assistant role chat display -->
				{:else}
					<div class="mr-auto flex">
						<div>
							<Avatar src="/img-tutor-girl.png" name="Tutor girl image" />
						</div>
						<div class="assistant-chat">
							{@html chat.content}
						</div>
					</div>
				{/if}
			{/each}

			{#if response.loading}
				{#await new Promise((res) => setTimeout(res, 400)) then _}
					<div class="flex">
						<div class="flex space-x-2">
							<Avatar name="tutor girl image" src={'/img-tutor-girl.png'} />
							<div class="assistant-chat">
								{#if response.text === ''}
									<TypingIndicator />
								{:else}
									{@html responseText}
								{/if}
							</div>
						</div>
					</div>
				{/await}
			{/if}
			<div class="space-y-4">
				<hr />
				<div class="flex space-x-4">
					<textarea
						class="textarea"
						required
						placeholder="Type your message..."
						name="message"
						rows="3"
					></textarea>
					<div class="flex flex-col justify-between">
						<button type="submit" class="btn preset-filled-primary-500">Send</button>
						<button type="button" class="btn preset-filled-secondary-500" onclick={deleteAllChats}>Clear Chats</button>
					</div>
				</div>
			</div>
		</div>
	</form>
</main>

<style lang="postcss">
	.assistant-chat {
		@apply rounded-lg bg-primary-100 p-2;
	}

	.user-chat {
		@apply rounded-lg bg-surface-200 p-2;
	}

	.assistant-chat :global {
		ol {
			@apply list-decimal list-inside ml-4;
		}
		ul {
            @apply list-disc list-inside ml-4;
        }
		 /* Code blocks */
		 pre {
            @apply bg-surface-700 p-4 rounded-lg my-4 overflow-x-auto;
        }
        code {
            @apply font-mono bg-surface-100 px-1 py-0.5 rounded;
        }
        
        /* Headers */
        h1 { @apply text-2xl font-bold mb-4; }
        h2 { @apply text-xl font-bold mb-3; }
        h3 { @apply text-lg font-bold mb-2; }
        
        /* Links */
        a {
            @apply text-primary-500 hover:underline;
        }
        
        /* Blockquotes */
        blockquote {
            @apply border-l-4 border-surface-500 pl-4 italic;
        }
	}
</style>