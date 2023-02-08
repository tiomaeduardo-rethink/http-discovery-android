# HTTP Discovery

Esse app tem como objetivo **monitorar os logs do logcat que contém chamadas HTTP**.

Cada chamada HTTP será colocada dentro de uma pasta que segue o padrão: `timestamp-METHOD-endpoint`.

A chamada é separada em `request` e `response`. Cada parte tem um arquivo `http.txt` que contém o conteúdo completo (headers e body) e quando houver um body, ele será salvo separadamente no arquivo `payload.json`. O conteúdo deste arquivo será um JSON com as chaves ordenadas alfabeticamente, pois isso ajudará na hora de comparar as respostas de cada serviço. Infelizmente, o conteúdo vem em uma string de uma linha, então abra o arquivo e utilize algum formatador (como o prettier) para melhor visualização.

## Comandos

`yarn start`: começa o script
`yarn emulator`: abre o emulador. Mude o nome do emulador caso necessário (o padrão é "Pixel_4_API_30")
`yarn listen-http`: loga as chamadas HTTP no terminal, sem salvar em arquivos locais.
`yarn clear:logcat`: limpa os cache do logcat.
`yarn clear:data`: remove a pasta `data` que armazena as chamadas HTTP.
`yarn clear`: `executa os 2 comandos acima`

OBS: O parser das http requests funcionam melhor quando o cache está vazio. Então é recomendado usar o `yarn clear:logcat` antes de rodar `yarn start`.

## Como usar

- Instale as dependências: `yarn`
- Abra seu emulador
- Limpe o cache do logcat com `yarn clear:logcat`
- Abra seu app
- Execute `yarn start`
- Faça alguma requisição HTTP pelo app
- Aguarde que uma pasta seja criada dentro de "./data"
- Abra o arquivo `payload.json` de alguma requisição e use algum formatador de JSON para melhorar a visualização.

## Bugs conhecidos

### Subdiretórios

É bem provável que o endpoint tenha vários subdiretórios (ex: `/api/checkout`). A pasta criada para armazenar as requisições usa o endpoint em uma parte do nome, então o subdiretório da URL acaba virando um subdiretório no caminho de criação da pasta.

Então, para uma requisição GET para o endpoint `/api/checkout`, em vez do nome da estrutura da pasta ser a seguinte:

```
📦timestamp-GET-.com.br/api/checkout
 ┗ 📂 request
 ┃ ┗ 📜 http.txt
 ┗ 📂 response
 ┃ ┗ 📜 http.txt
```

ela acaba sendo:

```
📦timestamp-GET-.com.br
 ┗ 📂 api
 ┃ ┗ 📂 checkout
 ┃ ┃ ┣ 📂 request
 ┃ ┃ ┃ ┗ 📜 http.txt
 ┃ ┃ ┗ 📂 response
 ┃ ┃ ┃ ┣ 📜 http.txt
```
