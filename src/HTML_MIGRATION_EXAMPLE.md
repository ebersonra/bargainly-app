# Exemplo de Migração HTML

## Antes - HTML Original (index.html)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barganha App - Encontre os Melhores Preços</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <!-- Conteúdo da página aqui -->
    
    <!-- Scripts - ESTRUTURA ANTIGA -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/static/js/mvc/components/Navigation.js"></script>
    <script src="/static/js/mvc/controllers/BaseController.js"></script>
    <script src="/static/js/auth.js"></script>
    <script src="/static/js/utils.js"></script>
    <script src="/static/js/bargainly-app.js"></script>
    <script src="/static/js/homeController.js"></script>
</body>
</html>
```

## Depois - HTML com Nova Estrutura MVC

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barganha App - Encontre os Melhores Preços</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <!-- Conteúdo da página aqui -->
    
    <!-- Scripts - NOVA ESTRUTURA MVC -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/static/js/supabase-client.js"></script>
    
    <!-- Uma única linha carrega toda a estrutura MVC -->
    <script src="/src/config.js"></script>
</body>
</html>
```

## Exemplo para Páginas Específicas

### markets.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mercados - Barganha App</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <!-- Formulário de mercados e lista aqui -->
    
    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/static/js/supabase-client.js"></script>
    <script src="/src/config.js"></script>
    
    <!-- O MarketController será carregado automaticamente -->
</body>
</html>
```

### products.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Produtos - Barganha App</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <!-- Formulário de produtos e lista aqui -->
    
    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/static/js/supabase-client.js"></script>
    <!-- Quagga.js para scanner de código de barras -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js"></script>
    <script src="/src/config.js"></script>
    
    <!-- O ProductController será carregado automaticamente -->
</body>
</html>
```

### dashboard.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Barganha App</title>
    <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
    <!-- Dashboard widgets aqui -->
    
    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script src="/static/js/supabase-client.js"></script>
    <!-- Chart.js para gráficos (opcional) -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="/src/config.js"></script>
    
    <!-- O DashboardController será carregado automaticamente -->
</body>
</html>
```

## Vantagens da Nova Estrutura

### ✅ Simplificação
- **Antes**: 6+ scripts individuais
- **Depois**: 1 script principal (`/src/config.js`)

### ✅ Carregamento Inteligente
- Detecta automaticamente a página atual
- Carrega apenas os controllers necessários
- Melhor performance de inicialização

### ✅ Manutenção
- Modificações na estrutura MVC não requerem mudanças nos HTMLs
- Versionamento centralizado
- Debugging mais fácil

### ✅ Compatibilidade
- 100% compatível com código existente
- Funções globais continuam funcionando
- Migração gradual possível

## Checklist de Migração

- [ ] Testar `/src/config.js` em uma página
- [ ] Verificar se todas as funções continuam funcionando
- [ ] Atualizar HTMLs página por página
- [ ] Remover scripts antigos após confirmação
- [ ] Atualizar documentação

## Comandos para Aplicar

```bash
# 1. Fazer backup dos HTMLs atuais
cp *.html backup/

# 2. Atualizar scripts nos HTMLs
# Substituir múltiplos <script> por:
# <script src="/src/config.js"></script>

# 3. Testar cada página
# Verificar console do browser para erros

# 4. Após confirmação, remover arquivos antigos
# mv static/js/old_files/ backup/
```

A nova estrutura oferece uma base sólida e organizizada para o crescimento da aplicação!
