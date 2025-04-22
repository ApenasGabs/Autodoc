# Autodoc

**Autodoc** é uma ferramenta experimental que analisa repositórios de código e gera automaticamente um documento com as instruções mínimas necessárias para rodar o projeto, além de oferecer contexto técnico e estrutural com base nos arquivos e dependências presentes.

> *"Chega de clonar repositório e ficar perdido no que fazer para rodar."*

---

## ⚙️ Como Funciona (visão futura)

A ideia do Autodoc é ser executado diretamente via um app (ou CLI) conectado ao GitHub. Ele irá:

1. Analisar os arquivos do projeto (ex: `package.json`, `requirements.txt`, `Gemfile`, etc.).
2. Detectar estruturas e templates comuns.
3. Gerar um arquivo `AUTODOC.md` com:
   - Requisitos do ambiente.
   - Comandos para rodar o projeto.
   - Dependências principais.
   - Contexto geral do repositório.
4. (Opcional) Criar um Pull Request com esse arquivo no repositório original.

---

## 🧪 Status

Este projeto ainda está em fase **teórica/conceitual**. Nenhuma linha de código foi escrita ainda, mas a ideia está sendo discutida e lapidada via [issues](https://github.com/apenasgabs/autodoc/issues).

---

## 🧠 Ideias Futuras

- API para gerar `AUTODOC.md` via requisição.
- GitHub Action para rodar Autodoc automaticamente em push.
- Suporte a múltiplas linguagens/frameworks.
- Interface visual via app ou extensão para GitHub.

---

## 📌 Objetivo

Facilitar o onboarding de pessoas desenvolvedoras em repositórios — seja em projetos open source ou times internos — eliminando a frustração de tentar rodar projetos mal documentados.

---

## Contribuindo

Ainda estamos na fase de discussão da arquitetura. Se você curte a ideia, abre uma [issue](https://github.com/apenasgabs/autodoc/issues) com sugestões, cenários de uso ou tecnologias que poderiam ajudar.

---

## Licença

Este projeto será licenciado futuramente — a definir.
