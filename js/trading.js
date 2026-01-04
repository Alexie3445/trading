class TradingManager {
    constructor() {
        this.currentPair = 'BTC/USDT';
        this.currentPrices = {
            'BTC/USDT': 68421.50,
            'ETH/USDT': 3812.45,
            'EUR/USD': 1.0824,
            'NAS100': 18245.30
        };
        this.priceChanges = {
            'BTC/USDT': 2.34,
            'ETH/USDT': 1.78,
            'EUR/USD': -0.45,
            'NAS100': 0.89
        };
        
        this.init();
    }

    init() {
        this.setupTradeExecution();
        this.startPriceUpdates();
    }

    setupTradeExecution() {
        const tradeBtn = document.getElementById('executeTrade');
        if (tradeBtn) {
            tradeBtn.addEventListener('click', () => this.executeTrade());
        }
    }

    async executeTrade() {
        const user = auth.currentUser;
        if (!user) return;

        const amount = parseFloat(document.getElementById('tradeAmount').value);
        const leverage = parseInt(document.getElementById('leverage').value);
        const tradeType = document.querySelector('.trade-type-btn.active')?.dataset.type;
        const pair = document.querySelector('.pair-btn.active')?.dataset.pair;

        if (!amount || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        if (!tradeType || !pair) {
            alert('Please select trade type and pair');
            return;
        }

        const totalCost = amount * leverage;
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();

        if (totalCost > userData.balance) {
            alert('Insufficient funds');
            return;
        }

        // Show loading
        const tradeBtn = document.getElementById('executeTrade');
        const originalText = tradeBtn.textContent;
        tradeBtn.innerHTML = '<span class="loader"></span> Processing...';
        tradeBtn.disabled = true;

        try {
            const currentPrice = this.currentPrices[pair];
            const stopLoss = currentPrice * (tradeType === 'buy' ? 0.95 : 1.05);
            const takeProfit = currentPrice * (tradeType === 'buy' ? 1.05 : 0.95);

            // Create position
            const positionRef = await db.collection('positions').add({
                userId: user.uid,
                pair: pair,
                side: tradeType,
                size: amount,
                leverage: leverage,
                entryPrice: currentPrice,
                currentPrice: currentPrice,
                stopLoss: stopLoss,
                takeProfit: takeProfit,
                pnl: 0,
                status: 'open',
                openedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Record trade
            await db.collection('trades').add({
                userId: user.uid,
                type: 'position_open',
                pair: pair,
                side: tradeType,
                size: amount,
                leverage: leverage,
                price: currentPrice,
                positionId: positionRef.id,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update user balance (deduct margin)
            const newBalance = userData.balance - totalCost;
            await db.collection('users').doc(user.uid).update({
                balance: newBalance,
                equity: newBalance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Reset form
            document.getElementById('tradeAmount').value = '';
            this.updateEstimatedCost();

            // Show success message
            alert(`Trade executed successfully!\n${tradeType.toUpperCase()} ${amount} ${pair} @ $${currentPrice.toFixed(2)}`);

        } catch (error) {
            console.error('Trade execution error:', error);
            alert('Trade execution failed. Please try again.');
        } finally {
            tradeBtn.textContent = originalText;
            tradeBtn.disabled = false;
        }
    }

    startPriceUpdates() {
        // Simulate real-time price updates
        setInterval(() => {
            Object.keys(this.currentPrices).forEach(pair => {
                const changePercent = this.priceChanges[pair];
                const current = this.currentPrices[pair];
                const randomChange = (Math.random() - 0.5) * 0.1;
                const newPrice = current * (1 + randomChange / 100);
                
                this.currentPrices[pair] = newPrice;
                this.priceChanges[pair] = changePercent + randomChange;
                
                // Update UI if this pair is active
                const activePair = document.querySelector('.pair-btn.active')?.dataset.pair;
                if (activePair === pair && window.chartManager) {
                    window.chartManager.updatePrice(newPrice);
                }
            });
        }, 3000);
    }

    getCurrentPrice(pair) {
        return this.currentPrices[pair] || 0;
    }

    getPriceChange(pair) {
        return this.priceChanges[pair] || 0;
    }
}

// Initialize trading manager
let tradingManager;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        tradingManager = new TradingManager();
    }
});