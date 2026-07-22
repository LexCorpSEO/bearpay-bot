const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const webhookCode = `
  // LINE Messaging API Webhook
  app.post("/api/line/webhook", async (req, res) => {
    try {
      const events = req.body.events;
      if (!events || events.length === 0) {
        return res.status(200).send("OK");
      }

      const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!lineToken) {
        console.error("No LINE_CHANNEL_ACCESS_TOKEN configured");
        return res.status(200).send("OK");
      }

      for (const event of events) {
        if (event.type === "message") {
          const replyToken = event.replyToken;
          
          if (event.message.type === "text") {
            const text = event.message.text;
            // Simple text reply for testing or AI chat
            if (text.includes("หมีเปย์") || text.includes("bearpay")) {
               await fetch("https://api.line.me/v2/bot/message/reply", {
                 method: "POST",
                 headers: {
                   "Content-Type": "application/json",
                   Authorization: \`Bearer \${lineToken}\`,
                 },
                 body: JSON.stringify({
                   replyToken: replyToken,
                   messages: [{ type: "text", text: "สวัสดีครับ พี่หมีเปย์พร้อมช่วยหารค่าใช้จ่ายแล้วฮะ 🐻💸\\nส่งสลิปโอนเงินมาให้พี่หมีเช็คได้เลยฮะ" }]
                 })
               });
            }
          } else if (event.message.type === "image") {
            // Handle image for slip verification
            const messageId = event.message.id;
            
            // Download image
            const imgRes = await fetch(\`https://api-data.line.me/v2/bot/message/\${messageId}/content\`, {
              headers: { Authorization: \`Bearer \${lineToken}\` }
            });
            
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64Data = buffer.toString("base64");
              
              const apiKey = process.env.GEMINI_API_KEY;
              if (apiKey) {
                try {
                  const { GoogleGenAI } = require("@google/genai");
                  const ai = new GoogleGenAI({ apiKey });
                  const prompt = \`คุณคือ AI ตรวจสอบสลิปโอนเงินธนาคารไทย (K PLUS, SCB, Krungthai NEXT, Bangkok Bank, ttbbank ฯลฯ)
กรุณาตรวจสอบรูปภาพสลิปนี้ และตอบกลับเป็น JSON บริสุทธิ์เท่านั้น:
{
  "payerName": "ชื่อผู้โอนเงินที่อ่านได้จากสลิป",
  "receiverName": "ชื่อผู้รับเงินที่อ่านได้จากสลิป",
  "amount": 350.00,
  "transactionDate": "วัน-เวลาที่โอน",
  "summaryNote": "คำอธิบายสั้นๆ ภาษาไทย เช่น สลิปถูกต้อง ยอดเงิน 350 บาท"
}\`;
                  const aiResponse = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
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
                  const cleanedJsonStr = responseText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
                  const parsedData = JSON.parse(cleanedJsonStr);
                  
                  let replyMsg = \`🐻 พี่หมีเช็คสลิปให้แล้วฮะ!\\n\\n👤 ผู้โอน: \${parsedData.payerName || '-'}\\n💰 ยอดเงิน: \${parsedData.amount} บาท\\n📅 เวลา: \${parsedData.transactionDate || '-'}\\n\\n✨ \${parsedData.summaryNote}\`;
                  
                  await fetch("https://api.line.me/v2/bot/message/reply", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: \`Bearer \${lineToken}\`,
                    },
                    body: JSON.stringify({
                      replyToken: replyToken,
                      messages: [{ type: "text", text: replyMsg }]
                    })
                  });
                  
                } catch (e) {
                  console.error("AI error processing slip", e);
                }
              }
            }
          }
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Error");
    }
  });

  // Vite Development / Production Setup`;

code = code.replace('  // Vite Development / Production Setup', webhookCode);
fs.writeFileSync('server.ts', code);
