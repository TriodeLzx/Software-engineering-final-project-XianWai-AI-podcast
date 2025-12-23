const podcast = {
    title: 'AI 创作者的自我修炼：从灵感到落地',
    desc: '聚焦「创作效率、结构化表达、协同讨论」三个维度，拆解如何用 AI 让播客从灵感到成片更高效、更有深度。',
    tags: ['AI 播客', '创作方法', '结构化思考', '协同讨论'],
    meta: { host: 'XIANWAI Studio', guest: 'AI Lab', duration: '42:16', publish: '2025/12/18', listens: '12.4k', saves: '3.1k' },
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    theme: '本期核心讨论如何将 AI 嵌入到播客创作流程：从主题发现、提纲拆分，到分段聚焦讨论与个性化推荐，帮助创作者与听众在同一条时间线上形成「可协作、可追踪」的知识沉淀。',
    takeaways: [
        '主旨：用结构化分段让 AI 与听众在同一上下文协同',
        '方法：每个分段都有可讨论的焦点问题与关键论点',
        '体验：听播行为反哺推荐，自动推送垂直深潜内容'
    ],
    segments: [
        { id: 'seg-1', title: '开场 & 主题主旨', start: '00:00', end: '04:35', summary: '阐述本期目标：AI 作为「第二制作人」，帮助创作者完成主题提炼与结构搭建。', focus: '为什么需要结构化的播客？', keywords: ['创作痛点', 'AI 角色', '结构化价值'] },
        { id: 'seg-2', title: '内容拆解方法', start: '04:36', end: '12:10', summary: '示例化拆解流程：主题 → 核心论点 → 分段问题 → 输出模版。', focus: '如何把宽泛主题拆成可讨论的块？', keywords: ['提纲', '论点', '模版'] },
        { id: 'seg-3', title: '协同讨论体验', start: '12:11', end: '24:20', summary: '听众点击分段即可与 AI/他人同步讨论，保留上下文，避免信息错位。', focus: '让讨论跟随时间轴展开', keywords: ['分段讨论', '上下文保持', '实时协同'] },
        { id: 'seg-4', title: '行为驱动推荐', start: '24:21', end: '35:10', summary: '利用收听偏好、关注作者与重点选择，推送垂直深化内容。', focus: '如何用行为信号做垂直推荐？', keywords: ['推荐', '偏好', '垂直扩展'] },
        { id: 'seg-5', title: '收束与行动项', start: '35:11', end: '42:16', summary: '总结行动建议：即刻选一个分段作为焦点，发起讨论或延伸阅读。', focus: '下一步行动怎么做？', keywords: ['总结', '行动', '实践'] }
    ],
    recommendations: [
        { title: '案例：3 天做完一档 AI 主题播客', meta: '制作流程 · 18 分钟 · 热度 2.3k' },
        { title: '模版包：主题拆解与分段提问集合', meta: '可下载 · 15 个模版 · 适配长/短节目' },
        { title: '讨论串：听众最关注的 7 个话题', meta: '实时更新 · 关注度 4.6k' }
    ],
    discussions: [
        { segmentId: 'seg-2', user: 'Nova', role: '听众', content: '能否分享一个把「AI 在教育」拆成 5 段的示例？', time: '2 分钟前' },
        { segmentId: 'seg-3', user: 'AI 助理', role: 'AI', content: '已为你锁定第 3 段，是否开启协同白板并邀请好友加入？', time: '5 分钟前' },
        { segmentId: 'seg-4', user: 'Chen', role: '听众', content: '偏好信号能否区分「浅听」与「深听」？', time: '12 分钟前' }
    ]
};

let activeSegment = podcast.segments[0].id;
const drawer = document.getElementById('discussionDrawer');
const drawerMask = document.getElementById('drawerMask');

document.addEventListener('DOMContentLoaded', () => {
    renderHero();
    renderSegments();
    renderAnalysis();
    renderBreakdown();
    renderRecommendations();
    renderDiscussion();
    bindAudio();
    bindDrawerControls();
});

function renderHero() {
    document.getElementById('podcastTitle').textContent = podcast.title;
    document.getElementById('podcastDesc').textContent = podcast.desc;

    const tags = document.getElementById('podcastTags');
    tags.innerHTML = podcast.tags.map(t => `<span class="tag">${t}</span>`).join('');

    const meta = document.getElementById('podcastMeta');
    meta.innerHTML = [
        `主持人：${podcast.meta.host}`,
        `嘉宾：${podcast.meta.guest}`,
        `时长：${podcast.meta.duration}`,
        `播放：${podcast.meta.listens}`,
        `收藏：${podcast.meta.saves}`
    ].map(t => `<span>${t}</span>`).join('·');
}

