/* eslint-disable */
import { Configuration, OpenAIApi } from "openai-edge";
import { env } from "~/env.mjs";

const configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY ?? "",
});

export const openai = new OpenAIApi(configuration);
