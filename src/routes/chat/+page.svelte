<script lang="ts">
	//import { useStreamingText } from "$lib/readableStream.svelte"
	import { readableStreamStore } from '$lib/readableStreamStore';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { fly } from 'svelte/transition';
	import TypingIndicator from '$lib/utils/typingIndicator.svelte';

	let chatHistory: { role: 'user' | 'assistant'; content: string }[] = [
		{ role: 'user', content: 'Hello, can you tell me about Svelte?' }
	];

	const response = readableStreamStore();

	let responseText = '';

	async function handleSubmit(this: HTMLFormElement, event: Event) {
		event.preventDefault();
		if ($response.loading) return;

		const formData: FormData = new FormData(this);
		const message = formData.get('message') as string;

		// we need to check if the message is empty
		if (message === '') return;

		try {
			const answer = response.request(
				new Request('/api/chat', {
					method: 'POST',
					body: JSON.stringify({
						chats: chatHistory
					}),
					headers: {
						'Content-Type': 'application/json'
					}
				})
			);

			this.reset();

			const answerText = (await answer) as string;
			console.log(answerText);
			/* 			const parsedAnswer = await marked.parse(answerText)
			const purifiedText = DOMPurify.sanitize(parsedAnswer).replace(/<script>/g, '&lt;script&gt;').replace(/<\/script>/g, '&lt;/script&gt;');
*/
			//chatHistory = [...chatHistory, { role: 'assistant', content: purifiedText }];
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
			chatHistory = chatHistory.filter((chatItem) => chatItem !== chat);
		};
	}
</script>

<main class="flex h-full w-screen flex-col items-center">
	<form class="flex w-full max-w-7xl flex-col p-1" onsubmit={handleSubmit}>
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
						rounded="rounded-full"
						size="w-12"
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
						class="group/chat ml-auto flex justify-end space-x-2 p-1 hover:rounded-lg hover:bg-gray-400"
					>
						<Avatar
							name="pika thor"
							src={'/PikaThorAnime.png'}
							rounded="rounded-full"
							size="w-12"
						/>
						<div class="user-chat">
							{chat.content}
						</div>
						<button
							type="button"
							class="group/delete btn-icon invisible max-h-6 w-6 hover:bg-gray-500 group-hover/chat:visible"
							onclick={deleteChat(chat)}
						>
							<img src="/x-circle-close-delete.svg" alt="Chat close box" />
						</button>
					</div>
					<!-- this else handles the assistant role chat display -->
				{:else}
					<div class="group/chat mr-auto flex space-x-2 p-1 hover:rounded-lg hover:bg-gray-400">
						<Avatar
							name="tutor girl image"
							src={'/img-tutor-girl.png'}
							rounded="rounded-full"
							size="w-12"
						/>
						<div class="assistant-chat">
							{@html chat.content}
						</div>
						<button
							type="button"
							class="group/delete btn-icon invisible max-h-6 w-6 hover:bg-gray-500 group-hover/chat:visible"
							onclick={deleteChat(chat)}
						>
							<img src="/x-circle-close-delete.svg" alt="Chat close box" />
						</button>
					</div>
				{/if}
			{/each}
			{#if $response.loading}
				{#await new Promise((res) => setTimeout(res, 400)) then _}
					<div class="flex">
						<div class="flex space-x-2">
							<Avatar
								name="tutor girl image"
								src={'/img-tutor-girl.png'}
								rounded="rounded-full"
								size="w-12"
							/>
							<div class="assistant-chat">
								{#if $response.text === ''}
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
					<textarea class="textarea" placeholder="Type your message..." name="message" rows="3"
					></textarea>
					<div class="flex flex-col justify-between">
						<button class="variant-filled-primary btn" type="submit">Send</button>
						<button class="variant-outline-primary btn" type="reset" onclick={deleteAllChats}
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
		@apply rounded-lg bg-gray-200 p-2 text-gray-800;
	}

	.user-chat {
		@apply bg-slate-800 text-white;
	}
</style>
