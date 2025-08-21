# Bargainly - Provas de Conceito para Extração de Dados de Notas Fiscais

## Visão Geral
Este projeto explora diferentes abordagens para extração e organização de dados de notas fiscais impressas, com foco em soluções escaláveis, modernas e de fácil uso. O objetivo é permitir que o usuário capture uma foto da nota, extraia os itens e visualize os dados de forma estruturada e amigável.

## Escopo e Funcionalidades
- Upload/captura de foto da nota fiscal (web responsivo)
- Extração de texto via OCR (Tesseract.js) e/ou IA (Gemini)
- Organização dos produtos extraídos em tabela moderna e responsiva
- Paginação dos produtos (10 por página)
- Extração de metadados da nota (totais, descontos, forma de pagamento, etc)
- Interface centralizada (index.html) para navegação entre as PoCs

## Principais PoCs
- **poc-upload-captura-foto.html**: Upload/captura de foto (HTML/JS puro)
- **poc-upload-captura-foto-ocr.html**: Upload/captura + OCR (Tesseract.js)
- **poc-upload-captura-foto-ocr-organiza.html**: OCR + organização de dados via heurística
- **poc-upload-captura-foto-ocr-gemini.html**: Extração inteligente com Gemini (Google AI) enviando a imagem diretamente e exibindo os produtos em tabela paginada

## Tecnologias Utilizadas
- HTML5, CSS3, JavaScript puro
- Tesseract.js (OCR open source)
- Google Gemini API (IA multimodal)
- Layout responsivo e UX moderna

## Como testar
1. Faça deploy do projeto em ambiente estático (ex: Netlify)
2. Acesse o `index.html` para navegar entre as PoCs
3. Siga as instruções de cada PoC (algumas requerem API Key do Gemini)
4. Faça upload/captura de uma nota fiscal e veja os dados extraídos e organizados

## Próximos Passos
- Explorar LLM multimodal open source/local
- Adicionar busca, filtros e exportação de dados
- Melhorar tratamento de erros e feedback ao usuário

## Executando os Testes

Este projeto inclui testes abrangentes para garantir a qualidade do código:

```bash
# Executar todos os testes
npm test

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Executar apenas testes E2E
npm run test:e2e

# Executar testes em modo watch (re-executa ao alterar arquivos)
npm run test:watch
```

### Cobertura de Testes
- **Testes Unitários**: Validação da lógica de negócio dos serviços e repositórios
- **Testes de Integração**: Validação da integração entre controllers e services
- **Testes E2E**: Validação completa das funções Netlify

### CI/CD
Os testes são executados automaticamente no GitHub Actions:
- Em todo pull request
- Em pushes para a branch `main`
- O deploy é bloqueado se algum teste falhar

---
*Projeto em evolução contínua. Veja a pasta `docs/` para ADRs e documentação técnica.*