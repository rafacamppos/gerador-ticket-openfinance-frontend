# Menu de Categorias - Frontend

Documentação da nova funcionalidade "Funcionalidades/Categorias" na tela principal de cada equipe.

---

## 📋 O Que Foi Criado

### 1. Serviço de Categorias
**Arquivo:** `src/app/services/categories.service.ts`

- `listCategories()` — Busca todas as categorias da API
- `getCategoryById(id)` — Busca uma categoria específica

**Tipos:**
- `Category` — Interface da categoria
- `CategoriesListResponse` — Resposta da lista
- `CategoryDetailResponse` — Resposta individual

### 2. Página de Categorias
**Arquivo:** `src/app/pages/categories-page.component.ts`

- Exibe todas as categorias agrupadas por tipo (Incidentes / Requisições)
- Carregamento com spinner
- Tratamento de erros
- Refresh manual

### 3. Template HTML
**Arquivo:** `src/app/pages/categories-page.component.html`

- Layout responsivo com cards para cada categoria
- Estrutura hierárquica dos 3 níveis de categoria
- Indicador de template_id
- Estados de loading, erro e vazio

### 4. Estilos CSS
**Arquivo:** `src/app/pages/categories-page.component.css`

- Design responsivo (mobile, tablet, desktop)
- Cards com efeito hover
- Temas de cores consistentes
- Grid layout automático

### 5. Menu Atualizado
**Arquivo:** `src/app/components/team-workspace-header.component.ts`

- Adicionado item "Funcionalidades" ao menu
- Tipo atualizado para incluir 'categories'
- Rota: `/areas/{ownerSlug}/categorias`

### 6. Rotas
**Arquivo:** `src/app/app.routes.ts`

- Nova rota: `areas/:ownerSlug/categorias`
- Protegida por guards: `authGuard` e `ownerAccessGuard`
- Componente: `CategoriesPageComponent`

---

## 🎨 Layout

### Menu da Equipe

```
┌─────────────────────────────────────────────┐
│ OpenFinance - Santander                     │
│ Nome da Equipe                              │
├─────────────────────────────────────────────┤
│ Tickets | Incidentes Aplicações | Funcionalidades ←
└─────────────────────────────────────────────┘
```

### Página de Categorias

```
┌─────────────────────────────────────────────┐
│ Funcionalidades - Categorias    [Refresh]   │
│ Consulte as categorias de templates...      │
├─────────────────────────────────────────────┤
│                                             │
│ INCIDENTES                                  │
│ ┌──────────────┬──────────────┬──────────┐ │
│ │ Erro na      │ Conformidade │ Incidentes│ │
│ │ Jornada      │              │ ...       │ │
│ └──────────────┴──────────────┴──────────┘ │
│                                             │
│ REQUISIÇÕES / NOTIFICAÇÕES                  │
│ ┌──────────────┬──────────────┬──────────┐ │
│ │ Solicitação  │ Monitoração  │ ...     │ │
│ │ de Acesso    │              │          │ │
│ └──────────────┴──────────────┴──────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 Como Usar

### Acessar a Página

1. Clique na aba **"Funcionalidades"** no menu da equipe
2. URL: `/areas/{nomeEquipe}/categorias`

### Visualizar Categorias

- **Agrupadas por tipo:** Incidentes e Requisições/Notificações
- **Ordenadas alfabeticamente:** Por categoria principal → subcategoria → detalhamento
- **Informações exibidas:**
  - Nome da categoria
  - Subcategoria
  - Detalhamento
  - ID do template
  - ID único da categoria

### Carregar Dados

- Dados carregam automaticamente ao abrir a página
- Clique em **"Refresh"** para recarregar manualmente
- Exibe spinner durante carregamento

---

## 🔌 Integração com API

### Endpoint Usado

```
GET /api/v1/open-finance/categories
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 547,
      "category_name": "Erro na Jornada ou Dados",
      "sub_category_name": "Obtendo um Consentimento",
      "third_level_category_name": "Criação de Consentimento",
      "template_id": 123328,
      "type": 1
    }
  ],
  "count": 1
}
```

### Consumo no Frontend

```typescript
// Em categories.service.ts
listCategories(): Observable<CategoriesListResponse> {
  return this.http.get<CategoriesListResponse>(
    `/api/v1/open-finance/categories`
  );
}
```

---

## 📊 Estrutura de Dados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | number | ID único da categoria |
| `category_name` | string | Nome principal (ex: "Erro na Jornada ou Dados") |
| `sub_category_name` | string | Segundo nível (ex: "Obtendo um Consentimento") |
| `third_level_category_name` | string | Terceiro nível (ex: "Criação de Consentimento") |
| `template_id` | number | ID do template Sysaid |
| `type` | number | 1 = Incidente, 10 = Requisição/Notificação |

---

## 🎯 Estados da Página

### ✅ Sucesso - Dados Carregados
- Exibe grid de categorias
- Agrupadas por tipo
- Cards são interativos (hover)

### ⏳ Carregando
- Exibe spinner
- Mensagem: "Carregando categorias..."
- Botão de refresh desabilitado

### ❌ Erro
- Exibe mensagem de erro
- Ícone de alerta
- Botão "Tentar Novamente"

### 📭 Vazio
- Exibe mensagem: "Nenhuma categoria disponível"
- Ícone de informação

---

## 📱 Responsividade

| Dispositivo | Layout |
|-------------|--------|
| Desktop (>920px) | Grid 3 colunas |
| Tablet (640-920px) | Grid 2-3 colunas |
| Mobile (<640px) | 1 coluna |

---

## 🧪 Teste

### Verificar Integração

1. **Certifique-se que o backend está rodando:**
   ```bash
   npm run dev  # No projeto backend
   ```

2. **Inicie o frontend:**
   ```bash
   npm start  # No projeto frontend
   ```

3. **Teste a página:**
   - Acesse: `http://localhost:4200/areas/sua-equipe/categorias`
   - Deve exibir a lista de categorias
   - Clique em "Refresh" para recarregar

