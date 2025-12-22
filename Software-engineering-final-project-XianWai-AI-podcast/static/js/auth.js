// 工具函数
function showToast(message, type = 'success') {
    const toast = document.getElementById('messageToast');
    toast.textContent = message;
    toast.className = `message-toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}

function setError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
    }
}

function setLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
}

// 密码显示/隐藏切换
function initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input[type="password"]');
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    this.querySelector('.eye-icon').style.opacity = '0.5';
                } else {
                    input.type = 'password';
                    this.querySelector('.eye-icon').style.opacity = '1';
                }
            }
        });
    });
}

// 登录表单处理
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const loginButton = document.getElementById('loginButton');
        
        // 前端验证
        if (!username) {
            setError('usernameError', '请输入用户名或邮箱');
            // 添加输入框震动效果
            document.getElementById('username').focus();
            return;
        }
        
        if (!password) {
            setError('passwordError', '请输入密码');
            // 添加输入框震动效果
            document.getElementById('password').focus();
            return;
        }
        
        // 添加按钮点击动画
        loginButton.classList.add('clicked');
        setTimeout(() => {
            loginButton.classList.remove('clicked');
        }, 200);
        
        setLoading('loginButton', true);
        
        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            // 检查响应状态
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            console.log('Login response:', data); // 调试日志
            
            if (data.success) {
                // 添加成功动画
                loginButton.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
                showToast('登录成功！正在跳转...', 'success');
                
                // 确保跳转
                setTimeout(() => {
                    window.location.href = '/home';
                }, 500);
            } else {
                setLoading('loginButton', false);
                setError('passwordError', data.message || '登录失败');
                showToast(data.message || '登录失败', 'error');
                
                // 添加错误震动效果
                loginButton.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    loginButton.style.animation = '';
                }, 500);
            }
        } catch (error) {
            setLoading('loginButton', false);
            showToast('网络错误，请稍后重试', 'error');
            console.error('Login error:', error);
            
            // 添加错误震动效果
            loginButton.style.animation = 'shake 0.5s';
            setTimeout(() => {
                loginButton.style.animation = '';
            }, 500);
        }
    });
}

// 注册表单处理
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        
        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        // 前端验证
        let hasError = false;
        
        if (!username) {
            setError('regUsernameError', '请输入用户名');
            hasError = true;
        } else if (username.length < 3 || username.length > 20) {
            setError('regUsernameError', '用户名长度应在3-20个字符之间');
            hasError = true;
        }
        
        if (!email) {
            setError('regEmailError', '请输入邮箱');
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('regEmailError', '请输入有效的邮箱地址');
            hasError = true;
        }
        
        if (!password) {
            setError('regPasswordError', '请输入密码');
            hasError = true;
        } else if (password.length < 6) {
            setError('regPasswordError', '密码长度至少为6个字符');
            hasError = true;
        }
        
        if (!confirmPassword) {
            setError('regConfirmPasswordError', '请确认密码');
            hasError = true;
        } else if (password !== confirmPassword) {
            setError('regConfirmPasswordError', '两次输入的密码不一致');
            hasError = true;
        }
        
        if (!agreeTerms) {
            showToast('请先同意服务条款和隐私政策', 'error');
            hasError = true;
        }
        
        if (hasError) {
            return;
        }
        
        setLoading('registerButton', true);
        
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    confirm_password: confirmPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('注册成功！正在跳转...', 'success');
                setTimeout(() => {
                    window.location.href = '/home';
                }, 1000);
            } else {
                setLoading('registerButton', false);
                
                // 根据错误信息设置对应的错误提示
                if (data.message.includes('用户名')) {
                    setError('regUsernameError', data.message);
                } else if (data.message.includes('邮箱')) {
                    setError('regEmailError', data.message);
                } else if (data.message.includes('密码')) {
                    setError('regPasswordError', data.message);
                } else {
                    showToast(data.message || '注册失败', 'error');
                }
            }
        } catch (error) {
            setLoading('registerButton', false);
            showToast('网络错误，请稍后重试', 'error');
            console.error('Register error:', error);
        }
    });
    
    // 实时验证密码一致性
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');
    
    if (regPassword && regConfirmPassword) {
        regConfirmPassword.addEventListener('blur', function() {
            if (this.value && this.value !== regPassword.value) {
                setError('regConfirmPasswordError', '两次输入的密码不一致');
            } else {
                setError('regConfirmPasswordError', '');
            }
        });
    }
}

// 初始化密码切换功能
initPasswordToggles();

// 输入框聚焦动画
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});

