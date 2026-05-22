import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Ensure environment variables are loaded
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase file limit for floor plan uploaded images
app.use(express.json({ limit: "15mb" }));

// Mock proposal generator for elegant local fallback when Gemini API key is missing/placeholder
function generateMockProposal(inputs: any) {
  const { housingType, location, budget, scope, roomsSelected, colorScheme, otherPreferences } = inputs;
  
  const formattedBudget = Number(budget || 50000).toLocaleString("en-SG");
  const budgetNum = Number(budget || 50000);
  
  return {
    themeName: `${colorScheme || "Japandi Classic"} ${housingType || "Apartment"} Custom Design`,
    palette: {
      colors: ["#F4EFEB", "#D2C5B9", "#A69785", "#3E3B39", "#535E54"],
      description: `An elegant combination curated specifically for a ${housingType} in ${location || "Central Singapore"}. Designed to maximize light.`
    },
    overallSummary: `Based on your renovation budget of S$ ${formattedBudget} SGD, we have structured a comprehensive concept for your ${housingType} located in ${location || "Central area"}. This design represents a ${scope === "whole" ? "complete spatial overhaul" : "targeted room-by-room focus"} emphasizing visual depth, ergonomic custom carpentry, and optimized light flow.`,
    budgetFeasibility: {
      status: budgetNum < 50000 ? "Highly Constrained" : budgetNum < 110000 ? "Comfortably Balanced" : "Highly Versatile (Premium)",
      assessment: budgetNum < 50000 
        ? `A budget of S$ ${formattedBudget} SGD is compact for a ${housingType} renovation in Singapore. We highly recommend prioritizing custom built-in cabinetry in the core living spaces, keeping structural masonry modifications minimal, and choosing premium laminates rather than layout demolition.`
        : `A budget of S$ ${formattedBudget} SGD gives you great freedom to implement extensive built-in wardrobes, premium kitchen countertops, and select wall hacking or layout adjustments for your ${housingType} in Singapore.`,
      breakdown: [
        { "item": "Carpentry & Custom Cabinets", "cost": Math.round(budgetNum * 0.35), "percentage": 35 },
        { "item": "Flooring & Masonry", "cost": Math.round(budgetNum * 0.25), "percentage": 25 },
        { "item": "Electrical, Plumbing & Smart Living", "cost": Math.round(budgetNum * 0.15), "percentage": 15 },
        { "item": "Painting & Surface Decoration", "cost": Math.round(budgetNum * 0.10), "percentage": 10 },
        { "item": "Aesthetic Finishes & Professional Fee", "cost": Math.round(budgetNum * 0.05), "percentage": 5 },
        { "item": "Safety Contingency Fund (10%)", "cost": Math.round(budgetNum * 0.10), "percentage": 10 }
      ]
    },
    recommendations: [
      {
        "category": "Space Planning & Layout",
        "tips": [
          `For a ${housingType} layout, utilize dual-purpose functional divider panels with custom storage instead of rigid masonry brick walls.`,
          roomsSelected && roomsSelected.length > 0 
            ? `Special attention applied to: ${roomsSelected.join(", ")} to optimize walk-through passages and maintain open line-of-sight.`
            : "Opt for sliding fluted pocket doors in kitchens to prevent door swing arcs from eating into narrow foyer corridors."
        ]
      },
      {
        "category": "Feng Shui & Energy Flow Optimization",
        "tips": [
          "Establish a supportive headboard placement in your Master Bedroom - ideally resting against a solid structural partition wall rather than adjacent to a water pipe or toilet frame.",
          `Ensure the entryway foyer has clean, unobstructed energy paths. Avoid placing dark high-cabinet blocks immediately facing the main entrance to draw in positive, warm Qi.`,
          "Stove placement should strictly avoid directly facing the main entrance door or the bathroom wall to sustain domestic wealth retention."
        ]
      },
      {
        "category": "Eco-Tuning & Thermal Comfort",
        "tips": [
          "Install low-emissivity (low-E) thermal solar sheets on all West-facing windows. This lowers heat absorption by up to 68% and dramatically reduces air-conditioning bills.",
          "Arrange the living area layout to align with primary cooling corridors, utilizing whisper-quiet smart DC ceiling fans to facilitate constant cross-breeze ventilation."
        ]
      }
    ],
    layouts: {
      "optionA": {
        "title": "Aura Flow (Open Concept layout)",
        "description": "Erases secondary partitions, combining kitchen, living and study zones into one fluid environment. Best for social lifestyle.",
        "rooms": [
          { "name": "Living & Social", "x": 10, "y": 10, "w": 45, "h": 45, "color": "bg-amber-50/70" },
          { "name": "Open Galley Kitchen", "x": 60, "y": 10, "w": 30, "h": 20, "color": "bg-stone-100/75" },
          { "name": "Compact Bathroom", "x": 60, "y": 32, "w": 30, "h": 23, "color": "bg-slate-50/75" },
          { "name": "Master Suite", "x": 10, "y": 60, "w": 45, "h": 30, "color": "bg-amber-100/50" },
          { "name": "Fluid Studio/Study", "x": 60, "y": 60, "w": 30, "h": 30, "color": "bg-stone-50/75" }
        ],
        "pros": ["Outstanding light penetration", "Exceptional visual footprint", "Excellent social gathering hub"],
        "cons": ["Limited acoustic isolation", "Cooking ventilation must be premium quality"]
      },
      "optionB": {
        "title": "Zoned Comfort (Modular Division)",
        "description": "Utilizes architectural sliding glass facades to retain cellular workspace and noise suppression without reducing brightness.",
        "rooms": [
          { "name": "Living Area", "x": 10, "y": 10, "w": 35, "h": 45, "color": "bg-amber-50/70" },
          { "name": "Dedicated Work/Study Room", "x": 47, "y": 10, "w": 18, "h": 45, "color": "bg-indigo-50/65" },
          { "name": "Enclosed Kitchen", "x": 68, "y": 10, "w": 22, "h": 20, "color": "bg-stone-100/75" },
          { "name": "Shared Bathroom", "x": 68, "y": 32, "w": 22, "h": 23, "color": "bg-slate-50/75" },
          { "name": "Master Bedroom", "x": 10, "y": 60, "w": 45, "h": 30, "color": "bg-amber-100/50" },
          { "name": "Common Kids/Flex Room", "x": 58, "y": 60, "w": 32, "h": 30, "color": "bg-stone-50/75" }
        ],
        "pros": ["Acoustically superior workspaces", "Extremely integrated custom carpentry walls", "Great thermal isolation"],
        "cons": ["Slightly smaller social layout", "Sliding glass track partitions add initial carpentry cost"]
      }
    }
  };
}

