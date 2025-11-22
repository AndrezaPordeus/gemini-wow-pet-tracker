import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";
import { API_KEY } from "./config.js";

if (!API_KEY || API_KEY === "SUA_CHAVE_API_VAI_AQUI") {
    console.error("❌ API Key não configurada! Edite o arquivo config.js e insira sua chave.");
}

const genAI = new GoogleGenerativeAI(API_KEY);


const modelos = [
    'gemini-2.5-flash',     
    'gemini-flash-latest', 
    'gemini-2.5-flash-lite', 
    'gemini-2.0-flash-001',  
    'gemini-pro-latest'      
];


async function gerarConteudoComFallback(prompt) {
    let ultimoErro = null;
    
    for (const nomeModelo of modelos) {
        try {
            const model = genAI.getGenerativeModel({ model: nomeModelo });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
        
            console.log(`✅ Modelo usado: ${nomeModelo}`);
            return text;
        } catch (error) {
            ultimoErro = error;
            console.warn(`⚠️ Modelo ${nomeModelo} falhou, tentando próximo...`);
            continue;
        }
    }
    
   
    throw ultimoErro || new Error("Todos os modelos falharam");
}

async function pesquisar() {
    const section = document.getElementById("resultados-pesquisa");
    const campoPesquisa = document.getElementById("campo-pesquisa").value.toLowerCase();

    if (!API_KEY || API_KEY === "SUA_CHAVE_API_VAI_AQUI") {
        section.innerHTML = `<p class="mensagem-inicial">❌ **Erro de Configuração!**<br>Você precisa adicionar sua chave de API no arquivo <strong>config.js</strong> para que a busca funcione.</p>`;
        return;
    }

    if (!campoPesquisa) {
        section.innerHTML = `<p class="mensagem-inicial">Você precisa digitar o nome de uma criatura para consultar o grimório.</p>`;
        return;
    }

    section.innerHTML = `<p class="mensagem-inicial">🔮 Consultando o Grimório com magia arcana... Aguarde...</p>`;

    try {
        const prompt = `Aja como um banco de dados de mascotes de World of Warcraft. Quero que você encontre mascotes que correspondam ao termo: "${campoPesquisa}".
        Retorne os resultados como um array JSON. Cada objeto no array deve ter EXATAMENTE as seguintes chaves: "titulo", "tipo", "descricao", "link".
        - "titulo": O nome da mascote.
        - "tipo": O tipo da mascote (ex: Fera, Dragão, Morto-vivo).
        - "descricao": Uma breve descrição de uma linha sobre a mascote.
        - "link": O link para a página da mascote no Wowhead (ex: https://www.wowhead.com/pt/battle-pet/nome-da-mascote).
        Se não encontrar nada, retorne um array JSON vazio [].
        NÃO inclua a formatação de código (como \`\`\`json) na sua resposta.`;

        let text = await gerarConteudoComFallback(prompt);

        
        text = text.trim();
        if (text.startsWith("```json")) {
            text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (text.startsWith("```")) {
            text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }

        const dados = JSON.parse(text);

        if (dados.length === 0) {
            section.innerHTML = `<p class="mensagem-inicial">Nenhuma criatura encontrada com esse nome no grimório.</p>`;
            return;
        }

        let resultadosHtml = "";
        for (const dado of dados) {
            const idResposta = `resposta-${dado.titulo.replace(/\s+/g, '').toLowerCase()}`;
            resultadosHtml += `
                <div class="item-resultado">
                    <h2><a href="${dado.link}" target="_blank">${dado.titulo} 🔗</a></h2>
                    <span class="tipo-pet">${dado.tipo}</span>
                    <p class="descricao-meta">${dado.descricao}</p>
                    <button class="btn-ia" onclick="gerarEstrategia('${dado.titulo}', '${dado.tipo}', '${idResposta}')">
                       🔮 Revelar Estratégia de Batalha
                    </button>
                    <div id="${idResposta}" class="box-resposta-ia"></div>
                </div>
            `;
        }
        section.innerHTML = resultadosHtml;

    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
        let mensagemErro = "❌ Ocorreu um erro mágico! O portal para a API falhou.";
        
        if (error.message && error.message.includes("API_KEY")) {
            mensagemErro = "❌ Erro de autenticação! Verifique se sua API Key está correta no arquivo config.js.";
        } else if (error.message && error.message.includes("quota") || error.message && error.message.includes("quota")) {
            mensagemErro = "❌ Limite de uso da API excedido. Tente novamente mais tarde.";
        } else if (error.message && error.message.includes("model")) {
            mensagemErro = "❌ Erro ao acessar o modelo. Verifique sua conexão e tente novamente.";
        }
        
        section.innerHTML = `<p class="mensagem-inicial">${mensagemErro}<br><small>Detalhes no console (F12)</small></p>`;
    }
}

async function gerarEstrategia(nomePet, tipoPet, idElemento) {
    let divResposta = document.getElementById(idElemento);

    if (!API_KEY || API_KEY === "SUA_CHAVE_API_VAI_AQUI") {
        divResposta.style.display = "block";
        divResposta.innerHTML = "❌ Configure sua API Key no arquivo config.js para usar esta função.";
        return;
    }
    
    divResposta.style.display = "block";
    divResposta.innerHTML = "🧙‍♂️ Consultando os espíritos ancestrais... (Aguarde)";

    try {
        const prompt = `Aja como um mestre de batalhas de World of Warcraft. 
        Eu tenho o pet "${nomePet}" do tipo "${tipoPet}". 
        Responda em tópicos curtos (máximo 3 linhas cada):
        1. Contra qual tipo ele é forte?
        2. Qual a principal fraqueza dele?
        3. Uma dica tática rápida.
        Use emojis de RPG.`;

        let texto = await gerarConteudoComFallback(prompt);

        texto = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        texto = texto.replace(/\n/g, '<br>');

        divResposta.innerHTML = texto;

    } catch (error) {
        console.error("Erro ao gerar estratégia:", error);
        let mensagemErro = "❌ Tem alguma coisa errada... Verifique sua API Key ou tente novamente.";
        
        if (error.message && error.message.includes("API_KEY")) {
            mensagemErro = "❌ Erro de autenticação! Verifique se sua API Key está correta no arquivo config.js.";
        } else if (error.message && error.message.includes("quota") || error.message && error.message.includes("quota")) {
            mensagemErro = "❌ Limite de uso da API excedido. Tente novamente mais tarde.";
        } else if (error.message && error.message.includes("model")) {
            mensagemErro = "❌ Erro ao acessar o modelo. Verifique sua conexão e tente novamente.";
        }
        
        divResposta.innerHTML = mensagemErro;
    }
}

// Adiciona o evento de clique ao botão de pesquisa
document.querySelector('.busca-container button').addEventListener('click', pesquisar);

// Permite que a tecla Enter no campo de texto também inicie a pesquisa
document.getElementById('campo-pesquisa').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        pesquisar();
    }
});

// Disponibiliza a função para os botões criados dinamicamente
window.gerarEstrategia = gerarEstrategia;