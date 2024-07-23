import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import * as dotenv from 'dotenv';

dotenv.config();

const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.2 });
const chatHistory: any = [];

async function main(message: string) {
  const systemPrompt: any = new SystemMessage('你是一個資深軟體工程師，專門幫助人們瞭解開發軟體相關的知識，並且詳細的解說原理後給出範例程式。請用台灣繁體中文回答。');
  const userMessage: any = new HumanMessage(message);
  const messages: any = [systemPrompt].concat(chatHistory).concat([userMessage]);

  const completion = await model.invoke(messages);
  const result = {
    usage: completion.usage_metadata?.total_tokens,
    role: 'assistant',
    content: completion.content.toString(),
  };

  chatHistory.push(userMessage);
  chatHistory.push(new AIMessage(result.content));
  return result;
}

// 下面只是單純在做終端機上輸入跟輸出畫面，跟 LLM 無關
const readline = require('readline/promises');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function readAsync(): Promise<string> {
  console.log('請輸入您的訊息：');
  return new Promise((resolve) => {
    rl.on('line', (message: string) => {
      resolve(message);
    });
  });
}


const run = async () => {
  const message = await readAsync();
  const response = await main(message);

  console.log('Bot 的回應訊息：');
  console.log(response.content, "\n");

  await run();
};

rl.on('SIGINT', () => {
  console.log('嗯嗯，先去洗澡，改天聊。');
  rl.close();
  process.exit();
});

run();