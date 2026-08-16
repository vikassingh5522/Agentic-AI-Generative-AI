import { ChatMistralAI } from "@langchain/mistralai";
import { config } from "dotenv";
import readline from "readline/promises";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { tavily } from "@tavily/core";
import * as z from "zod";

config();



// 📅 CURRENT DATE


// Get the current date dynamically from the system.
const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
});


// 🔎 TAVILY SEARCH CLIENT


const tvly = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});



// 🛠️ TAVILY SEARCH TOOL


// This tool searches the internet for current information.

async function searchWeb({ query }) {

    const response = await tvly.search(query);

    return response.results
        .map((result) => result.content)
        .join("\n\n");
}


// Convert the search function into a LangChain tool.
const searchWebTool = tool(searchWeb, {

    name: "searchWeb",

    description: `
    Search the internet using Tavily.

    ALWAYS use this tool when the user asks for:
    - today's date
    - current information
    - latest news
    - recent news
    - breaking news
    - today's events
    - current weather
    - current prices
    - current facts
    - anything that may have changed recently
  `,

    schema: z.object({
        query: z
            .string()
            .describe("The current information to search on the internet"),
    }),
});



// 🤖 MISTRAL AI MODEL
const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY,
});


// 🤖 CREATE AI AGENT


const agent = createAgent({
    model,

    // Give Tavily search capability to the agent.
    tools: [searchWebTool],
});


// ⌨️ TERMINAL INPUT


const readInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});


// 🧠 CONVERSATION MEMORY
const messages = [

    new SystemMessage(`

    You are Alex, a helpful and intelligent AI assistant.

    Today's date is: ${today}

    IMPORTANT DATE RULES:

    1. If the user asks "what is today's date?",
       use today's date provided above.

    2. If the user asks for current, latest, recent,
       today's, or breaking information, ALWAYS use
       the searchWeb tool.

    3. Never guess current information from your
       training knowledge.

    4. When using searchWeb, base your answer on
       the information returned by the tool.

    5. Clearly mention dates when discussing news
       or recent events.

    6. Answer in a simple and easy-to-understand way.

  `),
];


// 🔄 CONTINUOUS CHAT LOOP


while (true) {

    // 👤 Get user prompt
    const userPrompt = await readInterface.question("User: ");


    // 📝 Store user message
    messages.push(
        new HumanMessage(userPrompt)
    );


    // 🤖 Run AI Agent
    const stream = await agent.stream(
        {
            messages,
        },
        {
            streamMode: "messages",
        }
    );


    // 📝 Store complete AI response
    let aiResponse = "";


    // ⚡ Stream AI response
    for await (const [chunk] of stream) {

        if (chunk.content) {

            process.stdout.write(chunk.content);

            aiResponse += chunk.content;
        }
    }


    // 🧠 Save AI response
    messages.push({
        role: "assistant",
        content: aiResponse,
    });


    // ⬇️ New line
    process.stdout.write("\n");
}