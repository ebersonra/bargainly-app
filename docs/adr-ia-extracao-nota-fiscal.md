# ADR: Extração de Dados de Nota Fiscal com OCR + IA (LLM)

## Contexto
A extração de informações estruturadas de notas fiscais impressas é um desafio devido à baixa qualidade do OCR, variações de layout e erros recorrentes de reconhecimento de caracteres. Soluções baseadas apenas em regex e heurísticas manuais não são escaláveis nem suficientemente robustas para lidar com a diversidade de notas fiscais brasileiras.

## Decisão
Adotar um fluxo de extração de dados baseado em duas etapas:
1. **Envio direto da imagem da nota fiscal para um modelo de IA (LLM)**, como Gemini (Google AI), via API gratuita, para interpretar e estruturar os dados relevantes (produtos, valores, mercado, data, totais, etc) em formato JSON.
2. O modelo faz OCR, entende o contexto e retorna os dados estruturados, eliminando a necessidade de processamento local complexo.

## Justificativa
- Modelos LLM multimodais (como Gemini) são capazes de compreender contexto, corrigir erros comuns de OCR e estruturar informações mesmo com texto "sujo" ou imagens de baixa qualidade.
- A abordagem é escalável, genérica e adaptável a diferentes layouts e mercados.
- Reduz drasticamente a necessidade de manutenção de regex, listas de produtos ou heurísticas específicas.
- Permite evolução futura para outros tipos de documentos fiscais ou cupons.
- A experiência do usuário é simplificada: basta tirar uma foto e aguardar o resultado estruturado.

## Resultados da PoC
- A integração com Gemini via API, enviando a imagem diretamente, mostrou-se robusta e prática.
- O modelo retorna um JSON estruturado com os principais campos da nota, incluindo lista de produtos, totais, descontos, forma de pagamento, etc.
- A interface web permite upload/captura, visualização do JSON e exibição dos produtos em tabela responsiva e paginada.
- O fluxo elimina a necessidade de OCR local e pós-processamento manual.
- Limitações: a qualidade do resultado depende do modelo e da clareza da imagem; pode haver custos ou limites de uso na API.

## Alternativas Consideradas
- Regex e heurísticas manuais (não escalável, manutenção difícil, baixa robustez).
- Dicionários de produtos/marcas (não genérico, alto custo de atualização).
- APIs pagas de Document AI (maior custo, menor controle sobre dados).
- OCR local + pós-processamento (mais complexo, menos robusto que IA multimodal).

## Consequências
- Dependência de um serviço de IA (API gratuita, modelo local ou cloud).
- Possível latência maior no processamento, dependendo do modelo escolhido.
- Necessidade de garantir privacidade dos dados se usar APIs externas.
- Possibilidade de adaptação para outros documentos e idiomas com mínimo esforço.

## Próximos Passos
- Explorar alternativas de LLM multimodal open source/local para maior privacidade e controle.
- Implementar tratamento de erros e feedback ao usuário para casos de falha na extração.
- Adicionar recursos de exportação, busca e filtros na interface.
- Documentar exemplos de prompts e resultados para facilitar ajustes futuros.

---
*Esta ADR define a estratégia para extração de dados de notas fiscais usando IA multimodal, tornando o sistema mais robusto, escalável e adaptável. Atualizada com base nos resultados práticos da PoC Gemini.* 