import { Hono } from 'hono'
import type { Ai } from '@cloudflare/workers-types'

type Bindings = {
  AI: Ai
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// app.get('/ai', async (c) => {
//   try {
//     const responseStream = await c.env.AI.run('@cf/google/gemma-2b-it-lora', {
//       stream: true,
//       messages: [{ role: 'user', content: 'What is the capital of France?' }],
//     })

//     return new Response(responseStream as ReadableStream, {
//       headers: {
//         "content-type": "text/event-stream",
//       },
//     });
//   } catch (e: any) {
//     console.error('Error calling AI:', e)
//     return c.json({ error: 'Failed to call AI service', details: e.message }, 500)
//   }
// })

export default app