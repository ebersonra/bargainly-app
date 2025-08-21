# Bargainly App - Sistema de Comparação de Preços e Gestão de Compras

## 🎯 Visão Geral
O Bargainly App é uma aplicação web completa para comparação de preços, gestão de orçamentos e controle de gastos. O projeto evoluiu de provas de conceito (PoCs) para extração de dados de notas fiscais para um sistema robusto de gerenciamento de compras e economia doméstica.

## ✨ Funcionalidades Principais

### 🏪 Gestão de Mercados
- Cadastro de mercados com busca automática por CNPJ
- Integração com APIs de dados empresariais (ReceitaWS)
- Validação automática de dados empresariais

### 📦 Gestão de Produtos
- Cadastro manual ou via código de barras (GTIN)
- Scanner de código de barras integrado (QuaggaJS)
- Busca automática de informações via API Cosmos Bluesoft
- Categorização inteligente de produtos
- Upload de imagens e thumbnails

### 🔥 Sistema de Barganha
- Comparação automática de preços entre mercados
- Identificação dos melhores preços por produto
- Interface visual moderna para comparação

### 💰 Controle Financeiro
- Definição de metas e orçamentos por categoria
- Registro de compras com categorização
- Dashboard com análise de gastos
- Acompanhamento de orçamento em tempo real

### 📊 Dashboard e Relatórios
- Visualização de gastos por categoria
- Acompanhamento de metas orçamentárias
- Histórico de compras e tendências

### 🔍 PoCs de Extração de Notas Fiscais
- Upload/captura de foto da nota fiscal
- Extração via OCR (Tesseract.js)
- Processamento inteligente com IA (Gemini)
- Organização automática de dados extraídos

## 🛠️ Tecnologias Utilizadas

### Frontend
- HTML5, CSS3, JavaScript ES6+
- Design responsivo e moderno
- QuaggaJS (scanner de códigos de barras)
- Tesseract.js (OCR)

### Backend & APIs
- Netlify Functions (Serverless)
- Supabase (Database & Auth)
- Google Gemini API (IA)
- API Cosmos Bluesoft (dados de produtos)
- ReceitaWS (dados empresariais)

### Database
- PostgreSQL (via Supabase)
- Row Level Security (RLS)
- Migrações versionadas

### Infraestrutura
- Netlify (Deploy e hosting)
- Variáveis de ambiente para configuração
- Build automatizado com substituição de placeholders

## 📁 Estrutura do Projeto

```
bargainly-app/
├── index.html              # Aplicação principal
├── login.html              # Página de autenticação
├── static/
│   ├── css/style.css       # Estilos principais
│   └── js/                 # Scripts da aplicação
├── netlify/functions/      # Funções serverless
├── db/                     # Migrações e scripts SQL
├── poc/                    # Provas de conceito originais
└── docs/                   # Documentação técnica
```

## 🚀 Como Executar

### Desenvolvimento Local
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Executar em desenvolvimento
netlify dev
```

### Deploy em Produção
```bash
# Deploy via Netlify CLI
netlify deploy --prod

# Ou conectar o repositório ao Netlify para deploy automático
```

### Configuração de Variáveis de Ambiente
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_API_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
BLUESOFT_API_KEY=your_bluesoft_api_key
```

## 🗄️ Banco de Dados

O projeto utiliza PostgreSQL via Supabase com as seguintes tabelas principais:
- `markets` - Dados dos mercados
- `products` - Produtos cadastrados
- `purchase_categories` - Categorias de produtos
- `purchase_records` - Registros de compras
- `budget_goals` - Metas orçamentárias

Para inicializar o banco:
```sql
-- Execute o script
\i db/init.sql

-- Execute as migrações em ordem
\i db/202508030103/markets_add_colum_cnpj.sql
\i db/202508030127/audit_cnpj.sql
-- ... demais migrações
```

## 🔐 Autenticação e Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) habilitado
- Políticas de acesso por usuário
- Cookies seguros para sessão
- Sanitização de dados de entrada

## 📱 Funcionalidades Mobile

- Interface totalmente responsiva
- Scanner de código de barras via câmera
- Upload de fotos para OCR
- Touch-friendly UI/UX

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes disponíveis:
# - Testes unitários de serviços
# - Testes de integração de controladores
# - Testes E2E de funções serverless
```

## 📈 Próximos Passos

- [ ] Sistema de notificações push
- [ ] Análise preditiva de gastos
- [ ] Integração com cartões de crédito
- [ ] App mobile nativo
- [ ] Sistema de cupons e ofertas
- [ ] Compartilhamento de listas de compras
- [ ] API pública para desenvolvedores

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas:
- Abra uma [issue](https://github.com/ebersonra/bargainly-app/issues)
- Consulte a [documentação](./docs/)
- Entre em contato via email

---
*Bargainly App - Economize inteligentemente! 💡💰*