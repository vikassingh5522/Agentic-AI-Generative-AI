// ============================================================
// 📦 IMPORTS
// ============================================================

// 🤖 Mistral AI model from LangChain
import { ChatMistralAI } from "@langchain/mistralai";

// ⚙️ Loads environment variables from the .env file
import { config } from "dotenv";

// ⌨️ Built-in Node.js module for taking input from the terminal
import readline from "readline/promises";

// 💬 Message types used to maintain conversation history
//
// HumanMessage  → 👤 User's message
// AIMessage     → 🤖 AI's response
// SystemMessage → ⚙️ Instructions/rules for the AI
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";

// 🛠️ LangChain tool creation
import { tool } from "@langchain/core/tools";

// 🤖 Creates an AI Agent that can use tools
import { createAgent } from "langchain";

// ✅ Zod is used to define and validate tool input
import * as z from "zod";


// ============================================================
// ⚙️ ENVIRONMENT CONFIGURATION
// ============================================================

// Loads variables from .env
//
// Example .env:
// MISTRAL_API_KEY=your_api_key
config();


// ============================================================
// 🛠️ AI AGENT TOOL
// ============================================================

// 📌 This function contains the actual logic/data
// that the AI agent can use.
//
// In a real application, this could:
// - Call an external API
// - Search the internet
// - Query a database
// - Get weather information
// - Get stock prices
// - Fetch company information

function getLatestInformations({ query }) {

  // 🔎 `query` contains the topic requested by the AI.
  console.log(`\n🔎 Tool searching for: ${query}`);

  // 📚 Currently returning static data.
  // Later, you can replace this with a real API/database call.
  return `
    India is rapidly advancing in technology and is a major hub
    for software development and IT services.

    India has a growing startup ecosystem with companies
    working in fintech, healthtech, edtech, AI, and SaaS.

    India has also made significant progress in:
    - 🚀 Space exploration
    - 🌱 Renewable energy
    - 💻 Digital infrastructure
    - 🤖 Artificial Intelligence
  `;
}


// ============================================================
// 🔧 CONVERT FUNCTION INTO LANGCHAIN TOOL
// ============================================================

// A normal JavaScript function is converted into a
// LangChain Tool so that the AI Agent can decide
// when it should use this function.

const getLatestInformationsTool = tool(
  getLatestInformations,
  {

    // 🏷️ Name used by the AI to identify this tool
    name: "getLatestInformations",

    // 📝 Description tells the AI what this tool does
    description:
      "Get information about a topic using the latest available information.",

    // ✅ Zod schema defines the input expected by the tool
    schema: z.object({

      // 🔎 Topic that the AI wants information about
      query: z
        .string()
        .describe("The topic to get information about"),
    }),
  }
);


// ============================================================
// 🤖 AI MODEL SETUP
// ============================================================

// Creates a connection with the Mistral AI model.

const model = new ChatMistralAI({
  model: "mistral-medium-latest",

  // 🔐 API key is loaded from the .env file
  apiKey: process.env.MISTRAL_API_KEY,
});


// ============================================================
// 🤖 CREATE AI AGENT
// ============================================================

// The Agent connects:
// 🤖 Mistral Model
// +
// 🛠️ Available Tools
// The AI can now decide whether it needs to use a tool.

const agent = createAgent({
  model,

  // 🛠️ Give the tool to the AI Agent
  tools: [getLatestInformationsTool],
});


// ============================================================
// 💬 BASIC AI REQUEST
// ============================================================

// You can also directly communicate with the model
// without using the Agent.

// const response = await model.invoke(
//   "Write the JavaScript code for a prime number"
// );

// console.log(response.content);


// ============================================================
// ⚡ BASIC STREAMING RESPONSE
// ============================================================

// Instead of waiting for the complete response,
// the AI response can be received chunk by chunk.

// const stream = await model.stream(
//   "Write the JavaScript code for a prime number"
// );

// for await (const chunk of stream) {

//   // ⚡ Print every chunk immediately
//   process.stdout.write(chunk.content);
// }


// ============================================================
// ⌨️ USER INPUT USING READLINE
// ============================================================

// 📦 readline is a built-in Node.js module.
//
// It allows the user to enter prompts directly
// from the terminal.

const readInterface = readline.createInterface({

  // 👤 Read input from keyboard
  input: process.stdin,

  // 🖥️ Display output in terminal
  output: process.stdout,
});


// ============================================================
// 🧠 CONVERSATION MEMORY
// ============================================================

// This array stores the conversation history.
//
// SystemMessage → ⚙️ AI instructions
// HumanMessage  → 👤 User messages
// AIMessage     → 🤖 AI responses
//
// Because previous messages are stored here,
// the AI can understand the previous conversation.

const messages = [

  new SystemMessage(`

    You are Alex.

    You are a joyful and friendly senior developer.

    You love explaining concepts related to:

    - MERN Stack
    - Java
    - Spring Boot
    - JavaScript
    - AI and LangChain

    Always explain technical concepts in a simple
    and easy-to-understand way.

    Current date:
    ${new Date().toLocaleDateString()}

  `),

];


// ============================================================
// 🔄 CONTINUOUS CHAT LOOP
// ============================================================

// Keeps asking the user for prompts.
//
// Flow:
//
// 👤 User
//    ↓
// 📝 HumanMessage
//    ↓
// 🤖 AI Agent
//    ↓
// 🛠️ Agent decides whether to use a tool
//    ↓
// ⚡ Stream AI response
//    ↓
// 🧠 Save AI response
//    ↓
// 🔄 Ask for next prompt

while (true) {

  // ==========================================================
  // 👤 GET USER PROMPT
  // ==========================================================

  const userPrompt = await readInterface.question(
    "User: "
  );


  // 📝 STORE USER MESSAGE


  // Add the user's message to conversation memory.

  messages.push(
    new HumanMessage(userPrompt)
  );


 
  // 🤖 SEND MESSAGE TO AI AGENT


  // The Agent receives the complete conversation history.

  const stream = await agent.stream(

    // 📚 Conversation history
    {
      messages,
    },

    // ⚡ Stream messages as they are generated
    {
      streamMode: "messages",
    }
  );


  // 📝 STORE AI RESPONSE


  // This variable collects all AI response chunks
  // into one complete response.

  let aiResponse = "";



  // ⚡ STREAM AI RESPONSE


  for await (const [chunk] of stream) {

    // 🖥️ Display the response immediately
    process.stdout.write(chunk.content);

    // 🧠 Store the response chunk
    aiResponse += chunk.content;
  }



  // 🧠 SAVE AI RESPONSE TO MEMORY


  // After the AI finishes responding,
  // save its complete response.

  messages.push(
    new AIMessage(aiResponse)
  );

  process.stdout.write("\n");
}