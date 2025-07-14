# RFC/ADR: Sistema de Extração e Organização de Notas Fiscais via Foto

## Contexto
A digitalização de notas fiscais de compras é uma necessidade crescente para consumidores que desejam organizar seus gastos, comparar preços e obter relatórios de consumo. Atualmente, o processo de registro manual é trabalhoso e sujeito a erros. Um sistema/app que automatize a extração de itens de notas fiscais a partir de fotos pode trazer grande valor.

## Atualização de Diretrizes
- **Tecnologias:** Priorizar o uso de soluções open source gratuitas em todas as etapas do sistema.
- **Plataforma:** Foco inicial em sistema web responsivo, com possibilidade de conversão para mobile utilizando webview (ex: PWA, wrappers como Capacitor ou Cordova).

## Sugestões de Tecnologias Open Source
- **OCR:** Tesseract.js (OCR em JavaScript, open source, roda no navegador ou backend Node.js)
- **Frontend:** React, Vue ou Svelte (todas open source)
- **Backend:** Node.js (Express, Fastify) ou Python (Flask, FastAPI)
- **Banco de Dados:** SQLite, PostgreSQL ou MongoDB (todas com opções gratuitas/open source)

## Consequências (atualizado)
- Elimina custos com APIs pagas de OCR (ex: Google Vision)
- Facilita deploy e manutenção por ser web-first
- Permite fácil adaptação para mobile via webview, sem necessidade de reescrever o app

## Próximos Passos (atualizado)
- Prototipar fluxo web responsivo para upload/captura de foto
- Integrar Tesseract.js para extração OCR no frontend ou backend
- Estruturar organização dos dados conforme proposta
- Avaliar conversão para mobile via PWA ou wrapper

---
*Atualização: Diretrizes ajustadas para uso exclusivo de soluções open source gratuitas e foco em sistema web responsivo, com possibilidade de conversão para mobile via webview.* 