# WorldMan

Jogo de plataforma infinito em um pequeno planeta que também é um relógio. O personagem corre sozinho ao redor do mundo enquanto os ponteiros giram a partir do centro do planeta; você pula os ponteiros, para de correr na hora certa e derruba os inimigos com balas teleguiadas. Com o passar do tempo o mundo atravessa as épocas da história, do cinema antigo até um futuro destruído. O objetivo é sobreviver o máximo de tempo possível.

Esta é uma recriação para a web (PWA) do protótipo original feito no Construct, reconstruída a partir de capturas de tela e vídeos do jogo funcionando, com a trilha original "Mundo Pequeno".

## Como jogar

| Ação | Teclado | Celular |
| --- | --- | --- |
| Pular | Seta para cima, W ou Espaço | botão **Pular** |
| Parar de correr | Seta para a esquerda ou A (segure) | botão **Parar** (segure) |
| Atirar | X ou J (um tiro por toque) | botão **Atirar** |
| Pausar | P ou Esc | botão de pausa no canto |

Também funciona com controle (gamepad): A pula, B para, X atira, Start pausa.

### No celular e no tablet

O jogo se adapta ao tamanho e à orientação da tela, no computador e no celular:

- **Na horizontal** a tela tem a mesma composição do jogo original.
- **Na vertical** o menu, as telas de texto e o painel se reorganizam em coluna, e a câmera do jogo se afasta um pouco para mostrar mais do mundo.
- **Botões virtuais** aparecem quando o aparelho tem tela de toque: **Pular** à direita e **Atirar** e **Parar** à esquerda. Tocar em qualquer ponto livre da metade direita também pula, e dá para deslizar o dedo de um botão para outro (de Atirar para Parar, por exemplo) sem levantar.
- Os botões respeitam as áreas seguras da tela (entalhe e barra de gestos do iPhone).
- Em aparelhos com tela de toque e teclado, os botões somem quando você usa o teclado e voltam no próximo toque.
- No Android, o jogo entra em tela cheia ao começar. No iPhone, para jogar em tela cheia, adicione à tela de início (Compartilhar, depois "Adicionar à Tela de Início").

### Mecânicas

- **Corrida automática**: o mundo gira sob o personagem o tempo todo.
- **Planeta-relógio**: o núcleo do planeta tem o mostrador gravado (marcas dos minutos e numerais) e três ponteiros clássicos pretos giram a partir do centro: o das horas (com ponta de espada, mais lento, vem de frente), o dos minutos (com anel) e o dos segundos (fino, o mais rápido). Os dois últimos chegam por trás. A ponta de cada ponteiro sempre fica acima do chão: se passar pelo personagem enquanto ele está no chão, o jogo acaba. Um tique-taque avisa quando um ponteiro está chegando e um alerta pisca na borda esquerda quando ele vem por trás. Nas épocas futuristas o tempo às vezes corre ao contrário e um ponteiro inverte o sentido.
- **Paradas**: você começa com 20. Cada parada segura o personagem por até 2 segundos (o tempo restante aparece no painel com milissegundos, junto de uma barra que esvazia e pisca nos últimos instantes) e a tela treme enquanto você segura. No Android o aparelho também vibra. Servem para deixar um foguete decolar ou uma bomba cair na sua frente.
- **Tiro teleguiado**: as balas perseguem o inimigo mais próximo. Cada toque dispara um tiro só: segurar o botão não faz rajada, é preciso apertar de novo. O pente tem 10 balas e, quando acaba, a arma recarrega por 3 segundos antes de voltar a atirar. O painel mostra as balas que restam (os últimos três piscam) e a barra de recarga; no celular, o número aparece no próprio botão **Atirar**, que se enche enquanto recarrega.
- **Painel da partida**: nome, paradas, tempo, balas e contagem da parada ficam num painel que muda com a época, com fonte e moldura próprias (pergaminho no sépia, ficha datilografada nos anos 1940, painel listrado nos anos 1970, vidro fosco em alta definição, neon, painel digital chanfrado e placa enferrujada no fim dos tempos). A cada troca de época o painel sai e volta com uma animação no estilo da nova época.
- **Ranking**: cada partida entra sozinha no top 10 ao terminar, e o ranking é carregado sozinho na tela de fim de jogo. Cada registro mostra posição, nome, tempo e a data e a hora (com minutos) em que foi feito. Os recordes ficam guardados neste aparelho.

