// تهيئة المتغيرات العامة
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let codes = JSON.parse(localStorage.getItem('codes')) || [];
let gameBoard = [];
let redSquarePosition = -1;
let helpAvailable = false;
let helpUsed = false;

// عناصر DOM
const pages = {
    login: document.getElementById('loginPage'),
    register: document.getElementById('registerPage'),
    main: document.getElementById('mainPage'),
    game: document.getElementById('gamePage'),
    admin: document.getElementById('adminPage'),
    codeGenerator: document.getElementById('codeGeneratorPage'),
    redeem: document.getElementById('redeemPage'),
    store: document.getElementById('storePage')
};

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من وجود مستخدم مسجل دخول
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPage('main');
        updatePointsDisplay();
        updateLeaderboard();
    } else {
        showPage('login');
    }

    // إعداد مستمعي الأحداث
    setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // تسجيل الدخول
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('register');
    });

    // إنشاء حساب
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login');
    });

    // الصفحة الرئيسية
    document.getElementById('playBtn').addEventListener('click', startGame);
    document.getElementById('adminBtn').addEventListener('click', () => showPage('admin'));
    document.getElementById('redeemCodeBtn').addEventListener('click', () => showPage('redeem'));
    document.getElementById('storeBtn').addEventListener('click', () => showPage('store'));

    // اللعبة
    document.getElementById('exitGameBtn').addEventListener('click', exitGame);
    document.getElementById('helpBtn').addEventListener('click', useHelp);

    // القاعدة (المسؤول)
    document.getElementById('adminForm').addEventListener('submit', handleAdminLogin);
    document.getElementById('backToMainFromAdmin').addEventListener('click', () => showPage('main'));

    // إنشاء الكود
    document.getElementById('codeForm').addEventListener('submit', generateCode);
    document.getElementById('backToMainFromCode').addEventListener('click', () => showPage('main'));

    // استرداد الكود
    document.getElementById('redeemForm').addEventListener('submit', redeemCode);
    document.getElementById('backToMainFromRedeem').addEventListener('click', () => showPage('main'));

    // المتجر
    document.getElementById('exchangeBtn').addEventListener('click', exchangePoints);
    document.getElementById('buyHelpBtn').addEventListener('click', buyHelp);
    document.getElementById('backToMainFromStore').addEventListener('click', () => showPage('main'));
}

// عرض صفحة محددة
function showPage(pageName) {
    Object.values(pages).forEach(page => {
        page.classList.remove('active');
    });

    if (pages[pageName]) {
        pages[pageName].classList.add('active');
    }
}

// معالجة تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPage('main');
        updatePointsDisplay();
        updateLeaderboard();
        showNotification('تم تسجيل الدخول بنجاح', 'success');
    } else {
        showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }

    // إعادة تعيين النموذج
    document.getElementById('loginForm').reset();
}

// معالجة إنشاء الحساب
function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // التحقق من صحة البيانات
    if (password !== confirmPassword) {
        showNotification('كلمة المرور وتأكيد كلمة المرور غير متطابقين', 'error');
        return;
    }

    // التحقق من عدم وجود المستخدم مسبقاً
    if (users.find(u => u.username === username)) {
        showNotification('اسم المستخدم موجود بالفعل', 'error');
        return;
    }

    // إنشاء مستخدم جديد
    const newUser = {
        username,
        password,
        greenPoints: 0,
        goldPoints: 0,
        helpAvailable: false
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showNotification('تم إنشاء الحساب بنجاح', 'success');
    showPage('login');

    // إعادة تعيين النموذج
    document.getElementById('registerForm').reset();
}

// بدء اللعبة
function startGame() {
    // إنشاء لوحة اللعب
    createGameBoard();
    showPage('game');

    // إعادة تعيين متغيرات اللعبة
    helpUsed = false;
    helpAvailable = currentUser.helpAvailable;
}

