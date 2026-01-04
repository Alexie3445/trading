class DashboardManager {
    constructor() {
        this.userData = null;
        this.positions = [];
        this.trades = [];
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    async loadUserData() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                this.userData = userDoc.data();
                this.updateDashboardUI();
                this.loadPositions();
                this.loadTradeHistory();
                this.loadPromoInfo();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    updateDashboardUI() {
        if (!this.userData) return;

        // Update balance display
        const balance = this.userData.balance || 0;
        const equity = this.userData.equity || balance;
        const pnl = equity - balance;

        document.getElementById('availableBalance').innerHTML = 
            `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        document.getElementById('equityValue').innerHTML = 
            `$${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        const pnlElement = document.getElementById('profitLoss');
        pnlElement.innerHTML = 
            `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        pnlElement.style.color = pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
        
        // Update account status
        const statusElement = document.getElementById('accountStatus');
        statusElement.innerHTML = 
            `<span class="status-badge success">Verified</span>`;
        
        // Update balance in nav
        document.getElementById('balanceDisplay').textContent = 
            `$${balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
    }

    async loadPositions() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const snapshot = await db.collection('positions')
                .where('userId', '==', user.uid)
                .where('status', '==', 'open')
                .orderBy('openedAt', 'desc')
                .get();

            this.positions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.updatePositionsTable();
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    }

    updatePositionsTable() {
        const table = document.getElementById('positionsTable');
        if (!table) return;

        if (this.positions.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        No open positions
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = this.positions.map(position => `
            <tr>
                <td>${position.pair}</td>
                <td>
                    <span style="color: ${position.side === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'};">
                        ${position.side === 'buy' ? 'LONG' : 'SHORT'}
                    </span>
                </td>
                <td>${position.size}</td>
                <td>$${position.entryPrice.toFixed(2)}</td>
                <td>$${position.currentPrice.toFixed(2)}</td>
                <td style="color: ${position.pnl >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    ${position.pnl >= 0 ? '+' : ''}$${position.pnl.toFixed(2)}
                </td>
                <td>
                    <button onclick="dashboardManager.closePosition('${position.id}')" 
                            class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;">
                        Close
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadTradeHistory() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const snapshot = await db.collection('trades')
                .where('userId', '==', user.uid)
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            this.trades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.updateTradeHistory();
        } catch (error) {
            console.error('Error loading trade history:', error);
        }
    }

    updateTradeHistory() {
        const container = document.getElementById('tradeHistory');
        if (!container) return;

        container.innerHTML = this.trades.map(trade => `
            <div style="padding: 10px 0; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between;">
                    <span style="font-weight: 500; color: ${trade.side === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'}">
                        ${trade.side.toUpperCase()} ${trade.pair}
                    </span>
                    <span style="font-size: 12px; color: var(--text-secondary);">
                        ${new Date(trade.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                    ${trade.size} @ $${trade.price.toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    async loadPromoInfo() {
        const user = auth.currentUser;
        if (!user || !this.userData) return;

        const container = document.getElementById('promoInfo');
        if (!container) return;

        const promoType = this.userData.promoType;
        const amount = this.userData.balance || 0;

        let message = '';
        if (promoType === 'first_5_bonus') {
            message = `🎉 Congratulations! You were among the first 5 registrations and received a $10,000 bonus.`;
        } else {
            message = `You received a $1,000 welcome bonus.`;
        }

        container.innerHTML = `
            <div style="padding: 15px; background: rgba(240, 185, 11, 0.1); border-radius: var(--radius);">
                <div style="color: var(--accent-orange); margin-bottom: 8px; font-weight: 500;">
                    ${promoType === 'first_5_bonus' ? 'VIP Bonus' : 'Welcome Bonus'}
                </div>
                <div style="font-size: 24px; font-weight: 600; color: var(--accent-green); margin-bottom: 8px;">
                    $${amount.toLocaleString()}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">
                    ${message}
                </div>
            </div>
        `;
    }

    async closePosition(positionId) {
        if (!confirm('Are you sure you want to close this position?')) return;

        try {
            const position = this.positions.find(p => p.id === positionId);
            if (!position) return;

            // Update position status
            await db.collection('positions').doc(positionId).update({
                status: 'closed',
                closedAt: firebase.firestore.FieldValue.serverTimestamp(),
                closePrice: position.currentPrice
            });

            // Update user balance
            const newBalance = (this.userData.balance || 0) + position.pnl;
            await db.collection('users').doc(auth.currentUser.uid).update({
                balance: newBalance,
                equity: newBalance,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Record trade
            await db.collection('trades').add({
                userId: auth.currentUser.uid,
                type: 'position_close',
                pair: position.pair,
                side: position.side === 'buy' ? 'sell' : 'buy',
                size: position.size,
                price: position.currentPrice,
                pnl: position.pnl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Reload data
            await this.loadUserData();
            await this.loadPositions();

        } catch (error) {
            console.error('Error closing position:', error);
            alert('Failed to close position. Please try again.');
        }
    }

    setupEventListeners() {
        // Trading pair selection
        document.querySelectorAll('.pair-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pair-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const pair = btn.dataset.pair;
                document.getElementById('currentPair').textContent = pair.split('/')[0];
                
                // Update chart with new pair
                if (window.chartManager) {
                    window.chartManager.loadChart(pair);
                }
            });
        });

        // Trade type selection
        document.querySelectorAll('.trade-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.trade-type-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = '';
                    b.style.borderColor = '';
                });
                
                btn.classList.add('active');
                if (btn.dataset.type === 'buy') {
                    btn.style.background = 'var(--accent-green)';
                    btn.style.borderColor = 'var(--accent-green)';
                } else {
                    btn.style.background = 'var(--accent-red)';
                    btn.style.borderColor = 'var(--accent-red)';
                }
            });
        });

        // Amount input updates estimated cost
        document.getElementById('tradeAmount')?.addEventListener('input', this.updateEstimatedCost.bind(this));
        document.getElementById('leverage')?.addEventListener('change', this.updateEstimatedCost.bind(this));
    }

    updateEstimatedCost() {
        const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
        const leverage = parseInt(document.getElementById('leverage').value) || 1;
        const cost = amount * leverage;
        
        document.getElementById('estimatedCost').textContent = 
            `$${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        if (this.userData) {
            const available = this.userData.balance || 0;
            document.getElementById('availableForTrade').textContent = 
                `$${available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            // Disable trade if insufficient funds
            const tradeBtn = document.getElementById('executeTrade');
            if (cost > available) {
                tradeBtn.disabled = true;
                tradeBtn.textContent = 'Insufficient Funds';
            } else {
                tradeBtn.disabled = false;
                tradeBtn.textContent = 'Execute Trade';
            }
        }
    }

    startRealTimeUpdates() {
        // Real-time balance updates
        const user = auth.currentUser;
        if (!user) return;

        db.collection('users').doc(user.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this.userData = doc.data();
                    this.updateDashboardUI();
                }
            });

        // Real-time positions updates
        db.collection('positions')
            .where('userId', '==', user.uid)
            .where('status', '==', 'open')
            .onSnapshot((snapshot) => {
                this.positions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this.updatePositionsTable();
            });
    }
}

// Initialize dashboard manager
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        dashboardManager = new DashboardManager();
    }
});