const express = require('express');
const app = express();
const cors = require('cors');
const PORT = 5000;

app.use(cors());

// مسار الصفحة الرئيسية
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// مسار API لجلب بيانات المستخدم
app.get('/api/user', (req, res) => {
    res.json({ name: 'Youssef', id: 123 });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});