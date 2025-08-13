import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync"; 
import dotenv from "dotenv";
import { exec } from "child_process";    
import { promisify } from "util";  
import os from "os";         
const platform = os.platform();       
//     
dotenv.config(); // Load environment variables from .env file  
//history initialize
const History = [];  
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });  

const execPromise = promisify(exec);

async function executeCommand({command}) {
  
  try {
    // Execute the command and return the result
    const {stdout, stderr} = await execPromise(command);
    if (stderr) {
      console.error(`Error executing command: ${stderr}`);
    }
    return `success:  ${stdout}`;
  } catch (error) {
    console.error(`Failed to execute command: ${error.message}`);
  }
}


// Define the command execution declaration
const executeCommandDeclaration ={
    name: "executeCommand",
    description: "Executes a single  Terminal/shell command . A command can be to create a folder, file, write to a file, edit the file or delete a file etc. It can also be used to run a script or any other command that can be executed in the terminal. also returns the output of the command.",
    parameters: {   
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The command to execute in the terminal. e.g.,'mkdir new_folder', 'echo Hello World > hello.txt'",
        },
      },
      required: ["command"],
    },
}

const availableTools = {
  executeCommand,
};

async function runAgent(prompt) {
  History.push({ role: "user", parts:[{ text:prompt }]});
} 
// Initialize the chat session outside of the main function
while (true) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History,
    config: {
      systemInstruction: `You are a Expert Web Developer. You have to create a frontend of a web application based on the user prompt. You can use HTML, CSS, and JavaScript to create the frontend. You can also execute terminal commands to create files, folders, or run scripts as needed.
      current user operating system is ${platform}.
      Give command to user according to it's operating system.
      <--What is your Job?-->
      1. Analyse the user prompt to see what type of website they want to build.
      2. Give the command step by step to the user to create the frontend of the web application.
      3. If you need to create a file, folder, or run a script, use the 'executeCommand' tool.
      
      //Now you can start the conversation with the user.
      like,
      1. First create a folder for the project, "mkdir project".
      2. Then create a file for the HTML code,"index.html",touch project/index.html.
      3. Then create a file for the CSS code,"style.css",touch project/style.css.
      4. Then create a file for the JavaScript code,"script.js",touch project/script.js.
      5. Then write the HTML code in the index.html file.
      6. Then write the CSS code in the style.css file.
      7. Then write the JavaScript code in the script.js file.
      8. Then run the project using a local server or open the index.html file in the browser.
      
      You have to provide terminal/shell commands to the user to execute in their terminal.
      `,
    tools:[{
      functionDeclarations:[ executeCommandDeclaration], 
    }]
    }
    
  });

   // Initialize chat with an empty history
  // const chat = model.startChat({
  //   history: [],
  // });

  console.log("Hello! I am your AI Web Developer Agent. What would you like to build today?");

  const functionResponsePart = {
    name: "functionResponse",
    response:{
      result:result,
    }
  }
  // Check if the response contains any tools to execute
  if (response.functionCalls && response.functionCalls.length > 0) {
    console.log(response.functionCalls[0]);
    const {name,args}= response.functionCalls[0];
    const functionToCall = availableTools[name];
    const result = await functionToCall(args);
    const functionResponsePart = {
        name: name,
        response:{
          result: result,
        },    
    };
    //Modal
    History.push({
      role:'model',
      parts: [
        {
        functionCall : response.functionCalls[0],
      },
      ],
     })
     //send the result to history
    History.push({
      role: 'user',
      parts:[{
        functionResponse:functionResponsePart
      }]
    });
  }
  else{
    History.push({
      role: 'model',
      parts: [{
        text: response.text,
      }],
    });
      console.log(response.text);
      break; // Exit the loop if no function calls are made
  } 
}
  // Start the conversation loop
async function main() {
  console.log("I am a website developer agent. I can help you build a website based on your prompt.");
  const prompt = readlineSync.question("Enter your prompt --> ");
  await runAgent(prompt);

  main(); // Continue the conversation
}

main();
