FROM node:18-slim

WORKDIR /app

# Instalar git (necessário para clonar repositórios)
RUN apt-get update && apt-get install -y \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código-fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Criar diretórios necessários
RUN mkdir -p output temp

# Comando para execução
CMD ["node", "dist/index.js"]