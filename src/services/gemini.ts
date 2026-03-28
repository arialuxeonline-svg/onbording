import { GoogleGenAI, Type } from "@google/genai";
import { ClientData, ReportData } from "../types";

const getAI = () => {
  const apiKey = localStorage.getItem('gemini_api_key_override') || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error('No Gemini API Key found. Please add one in Settings.');
  }
  return new GoogleGenAI({ apiKey });
};

export const generateReport = async (clientData: ClientData): Promise<ReportData> => {
  const ai = getAI();
  const prompt = `You are a world-class AI Automation Strategist at GeniuzLab. 
  Generate a high-level, premium Client Intelligence Report for ${clientData.businessName} in the ${clientData.industry} industry.
  Business Context: Size: ${clientData.businessSize}, Revenue: ${clientData.monthlyRevenue}, Goal: ${clientData.primaryGoal}.
  Pain Points: ${clientData.painPoints.map((p: any) => p.name).join(", ")}.
  
  The report must be professional, data-driven, and highly actionable.
  
  Provide a JSON response with exactly these sections:
  1. executiveSummary: (2 paragraphs of strategic vision)
  2. painPointAnalysis: (array of objects with { name, severity (1-10), solution })
  3. competitorGapAnalysis: (3-4 sentences on how to leapfrog competitors)
  4. roadmap90Day: (object with { week1_4: string, month2: string, month3: string })
  5. roiProjection: (1 paragraph on estimated time/cost savings)
  6. recommendedStack: (array of 5 specific AI tools)
  7. quickWins: (array of 3 high-impact, low-effort actions)`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          painPointAnalysis: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                severity: { type: Type.NUMBER },
                solution: { type: Type.STRING }
              },
              required: ["name", "severity", "solution"]
            }
          },
          competitorGapAnalysis: { type: Type.STRING },
          roadmap90Day: {
            type: Type.OBJECT,
            properties: {
              week1_4: { type: Type.STRING },
              month2: { type: Type.STRING },
              month3: { type: Type.STRING }
            },
            required: ["week1_4", "month2", "month3"]
          },
          roiProjection: { type: Type.STRING },
          recommendedStack: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          quickWins: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["executiveSummary", "painPointAnalysis", "competitorGapAnalysis", "roadmap90Day", "roiProjection", "recommendedStack", "quickWins"]
      }
    },
  });

  return JSON.parse(response.text);
};

export const generateContent = async (industry: string, businessName: string, topic: string, platforms: string[]): Promise<string> => {
  const ai = getAI();
  const prompt = `You are a high-end AI Content Strategist for ${businessName} in the ${industry} industry.
  Generate premium, high-converting content for the following platforms: ${platforms.join(", ")}.
  Topic/Campaign: ${topic}.
  
  The content should be:
  - On-brand for a professional agency
  - Optimized for each platform's unique audience
  - Highly engaging and authoritative
  - Include relevant hashtags and CTAs
  - Use psychological triggers (scarcity, authority, social proof) where appropriate
  
  Format the output in clear Markdown with headers for each platform. If multiple platforms are selected, ensure each has a distinct section.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.text;
};

export const generateInsights = async (industry: string): Promise<string[]> => {
  const ai = getAI();
  const prompt = `Generate 3-5 high-impact, data-driven AI automation insights and trends specifically for the ${industry} industry. 
  Focus on how AI is disrupting this sector and what businesses should do to stay ahead.
  Return as a JSON array of strings.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
  });

  return JSON.parse(response.text);
};

export const chatWithAI = async (systemPrompt: string, message: string, history: { role: 'user' | 'bot', text: string }[]): Promise<string> => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: systemPrompt,
    },
    history: history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }))
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const analyzeCompetitor = async (url: string, industry: string): Promise<any> => {
  const ai = getAI();
  const prompt = `Analyze the website ${url} in the context of the ${industry} industry.
  Identify their digital presence, content strategy, and potential weaknesses that an AI automation agency could exploit.
  
  Provide a JSON response with:
  - socialPresenceScore: (number 1-10)
  - estimatedTraffic: (string, e.g. "10k-50k monthly")
  - contentStrategy: (string, 1 sentence)
  - weaknessIdentified: (string, 1 sentence)
  - competitiveAdvantage: (string, 1 sentence for a competitor to this business)`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          socialPresenceScore: { type: Type.NUMBER },
          estimatedTraffic: { type: Type.STRING },
          contentStrategy: { type: Type.STRING },
          weaknessIdentified: { type: Type.STRING },
          competitiveAdvantage: { type: Type.STRING }
        },
        required: ["socialPresenceScore", "estimatedTraffic", "contentStrategy", "weaknessIdentified", "competitiveAdvantage"]
      }
    },
  });

  return JSON.parse(response.text);
};
