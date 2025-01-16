<script lang="ts">

type MessageBody = { chats: { role: 'user' | 'assistant'; content: string }[]}

let chatHistory: MessageBody['chats'] = []

	async function handleSubmit(this: HTMLFormElement, event: Event) {
		event?.preventDefault();

        const formData: FormData = new FormData(this)
        const message = formData.get('message')

        if (!message) {
            return
        }

        chatHistory = [...chatHistory, { role: 'user', content: message as string }]

        try {
            const response = new Request('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                   chats: chatHistory
                })
            })
            const answer = await fetch(response);
            // put the answer into the chat history with role 'assistant'
            console.log(answer);
        } catch (error) {
            console.error(error);
        }
	}
</script>

<main>
	<h1>Chat</h1>
	<form onsubmit={handleSubmit}>
		<textarea class="textarea" required placeholder="Type your message..." name="message" rows="3"></textarea>
		<button type="submit">Send</button>
	</form>
</main>
