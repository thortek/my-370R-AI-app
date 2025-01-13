import type { WeaviateClient } from 'weaviate-client';
import weaviate from 'weaviate-client';
import type { PageServerLoad } from './$types';

let client: WeaviateClient;

async function connectToWeaviate(): Promise<WeaviateClient> {
	const clientPromise = weaviate.connectToCustom({
		httpHost: 'localhost',
		httpPort: 8084,
		grpcHost: 'localhost',
		grpcPort: 50054
	});
	return clientPromise;
}

export const load: PageServerLoad = async ({ params }) => {
    const client = await connectToWeaviate();

    const clientReadiness = await client.isReady();

    console.log(clientReadiness); // Should return `true`

    client.close(); // Close the client connection

    return {
        ready: clientReadiness
    };
};
