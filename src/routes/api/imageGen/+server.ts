import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import OpenAI from 'openai'
import type { WeaviateClient } from 'weaviate-client'
import { connectToWeaviate } from '$lib/weaviate'

let client: WeaviateClient

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Handles image generation requests using Gemma 3 via Ollama
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt } = await request.json()

		if (!prompt) {
			return json({ success: false, message: 'Prompt is required' }, { status: 400 })
		}

		// Call OpenAI API to generate image with OpenAI
		const imageData = await generateImageWithOpenAI(prompt)

		// Save the generated image to a static directory
		const imageId = crypto.randomUUID()
		const imagePath = `/static/${imageId}.png`
		const fullPath = path.join(process.cwd(), 'static', imagePath)

		// Ensure directory exists
		await fs.mkdir(path.dirname(fullPath), { recursive: true })

		// Save the image buffer to disk
		await fs.writeFile(fullPath, Buffer.from(imageData, 'base64'))

		return json({
			success: true,
			imageUrl: imagePath,
			imageId
		})
	} catch (error) {
		console.error('Image generation error:', error)
		return json(
			{
				success: false,
				message: error instanceof Error ? error.message : 'Failed to generate image'
			},
			{ status: 500 }
		)
	}
}

/**
 * Function to call OpenAI API for image generation
 */
async function generateImageWithOpenAI(prompt: string): Promise<string> {
	try {
		// 1. Call the API with the appropriate model (dall-e-3 or gtp-4o in the future)
		// 2. Process the response to get the image data
		// 3. Return the base64 encoded image data

		// Example API call (adjust based on actual API):
		const response = await openai.images.generate({
			model: 'dall-e-3',
			prompt: `Generate an image based on the following description: ${prompt}`,
			n: 1,
			size: '1792x1024', // 1792x1024 for landscape
			quality: 'hd',
			style: 'natural'
		})

		// OpenAI SDK returns the response directly, not a fetch Response object
		if (!response.data || response.data.length === 0) {
			throw new Error('Failed to generate image')
		}

		// Get the image URL from the response
		const imageUrl = response.data[0].url

		if (!imageUrl) {
			throw new Error('Image URL not provided in the API response')
		}

		// Fetch the image data from the URL and convert it to base64
		// Note: This is a placeholder. You may need to adjust this based on how the OpenAI API returns the image.
		// For example, if the image is returned as a URL, you would fetch it from OpenAI's server.
		const imageResponse = await fetch(imageUrl)
		const imageArrayBuffer = await imageResponse.arrayBuffer()
		return Buffer.from(imageArrayBuffer).toString('base64')
	} catch (error) {
		console.error('Ollama API error:', error)
		throw error
	}
}


