# 🎮 4Nav — Navegador Desktop para Jogos Idle & Multi-Contas

<div align="center">

![Versão](https://img.shields.io/badge/versão-1.0.0-10B981?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-34.2-111317?style=for-the-badge&logo=electron)
![React](https://img.shields.io/badge/React-19.0-181B21?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-06B6D4?style=for-the-badge&logo=typescript)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows_10_%2F_11-10B981?style=for-the-badge&logo=windows)
![Licença](https://img.shields.io/badge/licença-MIT-F59E0B?style=for-the-badge)

**O navegador desktop definitivo projetado para jogadores que farmam em múltiplos jogos idle simultaneamente sem superaquecer a máquina ou sobrecarregar a CPU.**

[🌐 Site Oficial (GitHub Pages)](https://usuario.github.io/4Nav/) • [📥 Baixar Executável (.exe)](#-download--instalação) • [⌨️ Atalhos](#-atalhos-de-teclado)

</div>

---

## ⚡ Por que o 4Nav?

Jogadores de *idle games* (como RO Classic Idle, Cookie Clicker, jogos de browser incrementais e MMORPGs web) enfrentam 3 grandes problemas ao abrir várias contas no Chrome, Edge ou Firefox comuns:

1. **Uso Excessivo de CPU/GPU:** Cada aba renderiza efeitos pesados e animações a 60 FPS desnecessariamente.
2. **Conflito de Logins:** Abrir a mesma página em abas normais compartilha cookies e desloga sua outra conta.
3. **Cacofonia de Som:** Três ou quatro jogos tocando músicas e efeitos ao mesmo tempo sobrecarregam a *Web Audio API*.

O **4Nav** resolve tudo isso com uma interface tática em tema escuro projetada exclusivamente para múltiplos jogos!

---

## ✨ Principais Funcionalidades

| Recurso | Descrição |
| :--- | :--- |
| **🎮 Multi-Telas Dinâmico** | Começa com **1 tela cheia**. Clique em **`+ Janela`** para abrir a 2ª, 3ª, 4ª conta ou mais na mesma aba. A grade se adapta automaticamente. |
| **🛡️ Sessões 100% Isoladas** | Cada aba do 4Nav possui um container de cookies e logins separado. Jogue em quantas contas quiser sem que uma desconecte a outra. |
| **⚡ Modo Ultra Leve** | Reduz o custo computacional de animações CSS e transições supérfluas dos jogos, economizando processamento e GPU. |
| **🔇 Mutação Inteligente de Áudio** | Apenas a tela focada emite som. As janelas em segundo plano são mutadas automaticamente, economizando até 25% de CPU. |
| **⌨️ Atalhos Rápidos de Maximizar** | Pressione **`Alt + 1`**, **`Alt + 2`**, etc., para maximizar uma janela para tela cheia e cuidar daquela conta. Pressione **`ESC`** para voltar à grade. |
| **🧹 Liberador de Memória RAM** | Botão integrado no painel de configurações para liberar caches estáticos e disparar a coleta de lixo da memória. |
| **🔎 Escala de Zoom Econômica** | Permite reduzir o zoom para 90% ou 80%, diminuindo a área do buffer WebGL/Canvas e poupando VRAM da placa de vídeo. |

---

## 📥 Download & Instalação

### Opção 1: Baixar a Versão Compilada Pronta (Recomendado)
1. Acesse a aba de **[Releases](../../releases)** deste repositório.
2. Baixe o pacote compactado `.zip` ou o executável `4Nav.exe`.
3. Extraia em qualquer pasta e dê um duplo clique em `4Nav.exe` (ou `Abrir 4Nav.bat`).

### Opção 2: Compilar a partir do Código-Fonte
Certifique-se de ter o [Node.js](https://nodejs.org/) (versão 18+) instalado:

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/4Nav.git
cd 4Nav

# 2. Instale as dependências
npm install

# 3. Inicie em modo de desenvolvimento (Vite)
npm run dev

# 4. Ou compile o executável desktop nativo para Windows
npm run desktop
```

O executável standalone será criado dentro da pasta `4Nav-App\4Nav.exe`.

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
| :--- | :--- |
| `Alt + 1` | Maximizar / Restaurar Janela 1 |
| `Alt + 2` | Maximizar / Restaurar Janela 2 |
| `Alt + 3` | Maximizar / Restaurar Janela 3 |
| `Alt + 4` | Maximizar / Restaurar Janela 4 |
| `Alt + 5..8` | Maximizar Janelas 5 até 8 |
| `ESC` | Restaurar imediatamente a visão em grade com todas as telas |
| `Ctrl + T` | Criar Nova Aba (novo container de sessão 100% isolado) |
| `Ctrl + W` | Fechar aba atual |

> 💡 *Você pode personalizar a tecla modificadora (Alt, Ctrl ou Shift) e gravar atalhos próprios no painel de Configurações do 4Nav.*

---

## 🌐 Site no GitHub Pages

Este repositório contém o site oficial do 4Nav configurado na pasta `/docs`.

Para ativá-lo no seu fork ou repositório:
1. Vá nas **Settings** do seu repositório no GitHub.
2. Acesse a aba **Pages** (no menu lateral esquerdo).
3. Em **Build and deployment**, selecione:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / pasta `/docs`
4. Clique em **Save**. O seu site de download e informações estará disponível em:
   `https://<seu-usuario>.github.io/4Nav/`

---

## 🛠️ Tecnologias Utilizadas

* **Runtime Desktop:** [Electron 34](https://www.electronjs.org/)
* **Interface & UI:** [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
* **Estilização & Design Tokens:** [Tailwind CSS v4](https://tailwindcss.com/) (Industrial Carbon & Signal Emerald)
* **Ícones:** [Phosphor Icons](https://phosphoricons.com/)
* **Bundler & Dev Server:** [Vite 6](https://vitejs.dev/)

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais detalhes.

