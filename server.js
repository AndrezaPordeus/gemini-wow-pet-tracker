import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post("/api/busca", async (req, res) => {
  const { prompt } = req.body;
  try {
    const modelos = [
      'gemini-2.5-flash',     // Modelo mais atualizado e recomendado (confirmado funcionando)
      'gemini-flash-latest',  // Versão "latest" do Flash
      'gemini-2.5-flash-lite', // Versão lite mais leve
      'gemini-2.0-flash-001',  // Versão estável do 2.0
      'gemini-pro-latest'      // Fallback com versão "latest"
    ];
    let ultimoErro = null;
    for (const nomeModelo of modelos) {
      try {
        const model = genAI.getGenerativeModel({ model: nomeModelo });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return res.json({ text: response.text(), modelo: nomeModelo });
      } catch (error) {
        ultimoErro = error;
        continue;
      }
    }
    console.error(ultimoErro);
    res.status(500).json({ error: ultimoErro ? ultimoErro.message : "Todos os modelos falharam" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
