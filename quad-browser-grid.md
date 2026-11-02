# QuadNav — Multi-Session 2x2 Grid Desktop Browser

## Overview
Aplicativo de navegador web desktop moderno (Electron + React + TypeScript + Vite) onde cada aba possui um **container de sessão isolado** (cookies, localStorage, cache e login independentes por aba — permitindo logar em contas diferentes do Facebook, Google, etc. na Aba 1 e na Aba 2) e exibe um **painel dividido em grade 2x2 (4 sub-janelas simultâneas)** com controles de navegação autônomos por quadrante.

## Project Type
**WEB / DESKTOP (Electron + React 19 + TypeScript + Tailwind CSS v4)**
- **Primary Agents:** `project-planner`, `orchestrator`, `frontend-specialist`
- **Skills:** `app-builder`, `clean-code`, `design-spec`, `frontend-architecture`, `frontend-design`, `lint-and-validate`

## Success Criteria
1. **Barra de Abas Completa com Isolamento de Sessão:**
   - Botão `"+" (Nova Aba)` cria uma nova aba com identificador de partição exclusivo (`persist:tab-<id>`).
   - Cada aba opera como um navegador próprio independente (logins, cookies e armazenamento separados entre Aba 1, Aba 2, etc., além de opção de isolar por quadrante).
   - Indicador visual do container/sessão da aba + botão de limpar sessão/cookies daquela aba.
2. **Grade 2x2 Simultânea e Fluida:**
   - 4 quadrantes independentes por aba: Superior Esquerdo (Q1), Superior Direito (Q2), Inferior Esquerdo (Q3) e Inferior Direito (Q4).
   - Divisórias redimensionáveis (splitters horizontal, vertical e central) com duplo-clique para resetar 50% × 50% e botão para maximizar/restaurar qualquer quadrante.
3. **Controles Individuais por Quadrante:**
   - Mini barra de ferramentas em cada um dos 4 painéis com botões **Voltar**, **Avançar**, **Recarregar (Refresh)**, **Página Inicial (Speed Dial)**, campo de **URL / Busca** e indicador de status/segurança.
4. **Compatibilidade com `X-Frame-Options` e Segurança:**
   - No modo Desktop (Electron `<webview>`), remoção de headers `X-Frame-Options` e `CSP frame-ancestors` por sessão + suporte nativo a qualquer site.
   - No modo Web Browser (`<iframe>`), verificação automática de bloqueio `X-Frame-Options` via middleware com aviso amigável e ações rápidas.

## Tech Stack
- **Runtime Desktop:** Electron (com `<webview>` e `session.fromPartition` para isolamento real de cookies/login por aba)
- **Frontend UI:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS v4 + CSS Custom Properties (Tema Industrial Carbon Dark, zero roxo/indigo)
- **Ícones:** `@phosphor-icons/react`

## File Structure
```text
d:\Navegador\
├── DESIGN.md
├── quad-browser-grid.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── electron/
│   ├── main.cjs
│   └── preload.cjs
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── browser.types.ts
    ├── hooks/
    │   └── useBrowserState.ts
    ├── utils/
    │   └── url.utils.ts
    └── components/
        ├── TabBar.tsx
        ├── QuadGrid.tsx
        ├── QuadrantPane.tsx
        ├── PaneToolbar.tsx
        └── SpeedDial.tsx
```

## Task Breakdown

| ID | Task | Agent | Skills | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
|----|------|-------|--------|----------|--------------|-------------------------|
| T1 | Criar especificação de design (`DESIGN.md`) | `frontend-specialist` | `design-spec`, `frontend-design` | P0 | None | Brief → `DESIGN.md` na raiz → Validar tokens YAML e ausência de cores proibidas |
| T2 | Configurar projeto Vite + React + TS + Electron | `frontend-specialist` | `app-builder`, `clean-code` | P0 | T1 | `package.json`, `vite.config.ts`, `tsconfig.json` → Dependências instaladas → `npx tsc --noEmit` |
| T3 | Implementar processo principal Electron com isolamento de sessão por aba (`persist:tab-*`) e bypass de `X-Frame-Options` | `frontend-specialist` | `clean-code` | P0 | T2 | `electron/main.cjs`, `electron/preload.cjs` → Partições independentes por aba e IPC de limpeza de sessão → Verificar criação de janela e sessões |
| T4 | Modelar tipos e hook de estado (`useBrowserState`) para abas, sessões isoladas e 4 quadrantes por aba | `frontend-specialist` | `frontend-architecture`, `clean-code` | P1 | T2 | `src/types/browser.types.ts`, `src/hooks/useBrowserState.ts`, `src/utils/url.utils.ts` → Persistência de abas e histórico por quadrante → `npx tsc --noEmit` |
| T5 | Construir `TabBar` com criação de abas (`+`), badge de Sessão Isolada (`Container #N`), renomeação e limpeza de cookies da aba | `frontend-specialist` | `frontend-design`, `clean-code` | P1 | T4 | `src/components/TabBar.tsx` → Barra de abas funcional no topo → Testar abertura/fechamento e troca de aba |
| T6 | Construir `QuadGrid`, `QuadrantPane`, `PaneToolbar` e `SpeedDial` (grade 2x2 redimensionável, URL bar, Voltar/Avançar/Refresh e aviso `X-Frame-Options`) | `frontend-specialist` | `frontend-design`, `clean-code` | P1 | T4, T5 | `src/components/QuadGrid.tsx`, `QuadrantPane.tsx`, `PaneToolbar.tsx`, `SpeedDial.tsx` → Grade 2x2 interativa → Verificar renderização simultânea dos 4 painéis |
| T7 | Verificação Final (Build, Typecheck, Security Scan, UX Audit) | `orchestrator` | `lint-and-validate`, `verify-changes` | P2 | T1-T6 | Projeto completo → Executar scripts de validação e build → Zero erros |

## Phase X: Final Verification Checklist
- [x] `DESIGN.md` e `quad-browser-grid.md` criados na raiz
- [x] Sem cores roxas/violetas/indigo (`Purple Ban` respeitado)
- [x] `npx tsc --noEmit` e `npm run build` sem erros
- [x] Scripts de auditoria (`security_scan.py`, `ux_audit.py`) verificados
- [x] Servidor dev testado e verificado

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (`tsc --noEmit`)
- Security: ✅ No critical issues (`contextIsolation: true`, `nodeIntegration: false`, partition isolation)
- Build: ✅ Success (`vite build` zero warnings/errors)
- Date: 2026-10-31
