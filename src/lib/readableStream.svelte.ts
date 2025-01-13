export function useStreamingText(request: Request) {
    let loading = $state(false);
    let text = $state("");

    async function startStream() {
        loading = true;
        text = "";
        
        try {
            const response = await fetch(request);
            if (!response.ok) throw new Error(response.statusText);
            if (!response.body) return;

            const reader = response.body
                .pipeThrough(new TextDecoderStream())
                .getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) text += value;
            }
        } catch (err: any) {
            text = err.toString();
            throw err;
        } finally {
            loading = false;
        }
    }

    return { loading, text, startStream };
}