const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const pino = require('pino');

const app = express();
app.use(cors());
app.use(express.json());

let sock;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if(connection === 'open') {
            console.log('✅ تم الاتصال بالواتساب بنجاح!');
        }
    });
}

app.post('/send-otp', async (req, res) => {
    const { phone, code } = req.body;
    const formattedPhone = phone.replace('+', '') + '@s.whatsapp.net';

    try {
        await sock.sendMessage(formattedPhone, { 
            text: `رمز التحقق الخاص بك لتطبيق دجرات هو: ${code}\nلا تشارك هذا الرمز مع أي شخص.` 
        });
        res.json({ success: true, message: 'تم إرسال الكود بنجاح!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`السيرفر يعمل على المنفذ ${PORT}`);
    connectToWhatsApp();
});
