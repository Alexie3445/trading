class ChartManager {
    constructor() {
        this.chart = null;
        this.candlestickSeries = null;
        this.currentPair = 'BTC/USDT';
        this.init();
    }

    init() {
        this.createChart();
        this.loadChart(this.currentPair);
        this.setupEventListeners();
    }

    createChart() {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;

        this.chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                background: { color: 'transparent' },
                textColor: '#9298A9',
            },
            grid: {
                vertLines: { color: '#2D313D' },
                horzLines: { color: '#2D313D' },
            },
            rightPriceScale: {
                borderColor: '#2D313D',
            },
            timeScale: {
                borderColor: '#2D313D',
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
        });

        this.candlestickSeries = this.chart.addCandlestickSeries({
            upColor: '#02C076',
            downColor: '#F6465D',
            borderVisible: false,
            wickUpColor: '#02C076',
            wickDownColor: '#F6465D',
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: chartContainer.clientWidth,
            });
        });
    }

    async loadChart(pair) {
        this.currentPair = pair;
        
        // Show loading
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="loader" style="margin: 180px auto;"></div>';
        }

        // Generate sample data based on pair
        const data = this.generateCandlestickData(pair);
        
        if (this.candlestickSeries) {
            this.candlestickSeries.setData(data);
        }

        // Update chart title
        const title = document.querySelector('#chartContainer').previousElementSibling.querySelector('h3');
        if (title) {
            title.textContent = `${pair} Chart`;
        }
    }

    generateCandlestickData(pair) {
        const basePrice = this.getBasePrice(pair);
        const data = [];
        const now = Math.floor(Date.now() / 1000);
        
        for (let i = 100; i >= 0; i--) {
            const time = now - i * 300; // 5-minute intervals
            
            let open, close, high, low;
            
            if (i === 0) {
                // Current candle
                const currentPrice = tradingManager ? tradingManager.getCurrentPrice(pair) : basePrice;
                const change = (Math.random() - 0.5) * 0.02;
                open = currentPrice * (1 - change);
                close = currentPrice;
                high = Math.max(open, close) * (1 + Math.random() * 0.01);
                low = Math.min(open, close) * (1 - Math.random() * 0.01);
            } else {
                // Historical candles
                const base = basePrice * (1 + (Math.random() - 0.5) * 0.1);
                const change = (Math.random() - 0.5) * 0.02;
                open = base;
                close = base * (1 + change);
                high = Math.max(open, close) * (1 + Math.random() * 0.01);
                low = Math.min(open, close) * (1 - Math.random() * 0.01);
            }
            
            data.push({
                time: time,
                open: open,
                high: high,
                low: low,
                close: close,
            });
        }
        
        return data;
    }

    getBasePrice(pair) {
        const prices = {
            'BTC/USDT': 68421.50,
            'ETH/USDT': 3812.45,
            'EUR/USD': 1.0824,
            'NAS100': 18245.30
        };
        return prices[pair] || 100;
    }

    updatePrice(price) {
        if (!this.candlestickSeries) return;
        
        const data = this.candlestickSeries.data();
        if (data.length > 0) {
            const lastCandle = data[data.length - 1];
            const newCandle = {
                ...lastCandle,
                close: price,
                high: Math.max(lastCandle.high, price),
                low: Math.min(lastCandle.low, price),
            };
            
            // Update last candle
            this.candlestickSeries.update(newCandle);
        }
    }

    setupEventListeners() {
        // Timeframe selector
        const timeframeSelect = document.getElementById('timeframe');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', () => {
                this.loadChart(this.currentPair);
            });
        }

        // Refresh chart button
        const refreshBtn = document.getElementById('refreshChart');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadChart(this.currentPair);
            });
        }
    }
}

// Initialize chart manager
let chartManager;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        chartManager = new ChartManager();
        window.chartManager = chartManager;
    }
});