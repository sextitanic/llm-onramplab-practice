import OpenAI from "openai";
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: apiKey });
const chatHistory: any = [];

async function main(message: string) {
  const systemPrompt: any = {
    role: 'system',
    content: '你是一個資深軟體工程師，專門幫助人們瞭解開發軟體相關的知識，並且詳細的解說原理後給出範例程式。請用台灣繁體中文回答。'
  };
  const userMessage: any = { role: 'user', content: message };
  const messages: any = [systemPrompt].concat(chatHistory).concat([userMessage]);
  /**
   * 送給 OpenAI 的內容長這樣
   * [
   *   {
   *     role: 'system',
   *     content: '你是一個資深軟體工程師，專門幫助人們瞭解開發軟體相關的知識，並且詳細的解說原理後給出範例程式。請用台灣繁體中文回答。'
   *   },
   *   { role: 'user', content: '嗨，請問您提供什麼服務呢？' },
   *   {
   *     role: 'assistant',
   *     content: '嗨！我提供的服務主要是幫助您理解與軟體開發相關的知識，包括程式語言、框架、工具、最佳實踐等。我可以解釋各種技術的原理，並提供範例程式碼，幫助您更好地掌握這些概念。如果您有任何具體的問題或主題，隨時可以告訴我！'
   *   },
   *   { role: 'user', content: '開發網站的話，哪種程式語言最容易入手呢？' }
   * ]
   */
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4o-mini',
    temperature: 0.2,
  });

  /**
   * 回應的內容像這樣
   * {
   *    id: 'chatcmpl-9ni5jMgv0Iflupj7gMCKwC7wJIQK3',
   *    object: 'chat.completion',
   *    created: 1721634587,
   *    model: 'gpt-4o-mini-2024-07-18',
   *    choices: [
   *      {
   *        index: 0,
   *        message: [Object],
   *        logprobs: null,
   *        finish_reason: 'stop'
   *      }
   *    ],
   *    usage: { prompt_tokens: 88, completion_tokens: 27, total_tokens: 115 },
   *    system_fingerprint: null
   *  }
   */
  const result = {
    'usage': completion.usage || null,
    'role': completion.choices[0].message.role,
    'content': completion.choices[0].message.content,
  };

  chatHistory.push(userMessage);
  chatHistory.push({ role: result.role, content: result.content });
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
