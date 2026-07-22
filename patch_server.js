const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
        },`,
  `      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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
        },`
);

code = code.replace(
  `      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
        },
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {`,
  `      const response = await ai.models.generateContent({
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
                inlineData: {`
);

fs.writeFileSync('server.ts', code);