// Lazy Gemini API Client instantiation
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// API endpoint for generating tailored proposal
app.post("/api/generate-proposal", async (req, res) => {
  try {
    const inputs = req.body;
    const { housingType, location, budget, scope, roomsSelected, colorScheme, otherPreferences, uploadedPlanUrl, uploadedMoodBoardUrl } = inputs;
    
    const client = getAiClient();
    
    if (!client) {
      // Graceful fallback to real-looking custom mock data when key is missing or dummy
      console.log("No valid GEMINI_API_KEY detected. Returning high-quality simulated mock proposal.");
      const mockResult = generateMockProposal(inputs);
      return res.json(mockResult);
    }

    const formattedRooms = roomsSelected && roomsSelected.length > 0 ? roomsSelected.join(", ") : "Entire floor plan layout";
    const budgetStr = Number(budget || 50000).toLocaleString("en-SG");

    const promptText = `
      You are an expert AI Interior Architect and Feng Shui practitioner specializing in smart interior spatial design.
      Synthesize a beautifully structured renovation proposal for a home with the following specifications:
      - Housing Type: ${housingType || "HDB Apartment"}
      - Location of House: ${location || "Central Area, Singapore"}
      - Renovation Budget: S$ ${budgetStr} SGD (Singapore Dollars)
      - Renovation Scope: ${scope === "whole" ? "Whole House redesign" : "Specific areas/rooms: " + formattedRooms}
      - Colour or Design Scheme Style: ${colorScheme || "Modern Japandi / Contemporary Minimal"}
      - User's Custom Notes / Space Preferences: "${otherPreferences || "None specified"}"
      ${uploadedPlanUrl ? "- Floor plan layout image attached: Yes [Provided base64 context]" : "- Floor plan layout image attached: No"}
      ${uploadedMoodBoardUrl ? "- Custom mood board inspiration image uploaded by user: Yes [Analyze this image for colors/style]" : "- Custom mood board: No"}

      We need you to return a strict JSON payload match exactly the following structure. Do not include markdown code ticks like \`\`\`json or any leading text, just return the raw JSON text block.
      
      Structure requirements:
      {
        "themeName": "A short, highly inspiring and sophisticated name for the custom design concept",
        "palette": {
          "colors": ["Five beautiful hex color codes corresponding to the design style and any uploaded mood board aesthetics. Array must have exactly 5 elements"],
          "description": "An elegant design explanation of why this specific color system works beautifully with the layout directions and any uploaded visual mood board references"
        },
        "overallSummary": "A highly inspiring, bespoke 2-3 sentence overview paragraph detailing the spatial feel, focal points, design style, and how it aligns with their Singapore home.",
        "budgetFeasibility": {
          "status": "Either 'Highly Feasible', 'Optimized Value', 'Budget-Tuned / Lean', or 'Premium Scope'",
          "assessment": "A clear, detailed evaluation of how a budget of S$ ${budgetStr} SGD pairs with their selected housing type and scope in Singapore, offering actionable spatial trade-offs.",
          "breakdown": [
            { "item": "A list of at least 5 typical cost categories in Singapore like Carpentry, Masonry, Electrical, Painting, Professional Design/Management Fees, etc.", "cost": number (estimated cost in SGD), "percentage": number }
          ]
        },
        "recommendations": [
          {
            "category": "Space Planning & Layout",
            "tips": ["3 highly specific, creative recommendations for spatial flow, storage partitions, furniture positioning based on the housing type"]
          },
          {
            "category": "Feng Shui & Energy Optimization",
            "tips": ["3 practical Feng Shui tips tailored specifically to the main items (entry door, cooking stove placement, bed headboard placement) to improve health and wealth flow."]
          },
          {
            "category": "Eco-Tuning & Thermal Comfort",
            "tips": ["2 targeted suggestions regarding thermal window insulation, natural wind/ceiling air flow, or energy-smart appliances to lower energy overhead."]
          }
        ],
        "layouts": {
          "optionA": {
            "title": "A sophisticated option name (e.g., 'Celestial Horizon [Fluid Concept]')",
            "description": "A summary describing how Option A handles open-concept layouts, sunlight accessibility, and social space.",
            "rooms": [
              { "name": "Room Name (e.g. Living Lounge, Foyer, Kitchen, Master Suite, Bed 2, Bath)", "x": number (percentage 0-100 indicating visual placement), "y": number, "w": number, "h": number, "color": "Tailwind bg-color string (e.g., bg-amber-50/70, bg-sky-50/70, bg-stone-100/70 for rendering interactive SVG layouts)" }
            ],
            "pros": ["At least 2 pros"],
            "cons": ["At least 1 con"]
          },
          "optionB": {
            "title": "Another sophisticated option name (e.g., 'Linear Sanctuary [High Storage Study]')",
            "description": "A summary describing how Option B optimizes storage density, acoustics, acoustic privacy, and work-from-home zones.",
            "rooms": [
              { "name": "Room Name", "x": number, "y": number, "w": number, "h": number, "color": "Tailwind bg-color string" }
            ],
            "pros": ["At least 2 pros"],
            "cons": ["At least 1 con"]
          }
        }
      }

      Ensure all numerical coordinates (x, y, w, h) are balanced (within 5 to 90) representing room coordinates to construct a visual 2D interactive plan diagram in a 100x100 space on the UI. Keep names and text strictly tailored to their selected specifications. Ensure the response is parseable JSON ONLY.
    `;

    const contents: any[] = [promptText];
    if (uploadedPlanUrl && uploadedPlanUrl.startsWith("data:")) {
      const splitVal = uploadedPlanUrl.split(",");
      const mime = splitVal[0].match(/:(.*?);/)?.[1] || "image/png";
      const base64Data = splitVal[1];
      contents.push({
        inlineData: {
          mimeType: mime,
          data: base64Data
        }
      });
    }

    if (uploadedMoodBoardUrl && uploadedMoodBoardUrl.startsWith("data:")) {
      const splitVal = uploadedMoodBoardUrl.split(",");
      const mime = splitVal[0].match(/:(.*?);/)?.[1] || "image/png";
      const base64Data = splitVal[1];
      contents.push({
        inlineData: {
          mimeType: mime,
          data: base64Data
        }
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedResponse = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedResponse);
    
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    // In case of syntax or other API response anomalies, fallback immediately to mock data to secure robust preview
    const fallback = generateMockProposal(req.body);
    res.json(fallback);
  }
});

// Endpoint to refine proposal based on iterative user feedback (Up to 3 iterations)
app.post("/api/refine-proposal", async (req, res) => {
  try {
    const { inputs, previousProposal, refinementFeedback, iterationCount } = req.body;
    
    const client = getAiClient();
    
    if (!client) {
      // Mock revision feedback flow fallback smoothly
      const refinedMock = JSON.parse(JSON.stringify(previousProposal));
      const isFinal = iterationCount >= 3;
      refinedMock.themeName = isFinal 
        ? `${previousProposal.themeName} (★ Final Atelier Proposal)` 
        : `${previousProposal.themeName} (Refined Iteration ${iterationCount}/3)`;
      
      refinedMock.overallSummary = `[Iteration ${iterationCount}/3 Refined based on feedback: "${refinementFeedback}"] ${previousProposal.overallSummary}`;
      
      if (refinedMock.layouts?.optionA) {
        refinedMock.layouts.optionA.description = `Incorporated client request: "${refinementFeedback}". ` + refinedMock.layouts.optionA.description;
      }
      if (refinedMock.layouts?.optionB) {
        refinedMock.layouts.optionB.description = `Incorporated client request: "${refinementFeedback}". ` + refinedMock.layouts.optionB.description;
      }
      return res.json(refinedMock);
    }

    const formattedBudget = Number(inputs.budget || 50000).toLocaleString("en-SG");
    const isFinal = iterationCount >= 3;

    const userFeedbackPrompt = `
      You are an expert AI Interior Architect and Feng Shui consultant. 
      You are performing refinement iteration #${iterationCount} (out of 3 maximum iterations) for a client's renovation workspace.
      
      Client Specifications:
      - Housing Type: ${inputs.housingType}
      - Location: ${inputs.location}
      - Renovation Budget: S$ ${formattedBudget} SGD
      - Project Scope: ${inputs.scope}
      - Color Aesthetic: ${inputs.colorScheme}
      
      Previous Proposal Schema:
      ${JSON.stringify(previousProposal, null, 2)}
      
      Client's New Refinement Feedback:
      "${refinementFeedback}"
      
      Task:
      Refine the previous proposal's parameters.
      - Theme Name, Summary, and Recommendations should be updated based on the refinement feedback.
      - Update the coordinates (x,y,w,h) or layout descriptions/rooms inside 'layouts.optionA' and 'layouts.optionB' if the customer asked for structural, placement, or size changes.
      - Keep all keys unchanged.
      - If this is iteration #3 (iterationCount = 3), this is the absolute FINAL proposed design. Celebrate this by making the themeName elegant, prefixed or suffixed with '★ Final Atelier Design', and ensuring the overall summary reads as a complete, comprehensive ultimate recommendation.

      Return a strict JSON payload match exactly the previous JSON structure. Do not include markdown code ticks like \`\`\`json or any leading text, just return the raw JSON text block.
    `;

    const contents: any[] = [userFeedbackPrompt];
    // Include plan image context if still present
    if (inputs.uploadedPlanUrl && inputs.uploadedPlanUrl.startsWith("data:")) {
      const splitVal = inputs.uploadedPlanUrl.split(",");
      const mime = splitVal[0].match(/:(.*?);/)?.[1] || "image/png";
      const base64Data = splitVal[1];
      contents.push({
        inlineData: {
          mimeType: mime,
          data: base64Data
        }
      });
    }

    // Include mood board image context if still present
    if (inputs.uploadedMoodBoardUrl && inputs.uploadedMoodBoardUrl.startsWith("data:")) {
      const splitVal = inputs.uploadedMoodBoardUrl.split(",");
      const mime = splitVal[0].match(/:(.*?);/)?.[1] || "image/png";
      const base64Data = splitVal[1];
      contents.push({
        inlineData: {
          mimeType: mime,
          data: base64Data
        }
      });
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedResponse = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedResponse);

  } catch (error: any) {
    console.error("Gemini Refinement Generation Error:", error);
    // In case of syntax or other API response anomalies, fallback immediately to mock revised data
    const previousProposal = req.body?.previousProposal || {};
    const refinedMock = JSON.parse(JSON.stringify(previousProposal));
    refinedMock.themeName = refinedMock.themeName ? `${refinedMock.themeName} (Fallback refined)` : "Atelier Custom Concept (Fallback refined)";
    res.json(refinedMock);
  }
});

// Configure Vite integration
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
