import { ChatMistralAI } from "@langchain/mistralai";
import { config } from "dotenv";
import readline from "readline/promises";
import { HumanMessage, AIMessage, SystemMessage,  } from "@langchain/core/messages"; 
/*

HumanMessage and AIMessage are used to store the user's and AI's messages as structured conversation history (memory) for LangChain.

HumanMessage, AIMessage, and SystemMessage are used to manage the conversation:

👤 HumanMessage → stores the user's message.
🤖 AIMessage → stores the AI's response.
⚙️ SystemMessage → gives the AI instructions/rules about how it should behave.
 how behave  and  additional informations .


Easy example:
SystemMessage = "You are a helpful coding assistant."
HumanMessage = "Write JavaScript code."
AIMessage = "Here is the code..." 

*/


config();


// 🤖 AI MODEL SETUP
// Creates a connection with the Mistral AI model.
const model = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY,
});


// 💬 BASIC AI REQUEST
// Sends a question/prompt to the AI and receives the complete response.

// const response = await model.invoke("Write the JS code for a prime number");
// console.log(response.content); // 🤖 AI answer


// ⚡ STREAMING RESPONSE — LIKE CHATGPT
// Instead of waiting for the complete answer,
// the AI response is received and displayed chunk by chunk.

// const stream = await model.stream(
//     "Write the JS code for a prime number"
// );

// for await (const chunk of stream) {
//     process.stdout.write(chunk.content); // 🤖 Print AI response in real-time
// }


// ⌨️ USER INPUT USING READLINE ->  Allows the user to enter a prompt from the terminal  and then displays the entered prompt.

// 📦 readline is a built-in Node.js module ,  No need to install it separately with npm.

const readInterface = readline.createInterface({
    input: process.stdin,   // 👤 User input from keyboard
    output: process.stdout, // 🖥️ Output to terminal
});

// const userPrompt = await readInterface.question("Enter your prompt: ");

// console.log(userPrompt); // 📝 Display user's prompt

// readInterface.close(); // 🔴 Close the readline interface


// 🔄 CONTINUOUS CHAT LOOP
// Keeps asking the user for prompts until the program is stopped.


const messages = [
    new SystemMessage(`you are alex , you are joyful , senior devloper who love to explane the thingh related to MERN And Java tack stack . 
        
    create date is ${new Date().toLocaleDateString()}
        
        `)

  
];  //this array use like memory 


while (true) {

    // 👤 Get prompt from user
    const userPrompt = await readInterface.question("User: ");

    // 📝 Store the user's message in conversation history
    messages.push(new HumanMessage(userPrompt));

    // 🤖 Send the complete conversation history to Mistral AIhellow
    // This allows the AI to understand previous messages.
    const stream = await model.stream(messages);

    // 📝 Variable used to collect the complete AI response
    // while the response is being streamed.
    let aiResponse = "";

    // ⚡ Print AI response chunk by chunk
    for await (const chunk of stream) {

      // 🖥️ Display each chunk immediately in the terminal
        process.stdout.write(chunk.content);

        // 🧠 Store each chunk so we can save
        // the complete AI response in memory.
        aiResponse += chunk.content;
    }

    // 🧠 Store the complete AI response in conversation history
    messages.push(new AIMessage(aiResponse));


    // ⬇️ Move to the next line after the AI finishes responding
    process.stdout.write("\n");
}