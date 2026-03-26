import axios from "axios";
import { config } from "../config/config.js";
import { brutalSystemPrompt } from "../prompts/brutalPrompt.js";

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

export async function generateWakeUp(goal) {
  try {
    const payload = {
      model: "openai",
      messages: [
        { role: "system", content: brutalSystemPrompt },
        { role: "user", content: `Bangunin tidur brutal. Goal: ${goal}` }
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
