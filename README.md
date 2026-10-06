# PULSO

Workspace para freelancers organizarem projetos, clientes, prazos e recebimentos. Projeto de portfólio desenvolvido com React e Vite, com interface responsiva e identidade visual própria.

## Recursos

- Indicadores de projetos e recebimentos.
- Cadastro, edição e exclusão de projetos, com confirmação.
- Cadastro e edição de clientes.
- Quadro de etapas, busca e filtros.
- Atualização do status de pagamento e exportação CSV.
- Persistência local no navegador e restauração dos exemplos.
- Diálogos com navegação por teclado e retorno do foco.

## Executar localmente

Requer Node.js 22.12 ou superior.

```sh
npm ci
npm run dev
```

## Verificar e gerar a versão de produção

```sh
npm run lint
npm run build
npm run preview
```

## Publicar no GitHub e na Vercel

1. Crie um repositório público chamado `pulso` no GitHub.
2. Use **Add file → Upload files** para enviar o conteúdo desta pasta. Envie `src`, `public`, `package.json`, `package-lock.json`, `index.html`, as configurações e este README. Não envie o ZIP, `node_modules` nem `dist`.
3. Na Vercel, importe o repositório. Selecione **Vite**, mantenha a raiz do projeto na pasta que contém `package.json`, use `npm run build` e saída `dist`.
4. Publique e coloque o endereço no campo **Website** do repositório.

## Estrutura

- `src/App.jsx`: interface e interações.
- `src/data.js`: dados demonstrativos e validação do armazenamento.
- `src/index.css`: estilos e responsividade.
- `src/main.jsx`: inicialização do React.
- `public/favicon.svg`: ícone do PULSO.

## Limites da demonstração

Os dados iniciais são fictícios. As alterações ficam no localStorage do navegador, sem sincronização entre dispositivos. Não há servidor, autenticação, cobrança real ou integração bancária. Limpar os dados do navegador remove as alterações. A interface está em português e os valores são em BRL.

## English

PULSO is a React portfolio project: a responsive freelancer workspace for projects, clients, deadlines and payment tracking. Features include CRUD operations, status boards, search, filters, CSV export and browser-local persistence. This is a frontend demo with fictional seed data; there is no backend, authentication or real payment processing.
