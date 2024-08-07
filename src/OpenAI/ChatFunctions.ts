import OpenAI from "openai";
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: apiKey });
const chatHistory: any = [];

async function main(message: string) {
  const systemPrompt: any = {
    role: 'system',
    content: `你是一個業務員，專門銷售線上軟體開發課程，
你需要回答顧客軟體開發相關的問題，如果對方對課程有興趣的話，就請對方留下姓名及電話，並且確認資料是否正確，
然後跟顧客說之後會有專人透過電話聯繫，
請用台灣繁體中文回答。`,
  };
  const userMessage: any = { role: 'user', content: message };
  const messages: any = [systemPrompt].concat(chatHistory).concat([userMessage]);
  chatHistory.push(userMessage);

  let tools: any = [
    {
      type: 'function',
      function: {
        name: 'customer_personal_information_extractor',
        description: "Capture and extract personal information mentioned by customers during conversations",
        parameters: {
          type: 'object',
          properties: {
            first_name: {
              type: 'string',
              description: "The customer's first name",
            },
            last_name: {
              type: 'string',
              description: "The customer's last name",
            },
            phone: {
              type: 'string',
              description: "The phone number should be a 10-digit number, with all other symbols removed",
            },
          },
          required: ['first_name', 'last_name', 'phone'],
        },
      },
    }
  ];

  let completion: any = {};
  let tokenUsage: number = 0;
  let result: any = {
    'usage': 0,
    'role': '',
    'content': '',
  };

  do {
    const chatOptions: any = {
      messages: messages,
      model: 'gpt-4o-mini',
      temperature: 0.2,
    };

    if (tools.length > 0) {
      chatOptions.tools = tools;
      chatOptions.tool_choice = 'auto';
    }

    completion = await openai.chat.completions.create(chatOptions);
    /**
       * 如果回說名字是 Mars，電話是 0912345678 的話 tools 的 message 裡回應會是這樣
       * {
       *   id: 'chatcmpl-9qX0Ixi0lKyrO2hab0EZH5PFC7ip8',
       *   object: 'chat.completion',
       *   created: 1722306950,
       *   model: 'gpt-4o-mini-2024-07-18',
       *   choices: [
       *     {
       *       index: 0,
       *       message: {
       *         index: 0,
       *         message: { role: 'assistant', content: null, tool_calls: [
       *           {
       *             role: 'assistant',
       *             content: null,
       *             tool_calls: [
       *               {
       *                 id: 'call_Xu25rPU9OCKR6FMBPfel96ft',
       *                 type: 'function',
       *                 function: {
       *                   name: 'customer_personal_information_extractor',
       *                   arguments: '{"first_name": "Mars", "last_name": "", "phone": "0912345678"}'
       *                 }
       *               }
       *             ]
       *           }
       *         ] },
       *         logprobs: null,
       *         finish_reason: 'tool_calls'
       *       },
       *       logprobs: null,
       *       finish_reason: 'tool_calls'
       *     }
       *   ],
       *   usage: { prompt_tokens: 208, completion_tokens: 46, total_tokens: 254 },
       *   system_fingerprint: 'fp_0f03d4f0ee'
       * }
       */

    tokenUsage += completion.usage.total_tokens || 0;
    chatHistory.push(completion.choices[0].message);

    if (completion.choices[0].message.tool_calls?.length > 0) {
      for (const tool of completion.choices[0].message.tool_calls) {
        chatHistory.push({
          tool_call_id: tool.id,
          role: 'tool',
          tool_name: tool.function.name,
          content: tool.function.arguments,
        })

        switch (tool.function.name) {
          case 'customer_personal_information_extractor':
            result.lead_collected = JSON.parse(tool.function.arguments);
            break;
        }

        tools = tools.filter((schema: any) => {
          return schema.function.name !== tool.function.name;
        });
      }
      continue;
    }

    result.usage = tokenUsage;
    result.role = completion.choices[0].message.role;
    result.content = completion.choices[0].message.content;
    break;
  } while (true);

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
