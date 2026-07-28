# 🚀 Tailor Shop Management - Setup Guide

## ✅ Step-by-Step Setup

### 1️⃣ **WAMP Installation & Setup**
- Download WAMP from https://www.wampserver.com
- Install WAMP → Apache + MySQL + PHP automatically setup hota hai
- WAMP folder location: `C:\wamp64\` (ya jo path select kiye)

### 2️⃣ **Create Project Folder**
```
C:\wamp64\www\tailor_app\
```
Ab sabhi 7 files is folder mein daalo:
- `index.html`
- `style.css`
- `app.js`
- `config.php`
- `auth.php`
- `customers.php`
- `database.sql`

### 3️⃣ **Database Setup**
1. WAMP chalu karo (system tray mein icon hona chahiye)
2. Right-click → Open phpMyAdmin
3. URL khul jayega: `http://localhost/phpmyadmin`
4. Left mein **Import** tab click karo
5. `database.sql` file select karo
6. **Go** button dabao ✅

### 4️⃣ **URL Configuration (IMPORTANT!)**
`app.js` mein line 7 dekho:
```javascript
const API = 'http://localhost/tailor_app';
```

Agar WAMP folder alag name se hai, toh update karo:
- Folder name = `tailor_shop`? → `http://localhost/tailor_shop`
- Folder name = `darzi_app`? → `http://localhost/darzi_app`

### 5️⃣ **Test Connection**
Browser mein kholo: `http://localhost/tailor_app/`

---

## 🔧 Troubleshooting

### ❌ "Server se connection fail"
**Solution:**
1. WAMP chal raha hai? (System tray check karo)
2. Apache green? MySQL green? (WAMP icon click karo)
3. `app.js` mein API URL sahi hai?
4. Folder name sahi hai?

### ❌ Database connection fail
**Solution:**
1. phpMyAdmin mein login try karo: `http://localhost/phpmyadmin`
2. `database.sql` properly import hua?
3. MySQL service chal raha hai?
4. Default password khali hai (DB_PASS = '')

### ❌ Login nahi ho raha
**Solution:**
1. Database mein `tailors` table banaya? (phpMyAdmin → check karo)
2. Register page se pehle account banana padta hai
3. Username + password correct daal rhe ho?

### ❌ Customer save nahi ho raha
**Solution:**
1. Login kaisa tha? Console log dekho (F12 → Console)
2. API response kya mil raha? 
3. Browser console mein error dikhe?

---

## 📝 Default Credentials (First Time)

**Register** karo sabse pehle:
- **Shop Name:** "Ramesh Tailor" ya apna naam
- **Username:** ramesh123 (kam se kam 4 characters)
- **Password:** password123 (kam se kam 6 characters)
- **Mobile:** 9876543210
- **Address:** Shop ka address

Phir **Login** karo:
- **Username:** ramesh123
- **Password:** password123

---

## 🛠️ Debugging Mode

Browser console mein API calls dikhne ke liye:
```
Press: F12 → Console Tab
```

Login/API calls ka log dikhega 👀

---

## 📂 File Structure

```
tailor_app/
├── index.html          ← Main UI
├── style.css          ← 3D Design (Premium)
├── app.js             ← Frontend logic + API calls
├── config.php         ← Database connection
├── auth.php           ← Register/Login API
├── customers.php      ← Customer CRUD API
├── database.sql       ← MySQL database setup
└── SETUP.md           ← This file
```

---

## 🌐 How It Works

1. **User logs in** → `auth.php` check karta hai
2. **tailor object store** → localStorage mein save
3. **Add customer** → `tailor.id` automatically use hota hai
4. **API call** → `customers.php` ko tailor_id mil jata hai
5. **Database save** → Same tailor ke data alag separate

---

## ✨ Features

✅ Multi-tailor system (har tailor ka alag data)  
✅ Premium 3D CSS design  
✅ Customer + Measurements + Payments  
✅ WhatsApp integration  
✅ Auto login (session restore)  
✅ Search functionality  
✅ Mobile responsive  

---

## 🆘 Still Not Working?

1. **WAMP Services** start karo:
   - WAMP icon → Click → Apache OFF? → ON karo
   - MySQL OFF? → ON karo

2. **Folder path** check karo:
   - `C:\wamp64\www\tailor_app\` mein sabhi files hain?

3. **Database** verify karo:
   - phpMyAdmin → Left panel → `tailor_db` database visible?
   - Tables: `tailors`, `customers`, `measurements` etc.?

4. **Permissions** check karo:
   - Folder `tailor_app` ko read/write permissions diye?

---

## 📞 Quick Commands

```bash
# MySQL service restart (cmd admin mein)
net stop MySQL80
net start MySQL80

# WAMP reset karne ke liye
C:\wamp64\wampmanager.exe
```

---

**Happy Tailoring! 👔🧵**
