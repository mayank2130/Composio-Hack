import { Composio } from "@composio/core";
import { OpenAIProvider } from "@composio/openai";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIProvider(),
});

export const userId = "user-123";
export { openai };
