<script lang="ts">
	async function handleSubmit(event: Event) {
		event?.preventDefault();
        try {
            const response = new Request('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: (event?.target as HTMLFormElement).querySelector('input')?.value,
                })
            })
            const answer = await fetch(response);
            console.log(answer);
        } catch (error) {
            console.error(error);
        }
	}
</script>

<main>
	<h1>Chat</h1>
	<form onsubmit={handleSubmit}>
		<input required type="text" placeholder="Type your message" />
		<button type="submit">Send</button>
	</form>
</main>
