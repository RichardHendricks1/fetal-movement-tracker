// 胎动记录应用
class FetalMovementTracker {
    constructor() {
        this.initializeElements();
        this.loadFromStorage();
        this.bindEvents();
        this.renderStats();
        this.renderHistory();
        this.updateTimer();
    }

    // 初始化DOM元素引用
    initializeElements() {
        this.kickButton = document.getElementById('kickButton');
        this.startSessionBtn = document.getElementById('startSessionBtn');
        this.stopSessionBtn = document.getElementById('stopSessionBtn');
        this.resetSessionBtn = document.getElementById('resetSessionBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');

        this.todayCount = document.getElementById('todayCount');
        this.sessionCount = document.getElementById('sessionCount');
        this.sessionDuration = document.getElementById('sessionDuration');
        this.hourlyAverage = document.getElementById('hourlyAverage');

        this.historyList = document.getElementById('historyList');
    }

    // 从localStorage加载数据
    loadFromStorage() {
        const saved = localStorage.getItem('fetal_movement_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.sessions = data.sessions || [];
            this.activeSession = data.activeSession || null;
        } else {
            this.sessions = [];
            this.activeSession = null;
        }
    }

    // 保存数据到localStorage
    saveToStorage() {
        localStorage.setItem('fetal_movement_data', JSON.stringify({
            sessions: this.sessions,
            activeSession: this.activeSession
        }));
    }

    // 绑定事件
    bindEvents() {
        this.kickButton.addEventListener('click', () => this.recordKick());
        this.startSessionBtn.addEventListener('click', () => this.startSession());
        this.stopSessionBtn.addEventListener('click', () => this.stopSession());
        this.resetSessionBtn.addEventListener('click', () => this.resetSession());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // 键盘快捷键（空格键）
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
                e.preventDefault();
                this.recordKick();
            }
        });
    }

    // 记录胎动
    recordKick() {
        if (!this.activeSession) {
            if (!confirm('请先开始记录会话')) {
                return;
            }
            this.startSession();
        }

        this.activeSession.kicks.push(new Date().toISOString());
        this.saveToStorage();
        this.renderStats();

        // 按钮动画效果
        this.kickButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.kickButton.style.transform = 'scale(1)';
        }, 100);
    }

    // 开始记录会话
    startSession() {
        if (this.activeSession) return;

        this.activeSession = {
            id: this.generateId(),
            startTime: new Date().toISOString(),
            endTime: null,
            kicks: []
        };

        this.saveToStorage();
        this.updateButtonStates();
        this.startTimer();
    }

    // 结束记录会话
    stopSession() {
        if (!this.activeSession) return;

        this.activeSession.endTime = new Date().toISOString();
        this.sessions.push(this.activeSession);
        this.activeSession = null;

        this.saveToStorage();
        this.updateButtonStates();
        this.renderStats();
        this.renderHistory();
        this.stopTimer();

        // 显示结束提示
        const lastSession = this.sessions[this.sessions.length - 1];
        alert(`🎉 记录完成！\n\n本次胎动：${lastSession.kicks.length} 次\n时长：${this.calculateDuration(lastSession)}`);
    }

    // 重置本次记录
    resetSession() {
        if (!this.activeSession) return;

        if (!confirm('确定要重置本次记录吗？')) return;

        this.activeSession = null;
        this.saveToStorage();
        this.updateButtonStates();
        this.renderStats();
        this.stopTimer();
    }

    // 清空历史记录
    clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？')) return;

        this.sessions = [];
        this.activeSession = null;
        this.saveToStorage();
        this.renderStats();
        this.renderHistory();
        this.stopTimer();
        this.updateButtonStates();
    }

    // 更新按钮状态
    updateButtonStates() {
        if (this.activeSession) {
            this.startSessionBtn.style.display = 'none';
            this.stopSessionBtn.style.display = 'flex';
            this.kickButton.disabled = false;
        } else {
            this.startSessionBtn.style.display = 'flex';
            this.stopSessionBtn.style.display = 'none';
            this.kickButton.disabled = true;
        }
    }

    // 开始计时器
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    // 停止计时器
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // 更新计时器显示
    updateTimer() {
        if (this.activeSession) {
            const duration = this.getSessionDuration();
            this.sessionDuration.textContent = this.formatDuration(duration);
        } else {
            this.sessionDuration.textContent = '00:00';
        }
    }

    // 获取当前会话时长（秒）
    getSessionDuration() {
        if (!this.activeSession) return 0;
        const startTime = new Date(this.activeSession.startTime);
        const now = new Date();
        return Math.floor((now - startTime) / 1000);
    }

    // 计算会话时长（分钟）
    calculateDuration(session) {
        const start = new Date(session.startTime);
        const end = session.endTime ? new Date(session.endTime) : new Date();
        const duration = Math.floor((end - start) / 1000 / 60);
        return `${duration} 分钟`;
    }

    // 渲染统计数据
    renderStats() {
        // 今日胎动总数
        const today = new Date().toDateString();
        const todayKicks = this.sessions
            .filter(session => new Date(session.startTime).toDateString() === today)
            .reduce((total, session) => total + session.kicks.length, 0);
        
        if (this.activeSession && new Date(this.activeSession.startTime).toDateString() === today) {
            todayKicks += this.activeSession.kicks.length;
        }

        this.todayCount.textContent = todayKicks;

        // 本次会话胎动数
        this.sessionCount.textContent = this.activeSession ? this.activeSession.kicks.length : 0;

        // 计算平均每小时胎动数
        const totalKicks = this.sessions.reduce((total, session) => total + session.kicks.length, 0);
        const totalDuration = this.sessions.reduce((total, session) => {
            const start = new Date(session.startTime);
            const end = new Date(session.endTime);
            return total + (end - start) / (1000 * 60 * 60); // 小时
        }, 0);

        const average = totalDuration > 0 ? (totalKicks / totalDuration).toFixed(1) : 0;
        this.hourlyAverage.textContent = average;
    }

    // 渲染历史记录
    renderHistory() {
        if (this.sessions.length === 0) {
            this.historyList.innerHTML = `
                <div class="empty-history">
                    <div class="empty-icon">📝</div>
                    <p>还没有记录<br>点击"开始记录"开始第一次记录</p>
                </div>
            `;
            return;
        }

        // 按开始时间倒序排列
        const sortedSessions = [...this.sessions].reverse();

        this.historyList.innerHTML = sortedSessions.map(session => {
            const startTime = new Date(session.startTime);
            const endTime = session.endTime ? new Date(session.endTime) : new Date();
            
            const dateStr = startTime.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
            });

            const timeStr = startTime.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const endTimeStr = endTime.toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const duration = this.calculateDuration(session);

            return `
                <div class="history-item">
                    <div class="history-time">
                        <div class="history-time-main">${dateStr} ${timeStr} - ${endTimeStr}</div>
                        <div class="history-time-detail">时长：${duration}</div>
                    </div>
                    <div class="history-count">${session.kicks.length}</div>
                </div>
            `;
        }).join('');
    }

    // 格式化时长（秒 -> mm:ss）
    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new FetalMovementTracker();
});
