# ADR: Extração de Dados de Nota Fiscal com OCR + IA (LLM)

## Contexto
A extração de informações estruturadas de notas fiscais impressas é um desafio devido à baixa qualidade do OCR, variações de layout e erros recorrentes de reconhecimento de caracteres. Soluções baseadas apenas em regex e heurísticas manuais não são escaláveis nem suficientemente robustas para lidar com a diversidade de notas fiscais brasileiras.

## Decisão
Adotar um fluxo de extração de dados baseado em duas etapas:
1. **OCR simples** (ex: Tesseract.js) para obter o texto bruto da nota fiscal.
2. **Processamento do texto por um modelo de IA (LLM)**, como Llama 2, Mistral, GPT-3.5, Gemini, etc, via API gratuita ou modelo local, para interpretar e estruturar os dados relevantes (produtos, valores, mercado, data, totais, etc) em formato JSON.

## Justificativa
- Modelos LLM são capazes de compreender contexto, corrigir erros comuns de OCR e estruturar informações mesmo com texto "sujo".
- A abordagem é escalável, genérica e adaptável a diferentes layouts e mercados.
- Reduz drasticamente a necessidade de manutenção de regex, listas de produtos ou heurísticas específicas.
- Permite evolução futura para outros tipos de documentos fiscais ou cupons.

## Alternativas Consideradas
- Regex e heurísticas manuais (não escalável, manutenção difícil, baixa robustez).
- Dicionários de produtos/marcas (não genérico, alto custo de atualização).
- APIs pagas de Document AI (maior custo, menor controle sobre dados).

## Consequências
- Dependência de um serviço de IA (API gratuita, modelo local ou cloud).
- Possível latência maior no processamento, dependendo do modelo escolhido.
- Necessidade de garantir privacidade dos dados se usar APIs externas.
- Possibilidade de adaptação para outros documentos e idiomas com mínimo esforço.

## Próximos Passos
- Definir o modelo LLM a ser utilizado (ex: OpenRouter, Hugging Face, Ollama local, Gemini, etc).
- Implementar PoC integrando OCR simples + chamada ao LLM com prompt para estruturar dados da nota.
- Avaliar qualidade dos dados extraídos e ajustar prompt conforme necessário.
- Documentar exemplos de prompts e resultados.

---
*Esta ADR define a estratégia para extração de dados de notas fiscais usando OCR + IA, tornando o sistema mais robusto, escalável e adaptável.* 