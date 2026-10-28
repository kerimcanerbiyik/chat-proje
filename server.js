const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

// ==========================================
// 1. MODEL KATMANI (Veri Depolama)
// ==========================================
let activeUsersDb = {}; 
let messagesDb = {};   

const UserModel = {
    save: (username) => { activeUsersDb[username] = true; return username; },
    remove: (username) => { delete activeUsersDb[username]; },
    checkActive: (username) => { return !!activeUsersDb[username]; }
};

const MessageModel = {
    get: (roomId) => { return messagesDb[roomId] || { text: '', sender: '' }; },
    save: (roomId, sender, text) => { messagesDb[roomId] = { sender, text }; return messagesDb[roomId]; }
};


// ==========================================
// 2. SERVICE KATMANI (Tüm İşlemler Burada)
// ==========================================
const UserService = {
    login: (username) => {
        if (!username || username.length > 10) throw new Error('Geçersiz kullanıcı adı!');
        return UserModel.save(username);
    },
    logout: (username) => { 
        UserModel.remove(username); 
    }
};

const MessageService = {
    getMessages: (roomId) => { 
        return MessageModel.get(roomId); 
    },
    sendMessage: (sender, targetUser, text) => {
        if (!text || text.length > 50) throw new Error('Max 50 karakter!');
        if (!UserModel.checkActive(targetUser)) throw new Error('Username yok');
        const roomId = [sender, targetUser].sort().join('');
        return MessageModel.save(roomId, sender, text);
    }
};


// ==========================================
// 3. CONTROLLER KATMANI (Sadece Service'deki İşlemi Çağırma)
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/user/login', (req, res) => {
    try {
        const { username } = req.body;
        const user = UserService.login(username); // Service çağrısı
        res.json({ success: true, user });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/user/logout', (req, res) => {
    try {
        const { username } = req.body;
        UserService.logout(username); // Service çağrısı
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get('/api/chat/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        res.json(MessageService.getMessages(roomId)); // Service çağrısı
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/chat/send', (req, res) => {
    try {
        const { sender, targetUser, text } = req.body;
        res.json({ success: true, message: MessageService.sendMessage(sender, targetUser, text) }); // Service çağrısı
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.listen(3000, '127.0.0.1', () => {
    console.log('Sunucu 3000 portunda başarıyla çalışıyor: http://127.0.0.1:3000');
});