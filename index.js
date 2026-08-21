const makeWASocket = require('@whiskeysockets/baileys').default;
const { 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Configurações
const PORT = process.env.PORT || 3000;
const AUTH_FOLDER = './auth_info_baileys';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Variáveis globais
let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected';

// Função para iniciar a conexão com WhatsApp
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['WhatsApp API Android', 'Chrome', '4.0.0'],
  });

  // Eventos de conexão
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      console.log('\n📱 Escaneie o QR Code abaixo com o WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = 
        (lastDisconnect?.error instanceof Boom) && 
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      
      connectionStatus = 'disconnected';
      console.log('❌ Conexão fechada. Reconectando...', shouldReconnect);

      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 2000);
      }
    } else if (connection === 'open') {
      qrCode = null;
      connectionStatus = 'connected';
      console.log('✅ WhatsApp conectado com sucesso!');
    }
  });

  // Salvar credenciais
  sock.ev.on('creds.update', saveCreds);

  // Receber mensagens (auto-resposta ou webhook)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    
    if (!msg.key.fromMe && msg.message) {
      const from = msg.key.remoteJid;
      const messageText = msg.message.conversation || 
                         msg.message.extendedTextMessage?.text || 
                         'Mensagem não textual';
      
      console.log(`📩 Mensagem recebida de ${from}: ${messageText}`);

      // Exemplo de auto-resposta simples
      if (messageText.toLowerCase().includes('oi') || messageText.toLowerCase().includes('olá')) {
        await sock.sendMessage(from, { 
          text: 'Olá! Como posso ajudar você hoje?' 
        });
      } else if (messageText.toLowerCase().includes('preço')) {
        await sock.sendMessage(from, { 
          text: 'Nossos preços estão no site: https://seusite.com/precos' 
        });
      }
    }
  });

  return sock;
}

// ROTA: Status da conexão
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    connected: connectionStatus === 'connected',
    qrAvailable: !!qrCode
  });
});

// ROTA: Gerar QR Code (texto)
app.get('/qr', (req, res) => {
  if (qrCode) {
    res.json({ 
      success: true, 
      qr: qrCode,
      message: 'Escaneie o QR Code com seu WhatsApp' 
    });
  } else if (connectionStatus === 'connected') {
    res.json({ 
      success: true, 
      message: 'Já está conectado!' 
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Aguardando QR Code...' 
    });
  }
});

// ROTA: Enviar mensagem de texto
app.post('/send-text', async (req, res) => {
  try {
    if (!sock || connectionStatus !== 'connected') {
      return res.status(400).json({ 
        success: false, 
        error: 'WhatsApp não está conectado' 
      });
    }

    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos "to" e "message" são obrigatórios' 
      });
    }

    // Formatar número (adiciona @s.whatsapp.net se necessário)
    let jid = to;
    if (!jid.includes('@s.whatsapp.net') && !jid.includes('@g.us')) {
      jid = `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    const result = await sock.sendMessage(jid, { text: message });

    res.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso!',
      id: result.key.id
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ROTA: Enviar mídia (imagem)
app.post('/send-media', async (req, res) => {
  try {
    if (!sock || connectionStatus !== 'connected') {
      return res.status(400).json({ success: false, error: 'Não conectado' });
    }

    const { to, url, caption = '' } = req.body;

    if (!to || !url) {
      return res.status(400).json({ 
        success: false, 
        error: '"to" e "url" são obrigatórios' 
      });
    }

    let jid = to;
    if (!jid.includes('@')) {
      jid = `${to.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    }

    const result = await sock.sendMessage(jid, {
      image: { url },
      caption
    });

    res.json({ 
      success: true, 
      message: 'Mídia enviada!',
      id: result.key.id 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ROTA: Desconectar
app.post('/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
      connectionStatus = 'disconnected';
    }
    res.json({ success: true, message: 'Desconectado com sucesso' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ROTA: Listar conversas (simples)
app.get('/chats', async (req, res) => {
  try {
    if (!sock) {
      return res.status(400).json({ success: false, error: 'Não conectado' });
    }
    
    // Nota: Baileys não tem uma API simples para listar chats, 
    // isso seria mais avançado usando store
    res.json({ 
      success: true, 
      message: 'Use o evento messages.upsert para capturar conversas' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API WhatsApp rodando em http://localhost:${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}/status`);
  console.log(`\nPara Android (Termux):`);
  console.log(`   curl http://localhost:${PORT}/qr\n`);
  
  // Inicia conexão automaticamente
  connectToWhatsApp().catch(console.error);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  console.error('Erro não tratado:', err);
});

console.log('✅ API inicializada!');
