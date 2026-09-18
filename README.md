# Watch Tracker (MVP)

Acompanha palavras-chave (ex: "Rolex Submariner", "Omega Speedmaster") e mostra
os lotes de leilão encontrados em fontes brasileiras, destacando anúncios
novos desde a última busca.

- **Fontes de dados:**
  - [LeilõesBR](https://www.leiloesbr.com.br) — agregador que reúne o
    catálogo de vários leiloeiros brasileiros (Talloni Leilões, Leilões
    Vitória, Imperial JM Leilões, etc). Sem API oficial: o servidor faz
    scraping direto do HTML da busca (página renderizada no servidor, sem
    JavaScript/anti-bot no meio do caminho).
  - **Receita Federal** (Sistema Leilão Eletrônico) — API JSON pública e
    oficial, sem autenticação. O servidor lista os editais ainda abertos para
    propostas, olha só os lotes que a própria Receita classifica como
    "RELÓGIO/PARTE" (evita varrer milhares de lotes de outras categorias) e
    busca a descrição detalhada só desses. Resultado fica em cache 30 min no
    servidor, já que montar o índice varre vários endpoints.
- **Fontes personalizadas, sem código:** além das duas fontes acima, dá pra
  cadastrar qualquer outro site de leilão direto pela interface (nome + URL de
  busca + seletores CSS) — sem mexer no servidor. Veja "Adicionar uma fonte
  personalizada" abaixo.
- **Filtro de fontes:** cada fonte (fixa ou personalizada) tem um interruptor
  na barra lateral pra incluir/excluir da busca.
- **Sem banco de dados:** palavras-chave, fontes personalizadas e histórico de
  anúncios já vistos ficam salvos no `localStorage` do navegador.
- **Backend mínimo:** Node/Express. Fontes fixas viram um arquivo em
  `server/src/scrapers/`; fontes personalizadas usam um scraper genérico
  (`generic.js`) que recebe os seletores a cada busca — não precisa de deploy
  nem reinício do servidor pra adicionar uma.

## Estrutura

```
client/                              React + Vite (interface)
server/
  src/index.js                       Rotas Express, agrega os scrapers
  src/scrapers/leiloesbr.js          Scraper do LeilõesBR (cheerio)
  src/scrapers/receitaFederal.js     Cliente da API do Leilão Eletrônico da Receita Federal
  src/scrapers/generic.js            Scraper genérico (seletores vêm da requisição, sem deploy)
```

## 1. Configurar o servidor

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

O servidor sobe em `http://localhost:4000`. Não precisa de nenhuma chave de
API — é só rodar.

## 2. Configurar o cliente

```bash
cd client
npm install
npm run dev
```

A interface sobe em `http://localhost:5173` e já tem um proxy configurado
(`/api` → `http://localhost:4000`), então não precisa configurar CORS nem URL
manualmente.

## 3. Rodar os dois juntos (opcional)

Na raiz do projeto:

```bash
npm install
npm run dev
```

## Como usar

1. Digite uma palavra-chave (ex: "Rolex", "Citizen", "Mondaine") e clique em
   **Adicionar**.
2. A busca roda nas duas fontes e mostra os lotes encontrados: título, lance
   mínimo/preço, data/UF ou prazo de propostas, e o leiloeiro/órgão
   responsável. Cada fonte aparece com seu total (ou erro) no topo.
3. Clicar numa palavra-chave já cadastrada busca de novo na hora — não tem
   botão de atualizar separado.
4. Marque **Atualizar automaticamente** para repetir a busca de todas as
   palavras-chave a cada 10 minutos.
5. Anúncios que apareceram desde a última busca ganham uma etiqueta **Novo**.
6. Clicar num card leva para a página do lote/edital na fonte original.
7. Na seção **Fontes**, desligue o interruptor de qualquer fonte pra excluí-la
   das buscas (e do que aparece na tela) sem precisar removê-la.

## Adicionar uma fonte personalizada (sem código)

Na seção **Fontes** da barra lateral, clique em **+ Nova fonte personalizada**
e preencha só duas coisas:

- **Nome**: como ela vai aparecer nos resultados (ex: "Sodré Santoro").
- **URL de busca**: a URL da página de resultados do site, com `{q}` no lugar
  da palavra-chave (ex: `https://site.com.br/busca?termo={q}`).

Isso já é suficiente — o servidor tenta identificar os anúncios sozinho,
procurando na página elementos com "cara de preço" (R$, $, etc.) e usando o
card ao redor de cada um como um anúncio. Funciona bem pra título, preço e
link; imagem nem sempre é capturada automaticamente, dependendo de como o
site organiza o HTML.

Se a detecção automática não funcionar bem num site específico, tem um
**Modo avançado** (link abaixo dos dois campos) com seletores CSS manuais:
seletor do item/card, e opcionalmente título, preço, imagem e link — todos
*relativos ao item*. Pra descobrir os seletores: abra a busca do site no
navegador, clique com o botão direito num anúncio → **Inspecionar**, e veja
as classes CSS usadas.

Em nenhum dos dois modos precisa escrever código ou reiniciar o servidor — a
fonte já funciona na próxima busca.

Limitações desse modo genérico (automático ou avançado):

- Só funciona em páginas renderizadas no servidor (HTML já vem pronto na
  resposta). Sites que carregam os resultados via JavaScript depois da
  página carregar (SPA) não funcionam — o servidor só vê o HTML inicial.
- Sites com proteção anti-bot (Cloudflare etc.) provavelmente bloqueiam a
  requisição do servidor.
- O preço só é reconhecido se tiver um símbolo de moeda reconhecido (R$, $,
  US$, €, £) junto do número.

## Limitações do MVP / próximos passos

- A busca no LeilõesBR é a busca nativa do site (texto livre) — ele decide o
  que "bate" com a palavra-chave, então pode trazer itens não relacionados
  (ex: colecionismo, réplicas) junto com relógios de verdade.
- A busca na Receita Federal só olha lotes já classificados como
  "RELÓGIO/PARTE" pelo próprio sistema — um relógio classificado em outra
  categoria (ex: junto com joias) não aparece. Sem fotos disponíveis nessa
  fonte (a API não expõe imagens).
- A primeira busca na Receita Federal depois do servidor subir (ou depois de
  30 min) demora um pouco mais, porque o servidor precisa montar o índice
  varrendo os editais abertos antes de filtrar pela palavra-chave.
- Outros leiloeiros/agregadores (Superbid, Sodré Santoro etc.) podem ter
  proteção anti-bot ou estrutura diferente — cada um precisaria do próprio
  scraper em `server/src/scrapers/`.
- **Mercado Livre, OLX e Craigslist não foram integrados:** a API pública de
  busca do Mercado Livre agora exige autenticação OAuth (não dá pra fazer
  scraping nem chamar a API sem registrar um app em
  developers.mercadolivre.com.br); o OLX foi tentado (scraper de
  `olx.com.br/brasil?q=...`) mas removido — fica atrás de proteção anti-bot
  (Cloudflare) que bloqueia a maioria das requisições do servidor, então
  na prática a busca falhava quase sempre; o Craigslist não tem cobertura
  real no Brasil (não existe site local de São Paulo/outras cidades), então
  não haveria resultado relevante pra esse caso de uso.
- Sem banco de dados: se limpar o localStorage do navegador, o histórico de
  "anúncios já vistos" e a lista de palavras-chave se perdem.
- Sem notificações (e-mail/Telegram) ainda — hoje é preciso abrir a página
  para ver o que é novo.
- Scraping de HTML é frágil: se o LeilõesBR mudar o layout da página de
  busca, o scraper em `leiloesbr.js` para de encontrar os itens e precisa
  ser ajustado.
