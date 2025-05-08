import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { bearerAuth } from 'hono/bearer-auth'
import { getDb } from '@note/db'
import { notes } from '@note/db/schema'

type Bindings = {
  DATABASE_URL: string
  GOOGLE_API_KEY: string
  BEARER_TOKEN: string
  ENV: "development" | "production"
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const db = getDb(c.env.DATABASE_URL)
  const res = await db.select().from(notes)
  return c.json(res)
})

app.use(async (c, next) => {
  const bearer = bearerAuth({
    token: [c.env.BEARER_TOKEN],
    verifyToken: async (token, c) => {
      if (c.env.ENV === "development") {
        console.log("Skipping authentication, environment is development")
        return true
      }

      return token === c.env.BEARER_TOKEN
    },
    noAuthenticationHeaderMessage: 'No token provided',
    invalidTokenMessage: 'Invalid token',
    invalidAuthenticationHeaderMessage: 'Invalid authentication header',
  })

  console.log("Initializing authentication, environment is", c.env.ENV)
  return bearer(c, next)
}).post(
  '/note/:id/generate',
  zValidator(
    'param',
    z.object({
      id: z.string().uuid()
    })
  ),
  async (c) => {
    const { id: noteId } = c.req.valid('param')

    const db = getDb(c.env.DATABASE_URL)

    const [res] = await db.select().from(notes).where(eq(notes.id, noteId))
    if (!res) {
      throw new HTTPException(404, { message: "Note not found" })
    }

    const google = createGoogleGenerativeAI({
      apiKey: c.env.GOOGLE_API_KEY
    });

    let text = null
    try {
      const { text: generatedText } = await generateText({
        model: google('gemini-2.5-pro-exp-03-25'),
        prompt:
          'Use the following call transcript to generate a markdown summary of the call.' +
          'DO NOT INCLUDE ANYTHING OTHER THAN MARKDOWN' +
          'Transcript: ' + JSON.stringify(res.transcript),
      });
      text = generatedText
    } catch (e) {
      throw new HTTPException(500, { message: "Failed to generate notes" })
    }

    //save to db
    try {
      await db.update(notes).set({
        generatedNotes: text
      }).where(eq(notes.id, noteId))
    } catch (e) {
      throw new HTTPException(500, { message: "Failed to save generated notes" })
    }

    return c.json({ text })
  })

export default app