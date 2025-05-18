import { Note } from "@note/db/types";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from "cloudflare:workers";
import { generateText, streamText } from "ai";

type Transcript = Pick<Note, "transcript">["transcript"]


export const generateTitle = async (transcript: Transcript, userNotes?: string) => {
  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_API_KEY,
  })
  
  // const { text } = await generateText({
  //   model: google('gemini-2.5-pro-exp-03-25'),
  //   prompt: "Generate a title for the following transcript:" +
  //     "Output only the title and nothing else" +
  //     "Transcript: " + JSON.stringify(transcript) +
  //     userNotes ? "User notes: " + userNotes : undefined,
  // });

  return "GENERATED TITLE"
}


export const generateNotes = (transcript: Transcript, notes?: string) => {
  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_API_KEY,
  })

  // console.log("generating notes", transcript, notes)
  return streamText({
    model: google('gemini-2.5-pro-exp-03-25'),
    prompt: "Generate notes for the following transcript:" +
      "Output only the notes in markdown and nothing else" +
      "Transcript: " + JSON.stringify(transcript) +
      notes ? "Notes: " + notes : undefined,
    onChunk: (chunk) => {
      console.log("chunk", chunk)
    },
    onFinish: () => {
      console.log("finish")
    }
  });
}


