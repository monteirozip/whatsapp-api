# whatsapp-api
API REST simples e poderosa para enviar e receber mensagens do WhatsApp usando Baileys (multi-device). 
## ✅ Recursos

- ✅ Enviar mensagens de texto
- ✅ Enviar imagens / mídia
- ✅ Receber mensagens (auto-resposta)
- ✅ QR Code ou Pairing Code
- ✅ Multi-dispositivo
- ✅ API REST simples
- ✅ Funciona offline (após conexão)

---

## 🚀 Instalação no Android (Termux)

### 1. Instale o Termux

Baixe no F-Droid (recomendado) ou GitHub oficial.

### 2. Configure o Termux

Abra o Termux e execute os comandos:

```bash
# Atualizar pacotes
pkg update && pkg upgrade -y

# Instalar Node.js
pkg install nodejs git -y

# Verificar instalação
node --version
npm --version
```

### 3. Baixe a API

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/whatsapp-api.git
cd whatsapp-api

# Ou crie manualmente:
# (copie os arquivos index.js e package.json)
```

### 4. Instale as dependências

```bash
npm install
```

---

## ▶️ Como executar

### Iniciar a API

```bash
node index.js
```

Você verá algo assim:

```
🚀 API WhatsApp rodando em http://localhost:3000
📱 Acesse: http://localhost:3000/status

Para Android (Termux):
   curl http://localhost:3000/qr
```

### Conectar ao WhatsApp

1. Abra outro terminal no Termux (ou use `termux-open-url`)
2. Gere o QR Code:

```bash
curl http://localhost:3000/qr
```

3. Abra o WhatsApp no celular → **Dispositivos conectados** → **Vincular um dispositivo**
4. Escaneie o QR Code que aparece no terminal

Pronto! A API estará conectada.

---

## 📡 Endpoints da API

### Status da conexão
```bash
GET http://localhost:3000/status
```

### Gerar QR Code
```bash
GET http://localhost:3000/qr
```

### Enviar mensagem de texto
```bash
POST http://localhost:3000/send-text
Content-Type: application/json

{
  "to": "5599999999999",
  "message": "Olá! Como posso ajudar?"
}
```

### Enviar imagem
```bash
POST http://localhost:3000/send-media
Content-Type: application/json

{
  "to": "5599999999999",
  "url": "https://exemplo.com/imagem.jpg",
  "caption": "Confira esta foto!"
}
```

### Desconectar
```bash
POST http://localhost:3000/disconnect
```

---

## 📱 Exemplo de uso no Android

Você pode chamar a API de qualquer app (Tasker, HTTP Request, etc):

### Via curl:
```bash
curl -X POST http://localhost:3000/send-text \
  -H "Content-Type: application/json" \
  -d '{"to":"5599999999999","message":"Olá do Termux!"}'
```

### Via JavaScript (fetch):
```js
fetch('http://localhost:3000/send-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '5599999999999',
    message: 'Teste da API'
  })
});
```

---

## ⚙️ Configurações Avançadas

### Mudar a porta
```bash
PORT=8080 node index.js
```

### Auto-resposta personalizada

Edite o arquivo `index.js` na seção:

```js
sock.ev.on('messages.upsert', async ({ messages }) => {
  // Adicione sua lógica aqui
});
```

### Executar em background

```bash
# Instale pm2 (opcional)
npm install -g pm2

# Rode em background
pm2 start index.js --name whatsapp-api
```

---

## ⚠️ Avisos Importantes

1. **Risco de banimento**: Use com responsabilidade. Evite spam.
2. **Multi-dispositivo**: Funciona com WhatsApp Web oficial.
3. **Armazenamento**: As credenciais ficam na pasta `auth_info_baileys`.
4. **Termux**: Mantenha o app aberto ou use `termux-wake-lock`.

---

## 🛠️ Troubleshooting

**Erro de conexão?**
- Verifique se o WhatsApp está atualizado
- Tente desconectar e reconectar

**QR Code não aparece?**
```bash
rm -rf auth_info_baileys
node index.js
```

**Porta já em uso?**
```bash
PORT=4000 node index.js
```

---

## 📞 Suporte

API criada com **@whiskeysockets/baileys** + **Express**.

Funciona em:
- Android (Termux)
- Linux
- Windows
- Raspberry Pi

**Versão**: 2026

Boa automação! 🚀
