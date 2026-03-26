import axios from "axios";
import { config } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/config/config.js";
import { brutalSystemPrompt } from "/home/runner/work/tes-sshd/tes-sshd/Projects/ai-timothy-ronald/prompts/brutalPrompt.js";

const seed = Math.floor(Math.random() * 100000);
const API_URL = "https://gen.pollinations.ai/v1/chat/completions";

export async function generateAI(userMessage) {
  try {
    const payload = {
      model: "openai",
      
      messages: [
        { role: "system", content: brutalSystemPrompt },
        { role: "user", content: userMessage }
      ]
    };

    const response = await axios.post(API_URL, payload, {
      headers: {
        Authorization: `Bearer ${config.pollinationsKey}`,
        "Content-Type": "application/json"
      }
    });

    return response.data?.choices?.[0]?.message?.content || "Error AI";
  } catch (err) {
    console.error("AI ERROR:", err.message);
    return "AI lagi error, coba lagi.";
  }
}

const randomSeed = Math.floor(Math.random() * 100000);

export async function generateWakeUp(goal) {
  try {
    const payload = {
      model: "openai",
      messages: [
        { role: "system", content: brutalSystemPrompt },
        { role: "user", content: `Bangunin tidur orang yang lagi halu dan masih miskin, sudah jam 5 pagi tapi masih belum bangun dari tempat tidurnya sementara dia masih miskin. Random Seed: ${randomSeed}` }
      ]
    };

    const response = await axios.post(API_URL, payload, {
      headers: {
        Authorization: `Bearer ${config.pollinationsKey}`,
        "Content-Type": "application/json"
      }
    });

    return response.data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    return "Bangun. Jangan males.";
  }
}
