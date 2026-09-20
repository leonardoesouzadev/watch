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
  - [Milton Sayegh Leilões](https://www.miltonsayeghleiloes.com.br/) — leiloeiro
    de joias e relógios. O site não tem busca única: cada leilão em andamento
    tem seu próprio catálogo com um filtro por palavra-chave. O servidor
    descobre o(s) leilão(ões) abertos na página de agenda e busca o termo no
    catálogo de cada um.
  - [Sotheby's](https://www.sothebys.com/en/) — os dados vêm de um índice
    Algolia embutido no HTML da página de busca (`__NEXT_DATA__`), já com
    preço, estimativa, imagem e local do leilão. A busca já filtra só leilões
    futuros (`pfilters.dateRange=upcoming`). O site responde com uma cadeia de
    redirects 307 que setam um cookie esperado no próximo passo; o servidor
    segue esses redirects manualmente carregando o cookie adiante.
- **Filtro de fontes:** cada fonte tem um interruptor na barra lateral pra
  incluir/excluir da busca.
- **Sem banco de dados:** palavras-chave e histórico de anúncios já vistos
  ficam salvos no `localStorage` do navegador.
- **Backend mínimo:** Node/Express. Cada fonte é um arquivo em
  `server/src/scrapers/`.

## Estrutura

```
client/                              React + Vite (interface)
server/
  src/index.js                       Rotas Express, agrega os scrapers
  src/scrapers/leiloesbr.js          Scraper do LeilõesBR (cheerio)
  src/scrapers/receitaFederal.js     Cliente da API do Leilão Eletrônico da Receita Federal
  src/scrapers/miltonsayegh.js       Scraper do Milton Sayegh Leilões (cheerio)
  src/scrapers/sothebys.js           Cliente do índice Algolia embutido na busca da Sotheby's
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
2. A busca roda nas fontes habilitadas e mostra os lotes encontrados: título,
   lance mínimo/preço, data/UF ou prazo de propostas, e o leiloeiro/órgão
   responsável. Cada fonte aparece com seu total (ou erro) no topo.
3. Clicar numa palavra-chave já cadastrada busca de novo na hora — não tem
   botão de atualizar separado.
4. Marque **Atualizar automaticamente** para repetir a busca de todas as
   palavras-chave a cada 10 minutos.
5. Anúncios que apareceram desde a última busca ganham uma etiqueta **Novo**.
6. Clicar num card leva para a página do lote/edital na fonte original.
7. Na seção **Fontes**, desligue o interruptor de qualquer fonte pra excluí-la
   das buscas (e do que aparece na tela) sem precisar removê-la.

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
- A busca no Milton Sayegh Leilões só encontra lotes nos leilões que estão
  com catálogo aberto no momento (o site não tem busca única em todo o
  histórico); se não houver nenhum leilão em andamento, essa fonte não
  retorna nada.
- **Superbid não foi integrado:** o site fica atrás de um desafio JS do
  Cloudflare ("Just a moment...") em todas as páginas, igual ao que já tinha
  bloqueado o OLX — não dá pra contornar com scraping simples de HTML.
- Outros leiloeiros/agregadores (Sodré Santoro etc.) podem ter proteção
  anti-bot ou estrutura diferente — cada um precisaria do próprio scraper em
  `server/src/scrapers/`.
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
