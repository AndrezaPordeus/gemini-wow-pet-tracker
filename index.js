// A chave de API não é mais necessária aqui, pois o backend cuidará disso.

/**
 * Função para chamar nosso próprio backend, que por sua vez chama a API do Google.
 * @param {string} prompt O prompt a ser enviado para o modelo de IA.
 * @returns {Promise<string>} O texto da resposta da IA.
 */
async function gerarConteudoPeloBackend(prompt) {
    // Usa URL relativa para funcionar tanto em desenvolvimento quanto em produção
    const apiUrl = '/api/busca';
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
        throw new Error(`Erro na requisição ao backend: ${response.statusText}`);
    }
    const data = await response.json();
    return data.text;
}

async function pesquisar() {
    const section = document.getElementById("resultados-pesquisa");
    const campoPesquisa = document.getElementById("campo-pesquisa").value.toLowerCase();

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
        
        let text = await gerarConteudoPeloBackend(prompt);

        
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
            // Escapa aspas simples para evitar problemas no onclick
            const tituloEscapado = dado.titulo.replace(/'/g, "\\'");
            const tipoEscapado = dado.tipo.replace(/'/g, "\\'");
            resultadosHtml += `
                <div class="item-resultado">
                    <h2><a href="${dado.link}" target="_blank">${dado.titulo} 🔗</a></h2>
                    <span class="tipo-pet">${dado.tipo}</span>
                    <p class="descricao-meta">${dado.descricao}</p>
                    <button class="btn-ia" onclick="gerarEstrategia('${tituloEscapado}', '${tipoEscapado}', '${idResposta}')">
                       🔮 Revelar Estratégia de Batalha
                    </button>
                    <div id="${idResposta}" class="box-resposta-ia"></div>
                </div>
            `;
        }
        section.innerHTML = resultadosHtml;

    } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
        section.innerHTML = `<p class="mensagem-inicial">❌ Ocorreu um erro mágico! O servidor não respondeu.<br>Verifique se o servidor está rodando (npm start) e tente novamente.</p>`;
    }
}

async function gerarEstrategia(nomePet, tipoPet, idElemento) {
    let divResposta = document.getElementById(idElemento);

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

        let texto = await gerarConteudoPeloBackend(prompt);

        texto = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        texto = texto.replace(/\n/g, '<br>');

        divResposta.innerHTML = texto;

    } catch (error) {
        console.error("Erro ao gerar estratégia:", error);
        divResposta.innerHTML = "❌ Ocorreu um erro ao consultar os espíritos. Verifique se o servidor está online.";
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