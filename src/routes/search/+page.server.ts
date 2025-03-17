import type { Actions, RequestEvent } from '@sveltejs/kit'
import { connectToWeaviate } from '$lib/weaviate';

export const actions: Actions = {
    imageSearch: async ({ request }: RequestEvent) => {
        try {

        const client = await connectToWeaviate();
        const formData = await request.formData()
        const query = formData.get('query') as string;

        if (!query) {
            return {
                success: false,
                message: 'Search query is required'
            }
        }

        // get the ImageCollection
        const collection = client.collections.get('ImageCollection')

        // perform a vector search using the query
        // Use nearText for semantic search

        const searchResults = await collection.query.nearText(query, {
            returnProperties: ["title", "thumbnailPath"],
            limit: 20,
            returnMetadata: ["distance", "certainty"]
        })

        console.log(`Search results for "${query}":`, searchResults)

        return {
            success: true,
            data: searchResults
        }

        } catch (error) {

        }
    }
}