// إنشاء لوحة اللعب
function createGameBoard() {
    const gameBoardElement = document.getElementById('gameBoard');
    gameBoardElement.innerHTML = '';

    // إنشاء مصفوفة اللعبة
    gameBoard = new Array(9).fill(null);

    // تحديد موقع المربع الأحمر بشكل عشوائي
    redSquarePosition = Math.floor(Math.random() * 9);

    // إنشاء المربعات
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'game-cell';
        cell.dataset.index = i;
        cell.addEventListener('click', () => handleCellClick(i));
        gameBoardElement.appendChild(cell);
    }
}

// معالجة النقر على المربع
function handleCellClick(index) {
    const cell = document.querySelector(`.game-cell[data-index="${index}"]`);

    // التحقق من أن المربع لم يتم النقر عليه مسبقاً
    if (cell.classList.contains('green') || cell.classList.contains('red')) {
        return;
    }

    // التحقق من أن هذا هو المربع الأحمر
    if (index === redSquarePosition) {
        cell.classList.add('red');
        playLoseSound();
        showNotification('لقد خسرت! حاول مرة أخرى', 'error');
        setTimeout(() => {
            exitGame();
        }, 500);
    } else {
        cell.classList.add('green');

        // التحقق من الفوز
        checkWinCondition();
    }
}

// التحقق من شرط الفوز
function checkWinCondition() {
    const greenCells = document.querySelectorAll('.game-cell.green');

    // إذا تم كشف جميع المربعات الخضراء (8 مربعات)
    if (greenCells.length === 8) {
        // إضافة 20 نقطة خضراء للمستخدم
        currentUser.greenPoints += 20;
        updateUserInStorage();
        updatePointsDisplay();

        showNotification('مبروك! لقد فزت وحصلت على 20 نقطة خضراء', 'success');

        setTimeout(() => {
            exitGame();
        }, 2000);
    }
}

// تشغيل صوت الخسارة
function playLoseSound() {
    const audio = new Audio('lose.mp3');
    audio.play().catch(error => {
        console.log('لا يمكن تشغيل الصوت:', error);
    });
}

// الخروج من اللعبة
function exitGame() {
    showPage('main');
}

// استخدام المساعدة
function useHelp() {
    if (!helpAvailable) {
        showNotification('ليس لديك مساعدة متاحة. يمكنك شرائها من المتجر', 'warning');
        return;
    }

    if (helpUsed) {
        showNotification('لقد استخدمت المساعدة بالفعل في هذه الجولة', 'warning');
        return;
    }

    // تمييز المربع الأحمر باللون الأصفر
    const redCell = document.querySelector(`.game-cell[data-index="${redSquarePosition}"]`);
    if (redCell && !redCell.classList.contains('red')) {
        redCell.classList.add('help');
        helpUsed = true;
        currentUser.helpAvailable = false;
        updateUserInStorage();
    }
}

// معالجة تسجيل دخول المسؤول
function handleAdminLogin(e) {
    e.preventDefault();

    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;

    // التحقق من بيانات المسؤول
    if (username === 'moumen' && password === 'moumen2013') {
        showPage('codeGenerator');
        showNotification('مرحباً بك في لوحة التحكم', 'success');
    } else {
        showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }

    // إعادة تعيين النموذج
    document.getElementById('adminForm').reset();
}

// توليد كود
function generateCode(e) {
    e.preventDefault();

    const pointsAmount = parseInt(document.getElementById('pointsAmount').value);
    const pointsType = document.querySelector('input[name="pointsType"]:checked').value;

    // توليد كود عشوائي مكون من 12 حرفاً ورقماً
    const code = generateRandomCode(12);

    // حفظ الكود
    codes.push({
        code,
        pointsAmount,
        pointsType,
        used: false
    });

    localStorage.setItem('codes', JSON.stringify(codes));

    // عرض الكود
    const codeElement = document.getElementById('generatedCode');
    codeElement.textContent = `الكود: ${code}`;
    codeElement.style.display = 'block';

    showNotification('تم إنشاء الكود بنجاح', 'success');

    // إعادة تعيين النموذج
    document.getElementById('codeForm').reset();
}

