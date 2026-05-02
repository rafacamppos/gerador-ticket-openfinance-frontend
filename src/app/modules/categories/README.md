# Categories Module - Frontend

Módulo isolado para gerenciar funcionalidades de categorias no frontend.

## 📁 Estrutura

```
src/app/modules/categories/
├── models/
│   └── category.model.ts          # Interfaces e tipos
├── services/
│   └── categories.service.ts      # Serviço de API
├── pages/
│   ├── categories-page.component.ts
│   ├── categories-page.component.html
│   └── categories-page.component.css
├── index.ts                       # Exportações do módulo
└── README.md                      # Este arquivo
```

## 🚀 Como Usar

### Importar o Módulo

```typescript
import { CategoriesPageComponent } from '@/app/modules/categories';
```

### Usar o Serviço

```typescript
import { CategoriesService } from '@/app/modules/categories';

// No seu componente
private categoriesService = inject(CategoriesService);

// Listar categorias
this.categoriesService.listCategories().subscribe(response => {
  console.log(response.data);
});

// Obter categoria por ID
this.categoriesService.getCategoryById(547).subscribe(response => {
  console.log(response.data);
});
```

### Usar os Tipos

```typescript
import { Category, CategoriesListResponse } from '@/app/modules/categories';

const category: Category = {
  id: 547,
  category_name: 'Erro na Jornada ou Dados',
  sub_category_name: 'Obtendo um Consentimento',
  third_level_category_name: 'Criação de Consentimento',
  template_id: 123328,
  type: 1
};
```

## 📊 Componentes

### CategoriesPageComponent

Página completa de categorias com:
- ✅ Listagem de categorias
- ✅ Agrupamento por tipo (Incidente/Requisição)
- ✅ Ordenação automática
- ✅ Carregamento com spinner
- ✅ Tratamento de erros
- ✅ Refresh manual
- ✅ Layout responsivo

**Uso:**

```typescript
// Em app.routes.ts
import { CategoriesPageComponent } from './modules/categories';

{
  path: 'areas/:ownerSlug/categorias',
  component: CategoriesPageComponent,
  canActivate: [authGuard, ownerAccessGuard]
}
```

## 🔌 API

### CategoriesService

#### `listCategories(): Observable<CategoriesListResponse>`

Lista todas as categorias.

```typescript
this.categoriesService.listCategories().subscribe({
  next: (response) => {
    console.log(response.data);      // Array de categorias
    console.log(response.count);     // Quantidade total
  },
  error: (error) => console.error(error)
});
```

#### `getCategoryById(categoryId: number): Observable<CategoryDetailResponse>`

Obtém uma categoria por ID.

```typescript
this.categoriesService.getCategoryById(547).subscribe({
  next: (response) => {
    console.log(response.data);  // Uma categoria
  },
  error: (error) => console.error(error)
});
```

## 📋 Tipos

### Category

```typescript
interface Category {
  id: number;                           // ID único
  category_name: string;                // Categoria principal
  sub_category_name: string;            // Subcategoria
  third_level_category_name: string;    // Detalhamento
  template_id: number;                  // ID do template Sysaid
  type: number;                         // 1=Incidente, 10=Requisição
}
```

### CategoriesListResponse

```typescript
interface CategoriesListResponse {
  data: Category[];     // Array de categorias
  count: number;        // Quantidade total
}
```

### CategoryDetailResponse

```typescript
interface CategoryDetailResponse {
  data: Category;       // Uma categoria
}
```

## 🎨 Layout

### Página Principal

- Header com título e botão refresh
- Cards agrupados por tipo (Incidente/Requisição)
- Cada card exibe:
  - Nome da categoria
  - Subcategoria
  - Detalhamento
  - Template ID
  - ID único

### Estados

- **Carregando:** Spinner + mensagem
- **Erro:** Mensagem + botão "Tentar Novamente"
- **Vazio:** Mensagem "Nenhuma categoria disponível"
- **Sucesso:** Grid de cards

## 📱 Responsividade

| Breakpoint | Layout |
|-----------|--------|
| Desktop (>920px) | 3 colunas |
| Tablet (640-920px) | 2 colunas |
| Mobile (<640px) | 1 coluna |