4. **Verifique no DevTools:**
   - Network: Requisição GET para `/api/v1/open-finance/categories`
   - Status: 200 OK
   - Response: JSON com dados de categorias

---

## 🔒 Segurança

- ✅ Autenticação: `authGuard`
- ✅ Autorização: `ownerAccessGuard` (só acessa própria equipe)
- ✅ CORS: Configurado no backend
- ✅ Sem dados sensíveis expostos

---

## 🎨 Personalização

### Mudar Cores

Edite em `categories-page.component.css`:

```css
.category-card {
  border-color: var(--color-primary, #2c3e50);
}

.category-field__badge {
  background: var(--color-primary, #2c3e50);
}
```

### Mudar Layout

No `categories-page.component.html`:

```html
<!-- Atual: Grid de cards -->
<div class="categories-grid">

<!-- Alternativa: Lista -->
<div class="categories-list">
```

### Mudar Ordem

Em `categories-page.component.ts`:

```typescript
protected sortCategories(categories: Category[]): Category[] {
  // Mudar lógica de sort
}
```

---

## 📚 Estrutura de Arquivos

```
src/app/
├── pages/
│   ├── categories-page.component.ts       ✨ Componente
│   ├── categories-page.component.html     ✨ Template
│   └── categories-page.component.css      ✨ Estilos
├── services/
│   └── categories.service.ts              ✨ API
├── components/
│   └── team-workspace-header.component.ts ✏️ Menu atualizado
└── app.routes.ts                          ✏️ Rota adicionada
```

---

## 🔗 Relacionado

- **Backend:** `src/modules/categories/` — Módulo de categorias
- **API:** `GET /api/v1/open-finance/categories`
- **Documentação API:** `docs/API_CATEGORIES.md`

---

## ✨ Próximos Passos

1. Testar página com dados reais
2. Adicionar filtros por tipo (Incidentes/Requisições)
3. Adicionar busca/pesquisa de categorias
4. Integrar com criação de tickets (usar categoria selecionada)

---

## 💡 Dicas

- A página é **standalone** — usa Angular 17+ standalone components
- Os dados são **imutáveis** — usa signals do Angular
- O layout é **responsivo** — funciona em todos os tamanhos
- Os testes são **isolados** — sem dependências globais

---

Pronto para usar! 🎉
