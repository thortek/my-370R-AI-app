<script lang="ts">
	//import { useStreamingText } from "$lib/readableStream.svelte"
	import { readableStreamStore } from '$lib/readableStreamStore.svelte';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { fly } from 'svelte/transition';
	import TypingIndicator from '$lib/utils/typingIndicator.svelte';
	import CircleX from 'lucide-svelte/icons/circle-x';
	import ChatAppBar from '$lib/components/ChatAppBar.svelte';
	import { marked } from 'marked';
	// importing optional packages for syntax highlighting
	/* import { markedHighlight } from 'marked-highlight';
	import hljs from 'highlight.js';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import css from 'highlight.js/lib/languages/css'; */
	import DOMPurify from 'dompurify';

	// register the languages I want to highlight
	/* 	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('css', css); */

	let systemPrompt = $state('');
    let examplePrompt = $state('');
    let jsonMode = $state(false);

	let chatHistory = $state(
		typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('chats') || '[]') : []
	);

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('chats', JSON.stringify(chatHistory));
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
		event.preventDefault();
		if (response.loading) return;

		const formData: FormData = new FormData(this);
		const message = formData.get('message') as string;
/* 		formData.append('systemPrompt', systemPrompt);
        formData.append('examplePrompt', examplePrompt);
        formData.append('jsonMode', jsonMode.toString()); */

		// we need to check if the message is empty
		if (examplePrompt === '') return;

		chatHistory = [...chatHistory, { role: 'user', content: examplePrompt }];

		try {
			const answer = response.request(
				new Request('/api/chat', {
					method: 'POST',
					body: JSON.stringify({
						chats: chatHistory,
						systemPrompt,
						jsonMode,
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				})
			);

			this.reset();

			const answerText = (await answer) as string;
			console.log(answerText);

			const parsedAnswer = await marked.parse(answerText);
			const purifiedText = DOMPurify.sanitize(parsedAnswer)
				.replace(/<script>/g, '&lt;script&gt;')
				.replace(/<\/script>/g, '&lt;/script&gt;');

			chatHistory = [...chatHistory, { role: 'assistant', content: purifiedText }];
		} catch (error) {
			console.error(error);
			chatHistory = [
				...chatHistory,
				{ role: 'assistant', content: `Sorry, I am not able to answer that. ${error}` }
			];
		}
	}

	function deleteAllChats() {
		chatHistory = [];
	}

	function deleteChat(chat: { role: 'user' | 'assistant'; content: string }) {
		console.log('delete chat');
		return () => {
			chatHistory = chatHistory.filter(
				(chatItem: { role: 'user' | 'assistant'; content: string }) => chatItem !== chat
			);
		};
	}
</script>

<main class="flex min-h-screen w-screen flex-col items-center bg-primary-50-950">
	<ChatAppBar
    bind:selectedSystemPrompt={systemPrompt}
    bind:selectedExamplePrompt={examplePrompt}
    bind:jsonMode
/>
	<form class="flex w-full max-w-7xl flex-col p-2 border-2 rounded-md m-4" onsubmit={handleSubmit}>
		<div class="space-y-4">
			<!-- 		<input
			class="input m-2"
			type="text"
			name="message"
			placeholder="Type a message"
			bind:value={inputChat}
		/>
		<button class="btn variant-filled-primary m-2" type="submit">Send Chat</button> -->
			{#await new Promise((res) => setTimeout(res, 400)) then _}
				<div class="flex space-x-2">
					<Avatar
						src={'/img-tutor-girl.png'}
						name="tutor girl image"
						
					/>
					<div in:fly={{ y: 50, duration: 400 }} class="assistant-chat">
						Hello! How can I help you?
					</div>
				</div>
			{/await}
			<!-- Need to display each chat item here -->
			{#each chatHistory as chat}
				{#if chat.role === 'user'}
					<div
						class="group/chat ml-auto flex justify-end space-x-2 p-1 hover:rounded-lg hover:bg-surface-300"
					>
					<div>
						<Avatar
							name="pika thor"
							src={'/PikaThorAnime.png'}
						/>
					</div>
						<div class="user-chat">
							{chat.content}
						</div>
						<button
							type="button"
							class="group/delete btn-icon invisible max-h-6 w-6 hover:bg-surface-500 group-hover/chat:visible"
							onclick={deleteChat(chat)}
						>
						<span><CircleX /></span>
						
							<!-- <img src="/x-circle-close-delete.svg" alt="Chat close box" /> -->
						</button>
					</div>
					<!-- this else handles the assistant role chat display -->
				{:else}
					<div class="group/chat mr-auto flex space-x-2 p-1 hover:rounded-lg hover:bg-primary-300">
						<div >
						<Avatar
						src={'/img-tutor-girl.png'}
						name="tutor girl image"
					/>
						</div>
						<div class="assistant-chat">
							{@html chat.content}
						</div>
						<button
							type="button"
							class="group/delete btn-icon invisible max-h-6 w-6 hover:bg-primary-500 group-hover/chat:visible"
							onclick={deleteChat(chat)}
						>
						<span><CircleX /></span>
							<!-- <img src="/x-circle-close-delete.svg" alt="Chat close box" /> -->
						</button>
					</div>
				{/if}
			{/each}
			{#if response.loading}
				{#await new Promise((res) => setTimeout(res, 400)) then _}
					<div class="flex">
						<div class="flex space-x-2">
							<Avatar
								name="tutor girl image"
								src={'/img-tutor-girl.png'}
							/>
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
					<textarea class="textarea rounded-2xl" placeholder="Type your message..." name="message" rows="3" bind:value={examplePrompt}
					></textarea>
					<div class="flex flex-col justify-between">
						<button type="submit" class="btn preset-filled-primary-500" >Send</button>
						<button type="button" class="btn preset-filled-secondary-500"  onclick={deleteAllChats}
							>Clear Chats</button
						>
					</div>
				</div>
			</div>
		</div>
	</form>
</main>

<!-- {#if answer.loading}
    <p>Loading...</p>
{/if}
<p>{answer.text}</p> -->

<style lang="postcss">
	.assistant-chat {
		@apply rounded-lg bg-primary-100 p-2;
	}

	.user-chat {
		@apply rounded-lg bg-surface-100 p-2;
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
