# Diagrama de Sequência: Fluxo de Captura da Imagem da Nota Fiscal

Este diagrama ilustra o fluxo principal desde a captura/envio da imagem pelo usuário até a exibição dos itens extraídos e organizados.

```mermaid
sequenceDiagram
    participant Usuário
    participant WebApp
    participant OCR
    participant Backend
    Usuário->>WebApp: Acessa página de captura
    Usuário->>WebApp: Tira foto ou faz upload da nota
    WebApp->>OCR: Envia imagem para extração de texto (Tesseract.js)
    OCR-->>WebApp: Retorna texto extraído
    WebApp->>Backend: Envia texto extraído para processamento
    Backend-->>WebApp: Retorna itens extraídos e organizados
    WebApp-->>Usuário: Exibe itens organizados por mercado/mês/valor
```

---
*Diagrama gerado para ilustrar o fluxo de captura e extração de dados da nota fiscal.* 