### As épocas

A cada 20 segundos o tempo avança para uma nova época. A mudança é gradual: uma "fronteira do tempo" surge logo à frente, fora da tela, e o cenário depois dela já pertence à nova época. Ao atravessá-la, o céu, os efeitos de imagem e a música se transformam aos poucos. Cada época é mais rápida que a anterior e traz seus próprios inimigos e obstáculos.

| Tempo | Época | Visual | Inimigos e obstáculos |
| --- | --- | --- | --- |
| 0 s | Anos 1900 | sépia com grão, riscos e cintilação de filme antigo (sem pontos de poeira); moinhos e casinhas | balões, zepelins (sacos de areia), biplanos |
| 20 s | Anos 1940 | preto e branco; celeiros, fábricas, postes de telégrafo | caças e zepelins com bombas, barricadas de sacos de areia |
| 40 s | Anos 1970 | colorido com efeito de TV de tubo (linhas, aberração de cor, cantos arredondados) | foguetes, mísseis rasantes, discos voadores |
| 60 s | Anos 2020 | alta definição, cores vivas e brilho; prédios de vidro e turbinas eólicas | helicópteros, drones, mísseis, barreiras de rua |
| 80 s | Anos 2070 | cidade neon à noite com chuva | carros voadores, drones e mísseis neon, barreiras holográficas |
| 100 s | Era Digital | mundo de grade luminosa no estilo Tron | sentinelas, discos de luz, jatos de luz, paredes de energia |
| 120 s em diante | Fim dos Tempos | apocalipse: ruínas, árvores mortas, lixo, cinzas no ar | entulho caindo do céu, montes de lixo, barris rolando, drones sucateados |

O Fim dos Tempos é a última época e continua para sempre, ficando cada vez mais rápido.

### Música

A trilha "Mundo Pequeno" toca em loop desde o primeiro toque na tela. Ela passa pelos mesmos filtros das épocas: som de gramofone com chiado no sépia, rádio antigo nos anos 1940, alto-falante de TV nos anos 1970, som limpo em alta definição, graves reforçados no futuro e um som abafado e mais lento no apocalipse.

## Rodando localmente

Não há etapa de build nem dependências. Basta servir a pasta por HTTP (o service worker e os módulos JavaScript não funcionam abrindo o arquivo direto):

```bash
node tools/serve.mjs 8080
```

Depois abra <http://localhost:8080>. Qualquer outro servidor estático também serve, por exemplo:

```bash
python3 -m http.server 8080
```

## Publicando no GitHub Pages

A publicação é automática pelo GitHub Actions (`.github/workflows/pages.yml`):

- **Push na `main`** (inclusive ao mesclar um pull request): verifica o jogo, monta a pasta do site e publica.
- **Pull request para a `main`**: só verifica, sem publicar. Se algo estiver errado, o PR mostra a falha.
- **Manual**: aba *Actions*, fluxo **Publicar no GitHub Pages**, botão *Run workflow* (a partir da `main`).

Antes da primeira publicação, uma configuração única no repositório: em *Settings > Pages > Build and deployment*, escolha **GitHub Actions** como *Source*. Depois disso o jogo fica em <https://ruanps.com.br/world-man/> (o endereço <https://ruanps01.github.io/world-man/> redireciona para lá, porque a conta usa domínio próprio no GitHub Pages) e o endereço também aparece no resumo de cada execução do fluxo.

O que a pipeline faz:

