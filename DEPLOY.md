# Guia de Deploy - Railway 🚀

Este projeto já está configurado para deploy imediato no Railway (ou qualquer plataforma com suporte a Docker).

## Passos para Deploy

1.  Acesse [Railway.app](https://railway.app/).
2.  Clique em **"New Project"** > **"Deploy from GitHub repo"**.
3.  Selecione o repositório `rh-manager`.
4.  O Railway detectará automaticamente o `Dockerfile` presente na raiz.
5.  Clique em **"Deploy Now"**.

## Configurações Técnicas (Já aplicadas)

*   **Dockerfile:** Otimizado para Next.js (Standalone mode).
*   **Porta:** Configurada para `3000` (padrão Railway).
*   **Variáveis de Ambiente:** O projeto atual não exige `.env` para rodar o básico.

## Após o Deploy

O Railway gerará um domínio público (ex: `rh-manager-production.up.railway.app`). Esse será seu **link de produção comercial**.