function renderSegments() {
    const list = document.getElementById('segmentList');
    list.innerHTML = podcast.segments.map(seg => `
        <div class="segment-item ${seg.id === activeSegment ? 'active' : ''}" data-id="${seg.id}" data-start="${seg.start}">
            <div class="segment-time">${seg.start}</div>
            <div class="segment-body">
                <div class="segment-title">${seg.title}</div>
                <div class="segment-desc">${seg.summary}</div>
                <div class="segment-meta">
                    <span class="chip">${seg.focus}</span>
                    ${seg.keywords.map(k => `<span class="chip gray">${k}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('.segment-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            activeSegment = id;
            highlightSegment();
            openDrawer(id);
            seekAudio(item.dataset.start);
        });
    });
}

function highlightSegment() {
    document.querySelectorAll('.segment-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === activeSegment);
    });
}

function renderAnalysis() {
    document.getElementById('analysisTheme').textContent = podcast.theme;
    document.getElementById('takeawayList').innerHTML = podcast.takeaways.map(t => `<span class="chip">${t}</span>`).join('');
}

function renderBreakdown() {
    const container = document.getElementById('breakdownList');
    container.innerHTML = podcast.segments.map(seg => `
        <div class="breakdown-item">
            <div class="breakdown-title">${seg.title}</div>
            <div class="breakdown-meta">${seg.start} - ${seg.end}</div>
            <div class="segment-desc">${seg.summary}</div>
            <div class="breakdown-actions">
                <span class="chip">${seg.focus}</span>
                ${seg.keywords.map(k => `<span class="chip gray">${k}</span>`).join('')}
                <button class="btn ghost" data-id="${seg.id}">进入讨论</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('button[data-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            activeSegment = btn.dataset.id;
            highlightSegment();
            openDrawer(activeSegment);
        });
    });
}

function renderRecommendations() {
    const container = document.getElementById('recommendList');
    container.innerHTML = podcast.recommendations.map(r => `
        <div class="recommend-item">
            <h4>${r.title}</h4>
            <div class="meta">${r.meta}</div>
        </div>
    `).join('');
}

function renderDiscussion() {
    const container = document.getElementById('discussionList');
    container.innerHTML = podcast.discussions.map(d => `
        <div class="discussion-bubble">
            <strong>${lookupSegmentTitle(d.segmentId)}</strong> · ${d.user} (${d.role})
            <div>${d.content}</div>
            <div class="meta">${d.time}</div>
        </div>
    `).join('');
}

function bindAudio() {
    const audio = document.getElementById('mainAudio');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const playBtn = document.getElementById('playMainBtn');

    audio.src = podcast.audioUrl;
    playBtn.addEventListener('click', () => audio.play());

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    });
}

function bindDrawerControls() {
    document.getElementById('openDiscussionBtn').addEventListener('click', () => openDrawer(activeSegment));
    document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);
    drawerMask.addEventListener('click', closeDrawer);
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
}

function openDrawer(segmentId) {
    const seg = podcast.segments.find(s => s.id === segmentId);
    if (!seg) return;
    document.getElementById('drawerTitle').textContent = seg.title;
    document.getElementById('drawerMeta').textContent = `${seg.start} - ${seg.end} · ${seg.focus}`;
    document.getElementById('drawerSummary').textContent = seg.summary;

    renderDrawerMessages(segmentId);
    drawer.classList.add('open');
    drawerMask.classList.add('show');
    activeSegment = segmentId;
    highlightSegment();
}

function closeDrawer() {
    drawer.classList.remove('open');
    drawerMask.classList.remove('show');
}

function renderDrawerMessages(segmentId) {
    const container = document.getElementById('drawerMessages');
    const messages = podcast.discussions.filter(d => d.segmentId === segmentId);
    if (messages.length === 0) {
        container.innerHTML = '<div class="message">还没有讨论，来发表第一个想法吧。</div>';
        return;
    }
    container.innerHTML = messages.map(m => `
        <div class="message">
            <div class="meta">${m.user} · ${m.role} · ${m.time}</div>
            <div>${m.content}</div>
        </div>
    `).join('');
}

function sendMessage() {
    const input = document.getElementById('drawerInput');
    const content = input.value.trim();
    if (!content) return;
    podcast.discussions.unshift({
        segmentId: activeSegment,
        user: '你',
        role: '听众',
        content,
        time: '刚刚'
    });
    input.value = '';
    renderDrawerMessages(activeSegment);
    renderDiscussion();
}

function seekAudio(startStr) {
    const audio = document.getElementById('mainAudio');
    const seconds = parseTimeToSeconds(startStr);
    if (!isNaN(seconds)) {
        audio.currentTime = seconds;
        audio.play();
    }
}

function parseTimeToSeconds(str) {
    const [m, s] = str.split(':').map(Number);
    if (isNaN(m) || isNaN(s)) return 0;
    return m * 60 + s;
}

function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function lookupSegmentTitle(id) {
    const seg = podcast.segments.find(s => s.id === id);
    return seg ? seg.title : '未命名分段';
}

function handleLogout() {
    window.location.href = '/logout';
}
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

