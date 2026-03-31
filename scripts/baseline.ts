import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.APP_URL || 'http://localhost:3000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required.');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function runBaseline() {
  const tasksResponse = await axios.get(`${API_URL}/api/tasks`);
  const tasks = tasksResponse.data;

  console.log(`--- Running Baseline on ${tasks.length} tasks ---`);

  for (const task of tasks) {
    console.log(`\nTask: ${task.id} (${task.difficulty})`);
    console.log(`Description: ${task.description}`);

    let observation = (await axios.post(`${API_URL}/api/reset`, { taskId: task.id })).data;
    let done = false;
    let totalReward = 0;
    let steps = 0;

    while (!done && steps < 10) {
      const prompt = `
You are an AI agent acting as a customer support representative.
Your goal is to solve the following task: "${task.description}"

Current Observation:
View: ${observation.view}
Data: ${JSON.stringify(observation.data, null, 2)}
Available Actions: ${observation.available_actions.join(', ')}

Choose one action from the available actions.
Return your choice as a JSON object with a "type" field and any required parameters.
Example: {"type": "view_ticket", "ticket_id": "T-101"}
Example: {"type": "respond_to_ticket", "ticket_id": "T-101", "message": "Hello, how can I help?"}
Example: {"type": "close_ticket", "ticket_id": "T-101", "resolution": "Issue resolved"}

Action:`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Or any other model
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const action = JSON.parse(response.choices[0].message.content || '{}');
      console.log(`Step ${steps + 1}: Action -> ${JSON.stringify(action)}`);

      const stepResponse = await axios.post(`${API_URL}/api/step`, action);
      observation = stepResponse.data.observation;
      const reward = stepResponse.data.reward;
      done = reward.done;
      totalReward = reward.value;
      steps++;
    }

    console.log(`Task ${task.id} Finished. Score: ${totalReward.toFixed(2)}`);
  }
}

runBaseline().catch(console.error);
