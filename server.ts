import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// In-memory store for slips from LINE
interface ParsedSlip {
  id: string;
  payerName: string;
  receiverName: string;
  amount: number;
  transactionDate: string;
  summaryNote: string;
  timestamp: number;
}
const recentSlips: ParsedSlip[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with higher size limit for image uploads
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get recent slips for frontend to sync
  app.get("/api/slips/recent", (req, res) => {
    res.json({ success: true, data: recentSlips });
  });

  app.post("/api/slips/clear", (req, res) => {
    const { id } = req.body;
    const idx = recentSlips.findIndex(s => s.id === id);
    if (idx !== -1) {
      recentSlips.splice(idx, 1);
    }
    res.json({ success: true });
  });

  // Google OAuth Userinfo endpoint
  app.get("/api/auth/google/userinfo", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Missing or invalid Bearer token" });
      }

      const token = authHeader.split(" ")[1];
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return res.status(401).json({ success: false, error: "Failed to fetch userinfo from Google" });
      }

      const data = await response.json();
      return res.json({
        success: true,
        user: {
          id: data.sub,
          email: data.email,
          name: data.name,
          picture: data.picture,
          locale: data.locale,
        },
      });
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to authenticate with Google" });
    }
  });

  // LINE Notify API proxy endpoint
  app.post("/api/line/notify", async (req, res) => {
    try {
      const { token, message } = req.body;

      if (!message) {
        return res.status(400).json({ success: false, error: "ข้อความห้ามเป็นค่าว่าง" });
      }

      // If no token is configured, return simulated response
      if (!token || token.trim() === "") {
        console.log("[LINE SIMULATED NOTIFY]:", message);
        return res.json({
          success: true,
          simulated: true,
          message: "ส่งการแจ้งเตือนจำลองสำเร็จ (ยังไม่ได้ใส่ LINE Notify Token)",
        });
      }

      // Send to official LINE Notify API
      const params = new URLSearchParams();
      params.append("message", message);

      const response = await fetch("https://notify-api.line.me/api/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: params.toString(),
      });

      const data = await response.json();

      if (response.ok && data.status === 200) {
        return res.json({ success: true, simulated: false, data });
      } else {
        return res.status(400).json({
          success: false,
          simulated: false,
          error: data.message || "ไม่สามารถส่ง LINE Notify ได้ กรุณาเช็ค Token",
        });
      }
    } catch (err: any) {
      console.error("LINE Notify Error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE Notify",
      });
    }
  });

  // Gemini AI Vision Receipt Scanner
  app.post("/api/gemini/scan-receipt", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ success: false, error: "กรุณาแนบรูปภาพใบเสร็จ" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "ไม่พบ GEMINI_API_KEY ในระบบ" });
      }

      const ai = new GoogleGenAI({ apiKey });

      // Clean base64 string
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

      const prompt = `คุณคือระบบ AI ผู้ช่วยวิเคราะห์ใบเสร็จและใบแจ้งหนี้ภาษาไทย
กรุณาอ่านรูปภาพใบเสร็จนี้และสกัดข้อมูลออกมาเป็น JSON บริสุทธิ์เท่านั้น (ไม่มี markdown block \`\`\`json) ดังนี้:
{
  "title": "ชื่อร้านหรือชื่อรายการสั้นๆ เช่น ชาบูสุกี้จินดา",
  "totalAmount": 1400.00,
  "date": "YYYY-MM-DD",
  "category": "FOOD" (เลือกจาก FOOD, TRAVEL, RENT, UTILITIES, SHOPPING, ENTERTAINMENT, OTHER),
  "items": [
    {"name": "หมูสไลด์", "price": 120.00},
    {"name": "น้ำซุป", "price": 49.00}
  ]
}
ถ้าอ่านส่วนไหนไม่ได้ ให้ประมาณค่าหรือใส่ข้อความสั้นๆ`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              totalAmount: { type: "NUMBER" },
              date: { type: "STRING" },
              category: { type: "STRING", enum: ["FOOD", "TRAVEL", "RENT", "UTILITIES", "SHOPPING", "ENTERTAINMENT", "OTHER"] },
              items: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING" },
                    price: { type: "NUMBER" }
                  }
                }
              }
            }
          }
        },
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      });

      const responseText = response.text?.trim() || "";
      const cleanedJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanedJsonStr);

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error("Gemini Scan Receipt Error:", err);
      return res.status(500).json({
        success: false,
        error: "ไม่สามารถอ่านใบเสร็จได้ กรุณาลองกรอกข้อมูลด้วยตนเอง หรือตรวจสอบรูปภาพ",
      });
    }
  });

  // Gemini AI Slip Verification Scanner
  app.post("/api/gemini/scan-slip", async (req, res) => {
    try {
      const { imageBase64, mimeType, expectedAmount, debtorName } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ success: false, error: "กรุณาแนบรูปสลิปโอนเงิน" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "ไม่พบ GEMINI_API_KEY ในระบบ" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

      const prompt = `คุณคือ AI ตรวจสอบสลิปโอนเงินธนาคารไทย (K PLUS, SCB, Krungthai NEXT, Bangkok Bank, ttbbank ฯลฯ)
ข้อมูลที่ใช้เปรียบเทียบ:
- ยอดเงินที่คาดหวัง: ${expectedAmount || 'ไม่ระบุ'} บาท
- ผู้โอนที่คาดหวัง: ${debtorName || 'ไม่ระบุ'}

กรุณาตรวจสอบรูปภาพสลิปนี้ และตอบกลับเป็น JSON บริสุทธิ์เท่านั้น (ไม่มี markdown block \`\`\`json):
{
  "payerName": "ชื่อผู้โอนเงินที่อ่านได้จากสลิป",
  "receiverName": "ชื่อผู้รับเงินที่อ่านได้จากสลิป",
  "amount": 350.00,
  "transactionDate": "วัน-เวลาที่โอน เช่น 21 ก.ค. 2026 18:30 น.",
  "transactionRef": "เลขที่รายการ/Ref ID",
  "isAmountMatch": true หรือ false (เปรียบเทียบว่าตรงกับ ${expectedAmount || 0} บาทหรือไม่),
  "summaryNote": "คำอธิบายสั้นๆ ภาษาไทย เช่น สลิปถูกต้อง ยอดเงินตรง 350 บาท"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              payerName: { type: "STRING" },
              receiverName: { type: "STRING" },
              amount: { type: "NUMBER" },
              transactionDate: { type: "STRING" },
              transactionRef: { type: "STRING" },
              isAmountMatch: { type: "BOOLEAN" },
              summaryNote: { type: "STRING" }
            }
          }
        },
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      });

      const responseText = response.text?.trim() || "";
      const cleanedJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData = JSON.parse(cleanedJsonStr);

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error("Gemini Scan Slip Error:", err);
      return res.status(500).json({
        success: false,
        error: "ไม่สามารถอ่านสลิปโอนเงินได้ กรุณาตรวจสอบรูปภาพ",
      });
    }
  });


  // LINE Messaging API Webhook
  app.post("/api/line/webhook", (req, res) => {
    // 1. ตอบกลับ LINE ทันทีเพื่อป้องกัน Timeout (LINE รอรับ 200 OK ภายใน 1-2 วินาที)
    res.status(200).send("OK");

    // 2. ไปประมวลผลต่อใน Background
    (async () => {
      try {
        const events = req.body.events;
        if (!events || events.length === 0) return;

        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!lineToken) {
          console.error("No LINE_CHANNEL_ACCESS_TOKEN configured");
          return;
        }

        for (const event of events) {
        if (event.type === "message") {
          const replyToken = event.replyToken;
          
          if (event.message.type === "text") {
            const text = event.message.text;
            const apiKey = process.env.GEMINI_API_KEY;
            
            if (apiKey) {
              try {
                const ai = new GoogleGenAI({ apiKey });
                const aiResponse = await ai.models.generateContent({
                  model: "gemini-3.5-flash",
                  contents: "คุณคือ 'พี่หมีเปย์' (BearPay) บอทหมีน่ารัก ใจดี เป็นกันเอง ชอบใช้คำว่า 'ฮะ' หรือ 'ครับผม' คอยช่วยหารค่าใช้จ่ายและตรวจสอบสลิปโอนเงิน \n\nตอบคำถามหรือทักทายผู้ใช้นี้ (ตอบสั้นๆ กระชับ): " + text,
                });
                
                const replyMsg = aiResponse.text?.trim() || "พี่หมีงงฮะ 🐻";
                await fetch("https://api.line.me/v2/bot/message/reply", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${lineToken}`,
                  },
                  body: JSON.stringify({
                    replyToken: replyToken,
                    messages: [{ type: "text", text: replyMsg }]
                  })
                });
              } catch (e) {
                console.error("Text chat error", e);
                await fetch("https://api.line.me/v2/bot/message/reply", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${lineToken}` },
                  body: JSON.stringify({
                    replyToken: replyToken,
                    messages: [{ type: "text", text: "พี่หมีมีปัญหานิดหน่อยฮะ 🐻💧 (API Error)" }]
                  })
                });
              }
            } else {
              // Fallback if no API key
              if (text.includes("หมีเปย์") || text.includes("bearpay")) {
                 await fetch("https://api.line.me/v2/bot/message/reply", {
                   method: "POST",
                   headers: {
                     "Content-Type": "application/json",
                     Authorization: `Bearer ${lineToken}`,
                   },
                   body: JSON.stringify({
                     replyToken: replyToken,
                     messages: [{ type: "text", text: "สวัสดีครับ พี่หมีเปย์พร้อมช่วยหารค่าใช้จ่ายแล้วฮะ 🐻💸\nส่งสลิปโอนเงินมาให้พี่หมีเช็คได้เลยฮะ" }]
                   })
                 });
              }
            }
          } else if (event.message.type === "image") {
            // Handle image for slip verification
            const messageId = event.message.id;
            
            // Download image
            const imgRes = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
              headers: { Authorization: `Bearer ${lineToken}` }
            });
            
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64Data = buffer.toString("base64");
              
              const apiKey = process.env.GEMINI_API_KEY;
              if (apiKey) {
                try {
                  
                  const ai = new GoogleGenAI({ apiKey });
                  const prompt = `คุณคือ AI ตรวจสอบสลิปโอนเงินธนาคารไทย (K PLUS, SCB, Krungthai NEXT, Bangkok Bank, ttbbank ฯลฯ)
กรุณาตรวจสอบรูปภาพสลิปนี้ และตอบกลับเป็น JSON บริสุทธิ์เท่านั้น:
{
  "payerName": "ชื่อผู้โอนเงินที่อ่านได้จากสลิป",
  "receiverName": "ชื่อผู้รับเงินที่อ่านได้จากสลิป",
  "amount": 350.00,
  "transactionDate": "วัน-เวลาที่โอน",
  "summaryNote": "คำอธิบายสั้นๆ ภาษาไทย เช่น สลิปถูกต้อง ยอดเงิน 350 บาท"
}`;
                  const aiResponse = await ai.models.generateContent({
                    model: "gemini-3.5-flash",
                    config: {
                      responseMimeType: "application/json",
                      responseSchema: {
                        type: "OBJECT",
                        properties: {
                          payerName: { type: "STRING" },
                          receiverName: { type: "STRING" },
                          amount: { type: "NUMBER" },
                          transactionDate: { type: "STRING" },
                          summaryNote: { type: "STRING" }
                        }
                      }
                    },
                    contents: [
                      {
                        role: "user",
                        parts: [
                          { text: prompt },
                          { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                        ]
                      }
                    ]
                  });
                  
                  const responseText = aiResponse.text?.trim() || "";
                  const cleanedJsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
                  const parsedData = JSON.parse(cleanedJsonStr);
                  
                  // Add to in-memory queue
                  const slipId = Date.now().toString();
                  recentSlips.push({
                    id: slipId,
                    ...parsedData,
                    timestamp: Date.now()
                  });
                  if (recentSlips.length > 50) recentSlips.shift();

                  let replyMsg = `🐻 พี่หมีเช็คสลิปให้แล้วฮะ!\n\n👤 ผู้โอน: ${parsedData.payerName || '-'}\n💰 ยอดเงิน: ${parsedData.amount} บาท\n📅 เวลา: ${parsedData.transactionDate || '-'}\n\n✨ ${parsedData.summaryNote}\n\n📲 เข้าแอปเพื่อบันทึกบิลนี้: https://ais-dev-lnvuyy45wsukgc7ifg775o-150882525673.asia-southeast1.run.app`;
                  
                  await fetch("https://api.line.me/v2/bot/message/reply", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${lineToken}`,
                    },
                    body: JSON.stringify({
                      replyToken: replyToken,
                      messages: [{ type: "text", text: replyMsg }]
                    })
                  });
                  
                } catch (e) {
                  console.error("AI error processing slip", e);
                  await fetch("https://api.line.me/v2/bot/message/reply", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lineToken}` },
                    body: JSON.stringify({
                      replyToken: replyToken,
                      messages: [{ type: "text", text: "พี่หมีอ่านสลิปใบนี้ไม่ออกฮะ ลองส่งมาใหม่ดูนะฮะ 🐻💧" }]
                    })
                  });
                }
              } else {
                 await fetch("https://api.line.me/v2/bot/message/reply", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lineToken}` },
                    body: JSON.stringify({
                      replyToken: replyToken,
                      messages: [{ type: "text", text: "ยังไม่ได้ใส่ GEMINI_API_KEY ในระบบฮะ 🐻🔧" }]
                    })
                 });
              }
            } else {
                await fetch("https://api.line.me/v2/bot/message/reply", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${lineToken}` },
                  body: JSON.stringify({
                    replyToken: replyToken,
                    messages: [{ type: "text", text: "โหลดรูปภาพจาก LINE ไม่สำเร็จฮะ 🐻❌" }]
                  })
                });
            }
          }
        }
      }
    } catch (error) {
      console.error("Webhook background processing error:", error);
    }
  })();
});

  // Vite Development / Production Setup
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
    console.log(`[KhunThong Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