## 🔒 Segurança

- ✅ Requer autenticação (`authGuard`)
- ✅ Requer acesso à equipe (`ownerAccessGuard`)
- ✅ Sem dados sensíveis expostos
- ✅ CORS configurado no backend

## 🧪 Testes

### Teste a Página

1. Inicie backend: `npm run dev`
2. Inicie frontend: `npm start`
3. Acesse: `http://localhost:4200/areas/sua-equipe/categorias`
4. Verifique console e Network tab

### Teste o Serviço

```typescript
// Em um componente de teste
import { CategoriesService } from '@/app/modules/categories';

export class TestComponent {
  private categoriesService = inject(CategoriesService);

  ngOnInit() {
    this.categoriesService.listCategories().subscribe(
      (response) => console.log('✅ Categorias carregadas:', response)
    );
  }
}
```

## 🔄 Fluxo de Dados

```
Angular Component
    ↓
CategoriesService.listCategories()
    ↓
HTTP GET /api/v1/open-finance/categories
    ↓
Backend API (módulo categories)
    ↓
Database query (category_templates)
    ↓
JSON Response
    ↓
CategoriesPageComponent exibe dados
```

## 📚 Integração com Rotas

**Arquivo:** `src/app/app.routes.ts`

```typescript
import { CategoriesPageComponent } from './modules/categories';

export const routes: Routes = [
  // ... outras rotas ...
  {
    path: 'areas/:ownerSlug/categorias',
    component: CategoriesPageComponent,
    canActivate: [authGuard, ownerAccessGuard]
  }
];
```

## 🎯 Menu da Equipe

**Arquivo:** `src/app/components/team-workspace-header.component.ts`

Menu automaticamente inclui:
- Tickets
- Incidentes Aplicações
- **Funcionalidades** ← (Categorias)

## 🔗 Dependências

### Externas

- `@angular/core` — Framework
- `@angular/common` — CommonModule
- `@angular/http` — HttpClient

### Internas

- `TeamWorkspaceHeaderComponent` — Header da equipe
- `IconComponent` — Ícones
- `OWNER_TITLES` — Nomes das equipes

## ✨ Personalização

### Mudar URL da API

Em `services/categories.service.ts`:

```typescript
private readonly apiBaseUrl = '/api/v1/open-finance';
// Mudar para:
private readonly apiBaseUrl = 'https://seu-dominio.com/api/v1/open-finance';
```

### Mudar Layout

Em `pages/categories-page.component.html`:

```html
<!-- De grid para lista -->
<div class="categories-grid">
<!-- Para -->
<div class="categories-list">
```

### Mudar Cores

Em `pages/categories-page.component.css`:

```css
.category-field__badge {
  background: var(--color-primary, #2c3e50);
  /* Mudar para: */
  background: #ff5722;
}
```

## 📦 Copiar para Outro Projeto

```bash
# Copiar pasta inteira
cp -r src/app/modules/categories /outro-projeto/src/app/modules/

# Atualizar rotas no outro projeto
# ... adicionar import e rota no app.routes.ts

# Pronto!
```

## 🚨 Troubleshooting

### Erro: "Cannot find module 'categories'"

**Solução:** Verifique se pasta existe:
```bash
ls -la src/app/modules/categories/
```

### Componente não carrega

**Solução:** Verifique import em app.routes.ts:
```typescript
import { CategoriesPageComponent } from './modules/categories';
```

### API retorna erro 404

**Solução:** Verifique se backend está rodando:
```bash
npm run dev  # No projeto backend
```

## 📞 Próximos Passos

1. ✅ Módulo criado e funcionando
2. ⏳ Adicionar filtros por tipo
3. ⏳ Adicionar busca/pesquisa
4. ⏳ Integrar com criar ticket (usar categoria selecionada)
5. ⏳ Cache de categorias

## 🎓 Arquitetura

```
Frontend Module Architecture
├── Models (tipos)
├── Services (API)
├── Components (UI)
├── Pages (rotas)
└── index.ts (exportações)

Vantagens:
- Isolado do resto da aplicação
- Reutilizável
- Fácil de copiar/mover
- Sem dependências circulares
- Bem organizado
```

Pronto para usar! 🚀
