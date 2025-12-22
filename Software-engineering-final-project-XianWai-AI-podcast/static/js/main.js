// 全局变量
let currentAudioUrl = null;
let currentAudioFilename = null;
let currentText = '';

// 工具函数
function showToast(message, type = 'success') {
    const toast = document.getElementById('messageToast');
    toast.textContent = message;
    toast.className = `message-toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('show');
    } else {
        overlay.classList.remove('show');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initTextInput();
    initSliders();
    loadHistory();
    loadUserInfo();
});

// 标签页切换
function initTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // 更新按钮状态
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 更新内容显示
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// 文本输入处理
function initTextInput() {
    const textInput = document.getElementById('textInput');
    const charCount = document.getElementById('charCount');

    textInput.addEventListener('input', function() {
        const text = this.value;
        const byteLength = getByteLength(text);
        const maxLength = 1024;

        charCount.textContent = `${byteLength} / ${maxLength} 字符`;

        if (byteLength > maxLength) {
            charCount.classList.add('error');
            charCount.classList.remove('warning');
        } else if (byteLength > maxLength * 0.9) {
            charCount.classList.add('warning');
            charCount.classList.remove('error');
        } else {
            charCount.classList.remove('warning', 'error');
        }
    });
}

// 计算字节长度（GBK编码）
function getByteLength(str) {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charAt(i);
        if (char.match(/[\u4e00-\u9fa5]/)) {
            // 中文字符占2字节
            length += 2;
        } else {
            length += 1;
        }
    }
    return length;
}

// 清空文本
function clearText() {
    document.getElementById('textInput').value = '';
    document.getElementById('charCount').textContent = '0 / 1024 字符';
    document.getElementById('charCount').classList.remove('warning', 'error');
}

// 滑块初始化
function initSliders() {
    const sliders = ['speed', 'pitch', 'volume'];
    
    sliders.forEach(name => {
        const slider = document.getElementById(`${name}Slider`);
        const valueDisplay = document.getElementById(`${name}Value`);
        
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
    });
}

// 生成音频
async function generateAudio() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    if (!text) {
        showToast('请输入要转换的文本', 'error');
        return;
    }

    const byteLength = getByteLength(text);
    if (byteLength > 1024) {
        showToast('文本长度超过1024字节限制，请缩短文本', 'error');
        return;
    }

    // 获取参数
    const voice = parseInt(document.getElementById('voiceSelect').value);
    const speed = parseInt(document.getElementById('speedSlider').value);
    const pitch = parseInt(document.getElementById('pitchSlider').value);
    const volume = parseInt(document.getElementById('volumeSlider').value);

    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = true;

    showLoading(true);
    currentText = text;

    try {
        const response = await fetch('/api/generate-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice: voice,
                speed: speed,
                pitch: pitch,
                volume: volume
            })
        });

        const data = await response.json();

        if (data.success) {
            currentAudioUrl = data.audio_url;
            currentAudioFilename = data.filename;
            
            // 显示音频播放器
            displayAudioPlayer(data.audio_url);
            showToast('语音生成成功！', 'success');
        } else {
            showToast(data.message || '生成失败，请稍后重试', 'error');
        }
    } catch (error) {
        console.error('Generate audio error:', error);
        showToast('网络错误，请稍后重试', 'error');
    } finally {
        showLoading(false);
        generateBtn.disabled = false;
    }
}

// 显示音频播放器
function displayAudioPlayer(audioUrl) {
    const container = document.getElementById('audioPlayerContainer');
    const controls = document.getElementById('audioControls');
    const player = document.getElementById('audioPlayer');

    container.innerHTML = '';
    player.src = audioUrl;
    controls.style.display = 'block';
}

// 下载音频
function downloadAudio() {
    if (!currentAudioUrl) {
        showToast('没有可下载的音频', 'error');
        return;
    }

    const link = document.createElement('a');
    link.href = currentAudioUrl;
    link.download = currentAudioFilename || 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('下载开始', 'success');
}

// 保存到历史记录
async function saveToHistory() {
    if (!currentAudioUrl || !currentText) {
        showToast('没有可保存的内容', 'error');
        return;
    }

    try {
        const response = await fetch('/api/save-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: currentText,
                audio_url: currentAudioUrl,
                filename: currentAudioFilename
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('已保存到历史记录', 'success');
            loadHistory();
        } else {
            showToast(data.message || '保存失败', 'error');
        }
    } catch (error) {
        console.error('Save history error:', error);
        showToast('保存失败，请稍后重试', 'error');
    }
}

// 加载历史记录
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();

        const historyList = document.getElementById('historyList');
        
        if (data.success && data.history && data.history.length > 0) {
            historyList.innerHTML = data.history.map(item => {
                // 获取完整文本（需要单独请求）
                const displayText = item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text;
                return `
                <div class="history-item">
                    <div class="history-item-header">
                        <div style="flex: 1;">
                            <div class="history-item-text" title="${escapeHtml(item.text)}">${escapeHtml(displayText)}</div>
                            <div class="history-item-meta">
                                <span>${formatDate(item.created_at)}</span>
                                <span>${item.voice_name || '默认'}</span>
                                <span>语速:${item.speed} 音调:${item.pitch} 音量:${item.volume}</span>
                            </div>
                        </div>
                        <div class="history-item-actions">
                            <button onclick="playHistoryAudio('${item.audio_url}')" title="播放">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                            </button>
                            <button onclick="downloadHistoryAudio('${item.audio_url}', '${item.filename || 'audio.mp3'}')" title="下载">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                </svg>
                            </button>
                            <button onclick="deleteHistoryItem(${item.id})" title="删除">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        } else {
            historyList.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3h18v18H3zM7 7h10v10H7z"/>
                    </svg>
                    <p>暂无历史记录</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Load history error:', error);
    }
}

// 播放历史音频
function playHistoryAudio(audioUrl) {
    const player = document.getElementById('audioPlayer');
    player.src = audioUrl;
    player.play();
    
    // 切换到创作标签页并显示播放器
    document.querySelector('.nav-btn[data-tab="create"]').click();
    displayAudioPlayer(audioUrl);
}

// 下载历史音频
function downloadHistoryAudio(audioUrl, filename) {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('下载开始', 'success');
}

// 删除历史记录项
async function deleteHistoryItem(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }

    try {
        const response = await fetch(`/api/history/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('删除成功', 'success');
            loadHistory();
        } else {
            showToast(data.message || '删除失败', 'error');
        }
    } catch (error) {
        console.error('Delete history error:', error);
        showToast('删除失败，请稍后重试', 'error');
    }
}

// 清空历史记录
async function clearHistory() {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
        return;
    }

    try {
        const response = await fetch('/api/history', {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('历史记录已清空', 'success');
            loadHistory();
        } else {
            showToast(data.message || '清空失败', 'error');
        }
    } catch (error) {
        console.error('Clear history error:', error);
        showToast('清空失败，请稍后重试', 'error');
    }
}

// 加载用户信息
async function loadUserInfo() {
    try {
        const response = await fetch('/api/user/info');
        const data = await response.json();

        if (data.success && data.user) {
            document.getElementById('settingsEmail').textContent = data.user.email;
        }
    } catch (error) {
        console.error('Load user info error:', error);
    }
}

// 退出登录
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        window.location.href = '/logout';
    }
}

// 工具函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return '刚刚';
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)}小时前`;
    } else if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)}天前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

