class VolumeDetector {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isMonitoring = false;
        this.animationId = null;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.dbValue = document.querySelector('.db-value');
        this.meterFill = document.querySelector('.meter-fill');
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.querySelector('.status-text');
        this.canvas = document.getElementById('visualizer');
        this.ctx = this.canvas.getContext('2d');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.toggleMonitoring());
    }

    async toggleMonitoring() {
        if (this.isMonitoring) {
            this.stopMonitoring();
        } else {
            await this.startMonitoring();
        }
    }

    async startMonitoring() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            
            this.microphone.connect(this.analyser);
            
            this.isMonitoring = true;
            this.updateUI();
            this.animate();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.statusText.textContent = 'Microphone access denied';
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.microphone) {
            this.microphone.disconnect();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.updateUI();
        this.dbValue.textContent = '--';
        this.meterFill.style.width = '0%';
        this.clearCanvas();
    }

    updateUI() {
        if (this.isMonitoring) {
            this.startBtn.innerHTML = '<span>Stop Monitoring</span>';
            this.statusDot.classList.add('active');
            this.statusText.textContent = 'Monitoring...';
        } else {
            this.startBtn.innerHTML = '<span>Start Monitoring</span>';
            this.statusDot.classList.remove('active');
            this.statusText.textContent = 'Click to start';
        }
    }

    animate() {
        if (!this.isMonitoring) return;

        this.analyser.getByteFrequencyData(this.dataArray);
        
        const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
        const db = this.convertToDb(average);
        
        this.updateMeter(db);
        this.updateVisualizer();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    convertToDb(value) {
        return Math.round((value / 255) * 120);
    }

    updateMeter(db) {
        this.dbValue.textContent = db;
        
        const percentage = (db / 120) * 100;
        this.meterFill.style.width = `${Math.min(percentage, 100)}%`;
        
        // Dynamic color based on level
        if (db > 90) {
            this.meterFill.style.filter = 'hue-rotate(0deg)';
        } else if (db > 60) {
            this.meterFill.style.filter = 'hue-rotate(30deg)';
        } else {
            this.meterFill.style.filter = 'hue-rotate(120deg)';
        }
    }

    updateVisualizer() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const barWidth = this.canvas.width / this.dataArray.length;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const barHeight = (this.dataArray[i] / 255) * this.canvas.height;
            
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(0.5, '#fbbf24');
            gradient.addColorStop(1, '#ef4444');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(i * barWidth, this.canvas.height - barHeight, barWidth - 1, barHeight);
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Initialize the app
new VolumeDetector();