1. `node tools/check-site.mjs` confere a sintaxe de todos os scripts, os imports entre os módulos, o manifesto do PWA e os ícones. Também garante que todo arquivo do jogo está na lista do service worker (senão não funcionaria offline) e que não há caminhos absolutos, que quebrariam no endereço do GitHub Pages por ele ficar numa subpasta.
2. `node tools/build-site.mjs _site` copia só os arquivos do jogo (sem ferramentas, testes e documentação) e acrescenta o commit à versão do service worker. Assim cada publicação chega aos jogadores sem precisar mudar `VERSION` à mão.
3. As actions oficiais do GitHub enviam a pasta e publicam.

Os dois scripts também rodam no computador, sem instalar nada.

Depois de publicado, o navegador oferece "Instalar app" (o menu também mostra um botão **Instalar app** quando disponível). Instalado, o jogo abre em tela cheia e funciona sem internet (a música também fica guardada).

Em outras hospedagens com HTTPS (Netlify, Vercel, Cloudflare Pages) basta publicar a pasta gerada por `node tools/build-site.mjs`.

## Estrutura

```
index.html              telas (menu, controles, créditos, HUD, fim de jogo, pausa)
css/style.css           visual das telas, incluindo o painel de cada época
js/main.js              inicialização, telas, laço principal, PWA
js/eras.js              as épocas: cores, efeitos, som, cenário, inimigos e dificuldade
js/game.js              regras: personagem, ponteiros do relógio, inimigos, tiros, câmera
js/enemies.js           arquétipos de inimigos (flutuante, voador, foguete, rasante, drone, obstáculo, queda)
js/world.js             planeta-relógio: cenário por época, fronteira do tempo, mostrador, céu e clima
js/draw.js              utilitários de desenho
js/sprites.js           personagem e arte base
js/art-decor.js         cenários de cada época
js/art-foes.js          inimigos, projéteis e obstáculos de cada época
js/post.js              pós-processamento WebGL: lente, desfoque, filme antigo, TV, brilho neon
js/audio.js             música original com filtros por época e efeitos sintetizados
js/input.js             teclado, toque e gamepad
js/storage.js           nome, ranking e preferências (localStorage)
sw.js                   service worker (cache offline)
manifest.webmanifest    manifesto do PWA
assets/audio            trilha "Mundo Pequeno"
assets/fonts            Cinzel, Cinzel Decorative, Crimson Text, Righteous, Audiowide, Orbitron, Black Ops One (SIL OFL) e Special Elite (Apache 2.0)
assets/icons            ícones do app
tools/                  servidor local, verificação e montagem do site, ícones e testes automatizados
.github/workflows       publicação no GitHub Pages
```

## Ferramentas de desenvolvimento

Os scripts abaixo usam o [Playwright](https://playwright.dev/) (`npm i -D playwright` e `npx playwright install chromium`) e precisam do servidor local rodando:

```bash
node tools/generate-icons.cjs
```

```bash
node tools/smoke-test.cjs
```

```bash
node tools/responsive-test.cjs
```

O primeiro gera os ícones PNG a partir de `tools/icon.html`. O segundo abre o jogo, passa por todas as telas e por todas as épocas, captura uma transição, verifica erros no console e salva capturas em `screenshots/`. O terceiro abre o jogo em vários tamanhos de tela (desktop, janela estreita, celulares em pé e deitados, tablet), confere se algo sai da área visível e testa os toques.

## O que foi deduzido dos vídeos

Algumas regras não aparecem com clareza nas gravações e foram interpretadas:

- A morte nos vídeos acontece quando um ponteiro alcança o personagem no chão; pular por cima evita.
- O "2s" vermelho aparece durante a parada; aqui ele mostra o tempo restante da parada (máximo de 2 segundos).
- O ranking usa o armazenamento local do navegador (fica em cada aparelho).
- A arte e os efeitos sonoros foram recriados por código, inspirados no visual das capturas.
