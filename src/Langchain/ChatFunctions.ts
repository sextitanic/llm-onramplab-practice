import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages"
import * as dotenv from 'dotenv';

dotenv.config();

const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0.2 });
const chatHistory: any = [];

async function main(message: string) {
  const systemPrompt: any = new SystemMessage(`你是一個業務員，專門銷售線上軟體開發課程，
你需要回答顧客軟體開發相關的問題，如果對方對課程有興趣的話，就請對方留下姓名及電話，並且確認資料是否正確，
然後跟顧客說之後會有專人透過電話聯繫，
請用台灣繁體中文回答。`);
  const userMessage: any = new HumanMessage(message);
  const messages: any = [systemPrompt].concat(chatHistory).concat([userMessage]);

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

  chatHistory.push(userMessage);

  do {
    completion = model;
    if (tools.length > 0) {
      completion = completion.bindTools(tools);
    }

    completion = await completion.invoke(messages);
    tokenUsage += completion.usage_metadata?.total_tokens || 0;

    const answer = completion.content.toString();
    chatHistory.push(new AIMessage(answer));

    if (completion.tool_calls?.length > 0) {

      for (const tool of completion.tool_calls) {
        chatHistory.push(new ToolMessage({
          tool_call_id: tool.id,
          name: tool.name,
          content: JSON.stringify(tool.args),
        }));

        switch (tool.name) {
          case 'customer_personal_information_extractor':
            result.lead_collected = tool.args;
            break;
        }

        tools = tools.filter((schema: any) => {
          return schema.function.name !== tool.name;
        });
      }
      continue;
    }

    result.usage = tokenUsage;
    result.role = 'assistant';
    result.content = answer;

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