// توليد كود عشوائي
function generateRandomCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
}

// استرداد الكود
function redeemCode(e) {
    e.preventDefault();

    const codeInput = document.getElementById('redeemCode').value;

    // البحث عن الكود
    const codeIndex = codes.findIndex(c => c.code === codeInput);

    if (codeIndex === -1) {
        showNotification('الكود غير صحيح', 'error');
        return;
    }

    const code = codes[codeIndex];

    if (code.used) {
        showNotification('هذا الكود تم استخدامه مسبقاً', 'error');
        return;
    }

    // تحديث نقاط المستخدم
    if (code.pointsType === 'green') {
        currentUser.greenPoints += code.pointsAmount;
    } else {
        currentUser.goldPoints += code.pointsAmount;
    }

    // تحديث الكود كمستخدم
    code.used = true;

    // حفظ البيانات
    updateUserInStorage();
    localStorage.setItem('codes', JSON.stringify(codes));

    // تحديث العرض
    updatePointsDisplay();
    updateLeaderboard();

    showNotification(`تم استرداد الكود بنجاح! حصلت على ${code.pointsAmount} نقاط ${code.pointsType === 'green' ? 'خضراء' : 'ذهبية'}`, 'success');

    // إعادة تعيين النموذج
    document.getElementById('redeemForm').reset();
}

// تبديل النقاط
function exchangePoints() {
    if (currentUser.greenPoints < 20) {
        showNotification('ليس لديك نقاط خضراء كافية للتبديل', 'error');
        return;
    }

    const goldPointsToAdd = Math.floor(currentUser.greenPoints / 20);
    currentUser.greenPoints -= goldPointsToAdd * 20;
    currentUser.goldPoints += goldPointsToAdd;

    updateUserInStorage();
    updatePointsDisplay();
    updateLeaderboard();

    showNotification(`تم تبديل ${goldPointsToAdd * 20} نقطة خضراء إلى ${goldPointsToAdd} نقطة ذهبية`, 'success');
}

// شراء المساعدة
function buyHelp() {
    if (currentUser.greenPoints < 10) {
        showNotification('ليس لديك نقاط خضراء كافية لشراء المساعدة', 'error');
        return;
    }

    currentUser.greenPoints -= 10;
    currentUser.helpAvailable = true;

    updateUserInStorage();
    updatePointsDisplay();

    showNotification('تم شراء المساعدة بنجاح', 'success');
}

// تحديث عرض النقاط
function updatePointsDisplay() {
    document.getElementById('greenPointsDisplay').textContent = currentUser.greenPoints;
    document.getElementById('goldPointsDisplay').textContent = currentUser.goldPoints;
}

// تحديث لوحة الصدارة
function updateLeaderboard() {
    // ترتيب المستخدمين حسب النقاط الذهبية
    const sortedUsers = [...users].sort((a, b) => b.goldPoints - a.goldPoints);
    const topUsers = sortedUsers.slice(0, 3);

    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    topUsers.forEach((user, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="player-name">${user.username}</span>
            <span class="player-points">${user.goldPoints} نقطة ذهبية</span>
        `;
        leaderboardList.appendChild(item);
    });
}

// تحديث بيانات المستخدم في التخزين المحلي
function updateUserInStorage() {
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// عرض إشعار
function showNotification(message, type = 'success') {
    // إزالة أي إشعارات سابقة
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // إنشاء إشعار جديد
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // إظهار الإشعار
    setTimeout(() => {
        notification.style.display = 'block';
    }, 100);

    // إخفاء الإشعار بعد 3 ثواني
    setTimeout(() => {
        notification.style.display = 'none';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// تسجيل الخروج
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showPage('login');
    showNotification('تم تسجيل الخروج بنجاح', 'success');
}