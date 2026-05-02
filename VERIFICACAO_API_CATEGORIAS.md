# Verificação da Chamada à API de Categorias

Guia passo-a-passo para verificar se o frontend está chamando corretamente a API de categorias do backend.

---

## 🚀 Pré-requisitos

1. **Backend rodando:**
   ```bash
   cd gerador-ticket-openfinance
   npm run dev
   ```
   Backend deve estar em: `http://localhost:3000`

2. **Frontend rodando:**
   ```bash
   cd gerador-ticket-openfinance-frontend
   npm start
   ```
   Frontend deve estar em: `http://localhost:4200`

---

## ✅ Teste 1: Verificar Logs no Console

### Passo 1: Abrir DevTools
- Pressione: **F12** ou **Ctrl+Shift+I** (Windows/Linux) / **Cmd+Option+I** (Mac)
- Clique na aba **Console**

### Passo 2: Navegar para a Página de Categorias
- Acesse: `http://localhost:4200/areas/sua-equipe/categorias`
- Substitua `sua-equipe` por um slug válido (ex: `consentimentos-inbound`)

### Passo 3: Observar os Logs
Você deve ver os seguintes logs:

```
🔄 Carregando categorias da API...
📡 GET: /api/v1/open-finance/categories
✅ Categorias carregadas com sucesso: {data: Array(X), count: X}
```

**Se vir isso:** ✅ API está sendo chamada corretamente

---

## ✅ Teste 2: Verificar Network (Requisição HTTP)

### Passo 1: Abrir DevTools Network
- Pressione: **F12**
- Clique na aba **Network**

### Passo 2: Navegar para Categorias
- Acesse: `http://localhost:4200/areas/sua-equipe/categorias`

### Passo 3: Procurar pela Requisição
- Procure por uma requisição com nome: `categories`
- Ou procure por: `/api/v1/open-finance/categories`

**Coluna esperada:**
| Property | Value |
|----------|-------|
| Method | GET |
| Status | 200 |
| Type | xhr |
| URL | /api/v1/open-finance/categories |

### Passo 4: Verificar Response
- Clique na requisição
- Vá para a aba **Response**
- Deve mostrar JSON com categorias:

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

**Se vir isso:** ✅ Backend está respondendo corretamente

---

## ❌ Troubleshooting

### Erro 1: "Erro ao carregar categorias"

**Possível causa:** Backend não está rodando

**Solução:**
```bash
# Terminal 1
cd gerador-ticket-openfinance
npm run dev

# Verificar se está rodando
curl http://localhost:3000/health
# Deve retornar: {"status":"ok"}
```

---

### Erro 2: Status 404 na requisição

**Possível causa:** Rota não existe no backend

**Solução:**
```bash
# Verificar se módulo de categorias está integrado
grep -r "categories" gerador-ticket-openfinance/src/routes/

# Deve mostrar algo como:
# router.use('/categories', categoriesModule.routes);
```

---

### Erro 3: Status 500 no backend

**Possível causa:** Erro na query do banco de dados

**Solução:**
```bash
# Verificar logs do backend
# Procure por mensagens de erro no terminal

# Verificar se banco está ok
# Conectar ao banco e verificar:
# SELECT COUNT(*) FROM category_templates;
```

---

### Erro 4: CORS Error

**Mensagem:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Possível causa:** Frontend e backend em portas diferentes

**Solução:**
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`

Backend deve ter CORS configurado (já está configurado no projeto).

---

## 📊 Verificação Rápida

Copie e cole no **Console** do navegador:

```javascript
// Verificar URL da API
console.log('URL esperada:', 'http://localhost:3000/api/v1/open-finance/categories');

// Fazer requisição manual
fetch('/api/v1/open-finance/categories')
  .then(res => res.json())
  .then(data => console.log('✅ Sucesso:', data))
  .catch(err => console.error('❌ Erro:', err));
```

**Esperado no console:**
```
✅ Sucesso: {data: Array(...), count: X}
```

---

## 🔍 Checklist de Funcionamento

- [ ] Frontend inicia sem erro (npm start)
- [ ] Backend inicia sem erro (npm run dev)
- [ ] Posso acessar a página de categorias
- [ ] Console mostra: "🔄 Carregando categorias da API..."
- [ ] Console mostra: "📡 GET: /api/v1/open-finance/categories"
- [ ] Network mostra requisição GET com status 200
- [ ] Response contém array de categorias
- [ ] Console mostra: "✅ Categorias carregadas com sucesso"
- [ ] Página exibe cards com categorias
- [ ] Página agrupa categorias por tipo

**Se tudo acima está marcado:** ✅ API está funcionando perfeitamente!

---

## 🎯 Cenários de Teste

### Teste 1: Carregar Página (Sucesso)

1. Acesse: `http://localhost:4200/areas/consentimentos-inbound/categorias`
2. Veja: Spinner carregando
3. Depois: Cards com categorias aparecem
4. Console: "✅ Categorias carregadas com sucesso"

**Esperado:** Página exibe 1+ categorias

---

### Teste 2: Clicar em Refresh

1. Na página de categorias, clique no botão **Refresh** (ícone de recarga)
2. Console: "🔄 Carregando categorias da API..."
3. Spinner aparece
4. Cards recarregam
5. Console: "✅ Categorias carregadas com sucesso"

**Esperado:** Dados são recarregados sem erro

---

### Teste 3: Parar Backend

1. Interrompa o backend (Ctrl+C no terminal 1)
2. Na página, clique em **Refresh**
3. Veja: Mensagem de erro

**Esperado:** "Erro ao carregar categorias. Tente novamente."

---

## 📝 Logs Esperados (Completos)

```
🔄 Carregando categorias da API...
📡 GET: /api/v1/open-finance/categories
✅ Categorias carregadas com sucesso: {
  data: [
    {id: 547, category_name: "Erro na Jornada ou Dados", ...},
    {id: 564, category_name: "Conformidade", ...},
    ...
  ],
  count: 2
}
```

---

## 🚀 Próximas Etapas

1. ✅ Verificar que API está sendo chamada
2. ⏳ Verificar dados sendo exibidos corretamente
3. ⏳ Testar em diferentes navegadores
4. ⏳ Testar em mobile (DevTools F12 → Toggle Device Toolbar)

---

## 📞 Sumário de URLs

| Serviço | URL | Esperado |
|---------|-----|----------|
| Backend Health | http://localhost:3000/health | `{"status":"ok"}` |
| Backend API | http://localhost:3000/api/v1/open-finance/categories | JSON de categorias |
| Frontend | http://localhost:4200/areas/sua-equipe/categorias | Página carregada |

---

Tudo pronto para verificar! Abra o console e teste. 🎯
