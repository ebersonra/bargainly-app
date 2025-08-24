# Checklist de Melhorias e Novas Funcionalidades

## Design System
- [ ] Organizar estilos em um Design System com tokens e componentes reutilizáveis.
- [ ] Adotar ferramenta de documentação de componentes (ex: Storybook).
- [ ] Avaliar uso de framework utilitário (ex: Tailwind CSS) para padronização.

## Arquitetura MVC
- [ ] Modularizar o JavaScript separando modelos, visualizações e controladores.
- [ ] Criar camada de serviços para abstrair chamadas à API e lógica de dados.
- [ ] Isolar manipulação de DOM em componentes ou views reutilizáveis.

## Segurança
- [ ] Validar e sanitizar dados de entrada no frontend e nas funções serverless.
- [ ] Implementar cabeçalhos de segurança (Content-Security-Policy, X-Frame-Options, etc.).
- [ ] Proteger endpoints com autenticação, autorização e rate limiting.
- [ ] Utilizar HTTPS e cookies HttpOnly/SameSite para sessões.

## Login com Google
- [ ] Habilitar provedor Google no Supabase e configurar redirecionamento.
- [ ] Criar tela de login com botão "Entrar com Google" usando `@supabase/supabase-js`.
- [ ] Gerenciar sessão do usuário (armazenamento seguro do token, logout).
- [ ] Restringir acesso às rotas e funções a usuários autenticados.
