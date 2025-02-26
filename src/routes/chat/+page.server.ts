import type { Actions } from './$types';
import { Readable } from 'stream';
import { promises as fsPromises } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pipeline } from 'stream/promises'
import fs from 'fs'
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import type { WeaviateClient } from 'weaviate-client';
import weaviate from 'weaviate-client';
import type { ChunkObject } from '$lib/types/ChunkObject';

const OPTIMAL_CHUNK_SIZE = 400  // tokens
const CHUNK_OVERLAP = 50
const CHARS_PER_TOKEN = 4 // Average for Llama-friendly models (emprically determined)

let client: WeaviateClient

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadPath = process.env.NODE_ENV === 'production' ? '/uploads' : path.resolve(__dirname, '../../uploads')

async function connectToWeaviate(): Promise<WeaviateClient> {
	const clientPromise = weaviate.connectToCustom({
		httpHost: 'localhost',
		httpPort: 8084,
		grpcHost: 'localhost',
		grpcPort: 50054,
		headers: {
			'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY as string
		}
	});
	return clientPromise;
}

export async function load() {
	client = await connectToWeaviate()

    if (!client) {
        return {
            status: 500,
            error: 'Failed to connect to Weaviate'
        }
    }

	const fileChunkCollection = client.collections.get<ChunkObject>('Chunks')
	if (fileChunkCollection) {
		const uniqueFileNames = new Set<string>()
		let count = 0

		for await (const fileChunk of fileChunkCollection.iterator()) {
			count++
			uniqueFileNames.add(fileChunk.properties.file_name)
		}

		return {
			status: 200,
			count,
			fileNames: Array.from(uniqueFileNames) // Convert the Set to an array
		}
	} else {
		return {
			status: 404,
			error: 'No collections found'
		}
	}
}

export const actions = {
    uploadFile: async ( {request} ) => {
        const formData = await request.formData();
        console.log(formData);
        const uploadedFile = formData?.get('file') as unknown as File | undefined

        if (!uploadedFile) {
            console.log('No file uploaded')
            return {
                status: 400,
                body: {
                    error: 'No file uploaded'
                }
            }
        }

        try {
            const fileBuffer = await uploadedFile.arrayBuffer();
            
            const readableStream = new Readable()
            readableStream.push(Buffer.from(fileBuffer))
            readableStream.push(null)

            // Delete all existing files in the uploads directory
            const files = await fsPromises.readdir(uploadPath)
            for (const file of files ) {
                await fsPromises.unlink(path.join(uploadPath, file))
            }

            //const timeStampSuffix = Date.now();
			//const fileNameOnly = uploadedFile.name.replace('.pdf', '');
			const uploadedFilePath = path.join(uploadPath, uploadedFile.name);

			await pipeline(readableStream, fs.createWriteStream(uploadedFilePath));

            console.log('File uploaded')

            const addedFileData = await createFileDataObject(uploadedFilePath)

            return {
				status: 200,
				success: 'File uploaded and processed successfully.',
                data: addedFileData
			};
        }
        catch (e) {
            return {
                status: 500,
                body: {
                    error: 'Failed to upload file'
                }
            }
        }
    }


} as Actions

async function createFileDataObject(uploadedFilePath: string) {
    const fileData = await fsPromises.readFile(uploadedFilePath)
    const fileBlob = new Blob([fileData])

    const loader = new WebPDFLoader(fileBlob, {
        splitPages: true,
    })

    const docs = await loader.load()
    const chunks = []

    for (const doc of docs) {
        const pageContent = doc.pageContent

        // Calculate chunks with overlapping content
        let startPos = 0
        while (startPos < pageContent.length) {
            const chunk = pageContent.slice(startPos, startPos + (OPTIMAL_CHUNK_SIZE * CHARS_PER_TOKEN))

            chunks.push({
                chunk_text: chunk,
                file_name: path.basename(uploadedFilePath),
                metadata: {
                    totalPages: docs.length,
                    pageNumberLocation: doc.metadata?.loc?.pageNumber,
                    chunkIndex: chunks.length,
                }
            })

            startPos += ((OPTIMAL_CHUNK_SIZE - CHUNK_OVERLAP) * CHARS_PER_TOKEN)
        }
        //console.log('Chunks: ', chunks)
    }

    await importFileChunks(chunks)
    
    return { success: true }
}

async function importFileChunks(chunks: any[]) {
    client = await connectToWeaviate()
    const fileChunkCollection = client.collections.get<ChunkObject>('Chunks')

    // Create a log file with timestamp
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	const logPath = path.join(uploadPath, `chunks-log-${timestamp}.json`)

	// Write initial chunks data
	await fsPromises.writeFile(
		logPath,
		JSON.stringify(
			{
				totalChunks: chunks.length,
				timestamp: new Date().toISOString(),
				chunks: chunks.map((chunk) => ({
					text: chunk.chunk_text,
					fileName: chunk.file_name,
					metadata: chunk.metadata
				}))
			},
			null,
			2
		)
	)

	console.log(`Chunk log written to: ${logPath}`)

    //const result = await fileChunkCollection.data.insertMany(chunks)
    
    // Break chunks into smaller batches
    const BATCH_SIZE = 100
    const batches= []

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        batches.push(chunks.slice(i, i + BATCH_SIZE))
    }

    console.log(`Inserting ${batches.length} batches of ${BATCH_SIZE} chunks each`)

    let totalInserted = 0
    for (const [index, batch] of batches.entries()) {
        try {
            await fileChunkCollection.data.insertMany(batch)
            totalInserted += batch.length
            console.log(
                `Progress: ${totalInserted} / ${chunks.length} chunks inserted (${Math.round(
                    (totalInserted / chunks.length) * 100)}%)`
            )

        } catch (e) {
            console.error(`Failed at chunk ${totalInserted + 1}: `, e)
            throw e
        }
    }

}