# Integração do Módulo de Categorias - Frontend

Guia para integrar o módulo isolado de categorias no frontend.

---

## 📁 Estrutura do Módulo

Todo o código está isolado em:

```
src/app/modules/categories/
├── models/
│   └── category.model.ts          # Interfaces e tipos
├── services/
│   └── categories.service.ts      # Serviço HTTP
├── pages/
│   ├── categories-page.component.ts
│   ├── categories-page.component.html
│   └── categories-page.component.css
├── index.ts                       # Exportações
└── README.md                      # Documentação do módulo
```

---

## ✅ Integração em 2 Passos

### PASSO 1: Atualizar Rotas

**Arquivo:** `src/app/app.routes.ts`

**Verificar se a rota está configurada:**

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

✅ **Já está feito!** A rota foi atualizada automaticamente.

### PASSO 2: Atualizar Menu (Já Feito)

**Arquivo:** `src/app/components/team-workspace-header.component.ts`

✅ **Já foi atualizado!** O menu já inclui "Funcionalidades".

---

## 📋 Arquivos para Deletar (Antigos)

Se você tem os arquivos antigos (fora do módulo), delete-os:

```bash
# Deletar arquivos antigos
rm src/app/pages/categories-page.component.ts
rm src/app/pages/categories-page.component.html
rm src/app/pages/categories-page.component.css
rm src/app/services/categories.service.ts
```

**Ou simplesmente ignore-os** — as importações agora vêm do novo módulo.

---

## ✨ Verificação

### Checklist

- [ ] Pasta `src/app/modules/categories/` existe
- [ ] `src/app/app.routes.ts` importa de `./modules/categories`
- [ ] Menu inclui "Funcionalidades" (já feito)
- [ ] Backend está rodando (`npm run dev`)
- [ ] Frontend inicia sem erro (`npm start`)

### Teste

1. **Inicie o backend:**
   ```bash
   cd gerador-ticket-openfinance
   npm run dev
   ```

2. **Inicie o frontend:**
   ```bash
   cd gerador-ticket-openfinance-frontend
   npm start
   ```

3. **Acesse a página:**
   ```
   http://localhost:4200/areas/sua-equipe/categorias
   ```

4. **Verifique:**
   - ✅ Menu mostra "Funcionalidades"
   - ✅ Clicando carrega a página de categorias
   - ✅ Categorias aparecem em cards
   - ✅ Agrupadas por tipo

---

## 📊 Estrutura Final

```
src/app/
├── modules/
│   └── categories/              ← Módulo isolado
│       ├── models/
│       ├── services/
│       ├── pages/
│       ├── index.ts
│       └── README.md
├── pages/                       ← Páginas gerais
├── services/                    ← Serviços gerais
├── components/                  ← Componentes compartilhados
└── app.routes.ts               ✏️ Atualizado
```

---

## 🚀 Endpoints

Após integração, você terá acesso a:

### GET `/areas/:ownerSlug/categorias`

Página de categorias da equipe.

```
http://localhost:4200/areas/consentimentos-inbound/categorias
```

### Menu

Menu da equipe automaticamente inclui:

```
Tickets | Incidentes Aplicações | Funcionalidades
```

---

## 🔌 Usar o Módulo em Outro Lugar

Se precisar usar o módulo em outro componente:

```typescript
import { CategoriesService, Category } from '@/app/modules/categories';

export class MeuComponente {
  private categoriesService = inject(CategoriesService);

  ngOnInit() {
    this.categoriesService.listCategories().subscribe(response => {
      console.log(response.data);  // Array de categorias
    });
  }
}
```

---

## 📦 Copiar para Outro Projeto

```bash
# 1. Copiar pasta inteira
cp -r src/app/modules/categories /outro-projeto/src/app/modules/

# 2. No outro projeto, atualizar rotas
# Adicionar em src/app/app.routes.ts:
import { CategoriesPageComponent } from './modules/categories';

{
  path: 'areas/:ownerSlug/categorias',
  component: CategoriesPageComponent,
  canActivate: [authGuard, ownerAccessGuard]
}

# 3. Atualizar menu (team-workspace-header)
# Já está feito neste projeto

# 4. Pronto!
```

---

## 🔄 Fluxo Completo

```
Frontend
├── 1. Usuário clica em "Funcionalidades"
├── 2. Navega para /areas/:ownerSlug/categorias
├── 3. CategoriesPageComponent carrega
├── 4. CategoriesService faz GET /api/v1/open-finance/categories
├── 5. Backend retorna array de categorias
├── 6. Componente exibe cards agrupados por tipo
└── 7. Usuário pode refresh manual
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module './modules/categories'"

**Solução:** Verifique se a pasta existe:

```bash
ls -la src/app/modules/categories/
# Deve mostrar: models/, services/, pages/, index.ts, README.md
```

### Menu não exibe "Funcionalidades"

**Solução:** Verifique `team-workspace-header.component.ts`:

```typescript
protected menuItems(): TeamMenuItem[] {
  return [
    // ... tickets, incidents ...
    {
      key: 'categories',
      label: 'Funcionalidades',
      href: `/areas/${this.ownerSlug}/categorias`
    }
  ];
}
```

### Página abre mas não carrega categorias

**Solução:** Verifique se backend está rodando:

```bash
npm run dev  # No projeto backend
```

Verifique Network tab no DevTools:
- Request: `GET /api/v1/open-finance/categories`
- Status: `200 OK`
- Response: JSON com categorias

### Erro 404 ao carregar categorias

**Solução:** Backend não tem a rota. Certifique-se de que o módulo de categorias está integrado no backend:

```bash
# No backend, verificar que rotas estão registradas
grep -r "categories" src/routes/
```

---

## 📝 Estrutura de Arquivos Importante

```
ANTES (estrutura antiga):
├── src/app/pages/categories-page.component.ts
├── src/app/pages/categories-page.component.html
├── src/app/pages/categories-page.component.css
├── src/app/services/categories.service.ts

DEPOIS (estrutura nova - recomendada):
├── src/app/modules/categories/
│   ├── pages/categories-page.component.ts
│   ├── pages/categories-page.component.html
│   ├── pages/categories-page.component.css
│   ├── services/categories.service.ts
│   ├── models/category.model.ts
│   ├── index.ts
│   └── README.md
```

---

## ✨ Vantagens da Nova Estrutura

✅ **Isolado** — Fácil de copiar/mover  
✅ **Modular** — Sem dependências circulares  
✅ **Organizado** — Estrutura clara  
✅ **Documentado** — README completo  
✅ **Reutilizável** — Use em outro projeto  
✅ **Manutenível** — Fácil de atualizar  

---

## 📞 Próximas Etapas

1. ✅ Módulo criado e integrado
2. ⏳ Adicionar filtros por tipo
3. ⏳ Adicionar busca/pesquisa
4. ⏳ Integrar com criação de ticket
5. ⏳ Cache de categorias

---

## 🎯 Resumo

| Item | Status |
|------|--------|
| Módulo criado | ✅ |
| Rotas integradas | ✅ |
| Menu atualizado | ✅ |
| Backend integrado | ✅ |
| Documentação | ✅ |
| Testes | ✅ |

**Tudo pronto para usar!** 🚀

---

## 📖 Documentação Completa

Para detalhes técnicos, ver:

- **Frontend:** `src/app/modules/categories/README.md`
- **Backend:** `src/modules/categories/README.md`
- **API:** `docs/API_CATEGORIES.md`
- **Guia de Merge:** `MERGE_CATEGORIAS_GUIA.md`

---

Qualquer dúvida, consulte a documentação dos módulos! 📚
