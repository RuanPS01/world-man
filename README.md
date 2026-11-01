# WorldMan

Jogo de plataforma infinito em um pequeno planeta que gira. O personagem corre sozinho ao redor do mundo; você pula os ponteiros que giram a partir do centro do planeta, para de correr na hora certa e derruba os inimigos com balas teleguiadas. O objetivo é sobreviver o máximo de tempo possível.

Esta é uma recriação para a web (PWA) do protótipo original feito no Construct, reconstruída a partir de capturas de tela e vídeos do jogo funcionando.

## Como jogar

| Ação | Teclado | Celular |
| --- | --- | --- |
| Pular | Seta para cima, W ou Espaço | botão **Pular** |
| Parar de correr | Seta para a esquerda ou A (segure) | botão **Parar** (segure) |
| Atirar | X ou J (segure para rajada) | botão **Atirar** |
| Pausar | P ou Esc | botão de pausa no canto |

Também funciona com controle (gamepad): A pula, B para, X atira, Start pausa.

### Mecânicas

- **Corrida automática**: o mundo gira sob o personagem o tempo todo.
- **Ponteiros**: duas hastes (uma cinza e uma azul) giram a partir do centro do planeta em velocidades e sentidos que mudam. Se uma delas passar pelo personagem enquanto ele está no chão, o jogo acaba. Pule por cima delas. De vez em quando um ponteiro se recolhe para dentro do planeta e fica inofensivo; quando está para fora, a ponta brilha.
- **Paradas**: você começa com 20. Cada parada interrompe a corrida por até 2 segundos (o tempo restante aparece em vermelho no painel). Servem para deixar um foguete decolar, uma bomba cair na sua frente ou um ponteiro se afastar.
- **Tiro teleguiado**: as balas perseguem o inimigo mais próximo.
- **Inimigos**: balões e foguetes desde o início; a partir dos 20 segundos aparecem aviões, mísseis rasantes (um aviso vermelho pisca antes) e bombas lançadas por balões e aviões (a sombra no chão mostra onde vão cair). Encostar em qualquer um deles também termina o jogo.
- **Fases**: a cada 20 segundos o mundo muda de aparência e fica mais difícil: colorido, depois cinza (como no original), sépia e noite, em ciclo. A velocidade, a quantidade de inimigos e a rapidez dos ponteiros aumentam; aos 40 segundos surge um terceiro ponteiro. Os ponteiros, o fogo e o clarão do tiro continuam coloridos mesmo no mundo cinza.
- **Ranking**: na tela de fim de jogo, **Salvar** guarda a partida no top 10 e **Carregar** relê o ranking salvo neste navegador.

## Rodando localmente

Não há etapa de build nem dependências. Basta servir a pasta por HTTP (o service worker e os módulos JavaScript não funcionam abrindo o arquivo direto):

```bash
node tools/serve.mjs 8080
```

Depois abra <http://localhost:8080>. Qualquer outro servidor estático também serve, por exemplo:

```bash
python3 -m http.server 8080
```

## Publicando (PWA)

O jogo é um site estático, então pode ser publicado em qualquer hospedagem com HTTPS (GitHub Pages, Netlify, Vercel, Cloudflare Pages). No GitHub Pages: em *Settings > Pages*, escolha *Deploy from a branch* e selecione a branch e a pasta raiz.

Depois de publicado, o navegador oferece "Instalar app" (o menu também mostra um botão **Instalar app** quando disponível). Instalado, o jogo abre em tela cheia, na horizontal, e funciona sem internet.

Ao alterar arquivos do jogo, aumente a constante `VERSION` em `sw.js` para que os jogadores recebam a atualização.

## Estrutura

```
index.html              telas (menu, controles, créditos, HUD, fim de jogo, pausa)
css/style.css           visual das telas
js/main.js              inicialização, telas, laço principal, PWA
js/game.js              regras: personagem, ponteiros, inimigos, tiros, câmera, fases
js/enemies.js           balão, avião, foguete, míssil e bomba
js/world.js             planeta: decorações, faixas de grama, céu
js/sprites.js           toda a arte, desenhada por código
js/post.js              pós-processamento WebGL: lente "olho de peixe", vinheta, desfoque das bordas e filtros de fase
js/audio.js             efeitos e música sintetizados com Web Audio
js/input.js             teclado, toque e gamepad
js/storage.js           nome, ranking e preferências (localStorage)
sw.js                   service worker (cache offline)
manifest.webmanifest    manifesto do PWA
assets/fonts            Cinzel, Cinzel Decorative e Crimson Text (SIL OFL)
assets/icons            ícones do app
tools/                  servidor local, gerador de ícones e teste automatizado
```

## Ferramentas de desenvolvimento

Os scripts abaixo usam o [Playwright](https://playwright.dev/) (`npm i -D playwright` e `npx playwright install chromium`) e precisam do servidor local rodando:

```bash
node tools/generate-icons.cjs
```

```bash
node tools/smoke-test.cjs
```

O primeiro gera os ícones PNG a partir de `tools/icon.html`. O segundo abre o jogo, passa por todas as telas, joga alguns segundos, verifica erros no console e salva capturas em `screenshots/`.

## O que foi deduzido dos vídeos

Algumas regras não aparecem com clareza nas gravações e foram interpretadas:

- A morte nos vídeos acontece quando um ponteiro alcança o personagem no chão; pular por cima evita.
- O "2s" vermelho aparece durante a parada; aqui ele mostra o tempo restante da parada (máximo de 2 segundos).
- A fase cinza começa aos 20 segundos, como no vídeo. As fases sépia e noite, as bombas, os mísseis com aviso e o terceiro ponteiro foram acrescentados para o jogo infinito continuar ficando mais difícil.
- "Salvar" e "Carregar" usam o armazenamento local do navegador.
- A arte, a música e os efeitos sonoros foram recriados por código, inspirados no visual das capturas.
