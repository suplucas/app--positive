identidade visual — rascunho v3 · nome: tim

# um *diário* pra quem come com opinião.

Direção de marca pensada como cardápio: cada seção é um prato. Paleta de tempero em vez do laranja/vermelho clichê de comida — porque a marca é a crítica, não o prato. A partir daqui, a interface segue minimalista: menos moldura, mais conteúdo — feed descontraído tipo Reddit, sem a "performance" visual do Instagram.

01

## Paleta — a prateleira de condimentos

Berinjela #241A22 — base

Mostarda #F2A93B — destaque

Lambe-lambe #E63E75 — energia

Picles #7A9A3D — aprovado

02

## Tipografia — título fala, corpo escuta

Display — Bricolage Grotesque tim.

Corpo — Instrument Sans Conta pra todo mundo. A crítica é sua, o restaurante é dos outros.

03

## Nome — tim

tim

Onomatopeia do sininho de balcão — o "prato pronto, pode avaliar". Curto, minúsculo, funciona como interjeição ("Tim! Nota 9") e como som de notificação do app. Sem duplo sentido estranho.

nome escolhido

04

## Tom de voz em uso

@bea_come_tudo

Boteco da Ana · Vila Madalena

9.1

Pedi o mesmo prato 3 vezes só pra confirmar. Não foi acidente, foi sorte da cozinha.

volto sim boa pra ir sozinho

05

## Ícone — o sino, não a letra

O ícone do app não repete o wordmark "tim" — usa o sino estilizado (mostarda) com o "tim" (pink) como badge, a mesma metáfora sonora do nome. Fundo berinjela, forma simples o bastante pra funcionar em 40px na home do celular.

06

## Espaçamento — grid de 4px

4 · micro

8 · interno

16 · padrão

24 · seção

32 · bloco

07

## Estados dos componentes

| Componente | Variante | Quando usar |
| --- | --- | --- |
| Flair | boa pra ir só | Observação neutra — fundo baixo contraste, não compete com a foto |
| Flair | chorei de tão bom | Opinião forte — cor cheia, uso com moderação (no máx. 1 por post) |
| Nav item | feed | Aba ativa — cor de texto plena, peso 600 |
| Nav item | buscar | Aba inativa — opacidade 50% |

08

## Modo escuro — neutro, não a cor da marca

Redes grandes (Instagram, Facebook) não usam a cor do próprio logo como fundo do dark mode — a cor de marca é feita pra ter destaque em pouco espaço, não pra cobrir a tela inteira competindo com foto de comida. Por isso: fundo neutro quase preto, e mostarda/pink/picles continuam exatamente iguais, só que valem mais porque têm mais contraste ao redor.

| Token | Claro | Escuro |
| --- | --- | --- |
| fundo | #FBF2E4 | #121212 (neutro, não berinjela) |
| texto | #241A22 | #F2F0EF |
| mostarda / pink / picles | inalterados nos dois modos — é aqui que a marca aparece |  |

09

## Acessibilidade

| Par | Contraste | Status |
| --- | --- | --- |
| Berinjela sobre papel | \~11.8:1 | ✅ passa AA e AAA pra texto |
| Mostarda sobre berinjela | \~4.6:1 | ✅ passa AA pra texto grande/UI |
| Pink sobre papel | \~3.9:1 | ⚠️ ok pra ícone/badge, evitar texto corrido pequeno |

Toque mínimo de 44×44px em qualquer botão da navbar (o "+" já está nesse padrão). Nenhuma informação só por cor — nota numérica sempre acompanha o selo de flair, nunca só a cor indica aprovação.

10

## Do's & Don'ts

| ✅ Fazer | ❌ Evitar |
| --- | --- |
| Flair com fundo de baixo contraste por padrão | Mais de um flair "forte" (cor cheia) no mesmo post |
| Nota numérica sempre visível junto de qualquer selo | Cor de marca (berinjela) como fundo de tela cheia |
| Foto sangrando na borda, sem moldura | Cards com borda/sombra tentando parecer "produto" |

Rascunho de direção visual — cores, tipografia e nomes prontos para virar logo e telas.