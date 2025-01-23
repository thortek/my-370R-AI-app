import OpenAI from 'openai';

// Create a new OpenAI instance to connect with your OpenAI API key
//const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

const openai = new OpenAI({
	baseURL: 'http://localhost:11434/v1',
	apiKey: 'ollama' // required but unused
});

export type MessageBody = { chats: { role: 'user' | 'assistant'; content: string }[] };

export const POST = async ({ request }) => {
	try {
		const body: MessageBody = await request.json();

		console.log(body);

		const stream = await openai.chat.completions.create({
			model: 'llama3.2',
			messages: [
        { role: 'developer', content: 'You are a helpful assistant.' },
        ...body.chats
      ],
			stream: true
		});

		// Create a new ReadableStream for the response
		const readableStream = new ReadableStream({
			async start(controller) {
				for await (const chunk of stream) {
					const text = chunk.choices[0]?.delta?.content || '';
					controller.enqueue(text);
				}
				controller.close();
			}
		});

		//console.log(completion.choices[0].message.content)

		/*   return new Response(JSON.stringify({ message: completion.choices[0].message.content })) */

		return new Response(readableStream, {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		return new Response('Something went wrong', { status: 500 });
	}
};
