class ProfileManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadProfileData();
        await this.loadActivity();
    }

    async loadProfileData() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                this.updateProfileUI(data);
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }

    updateProfileUI(data) {
        // Basic info
        document.getElementById('profileName').textContent = data.fullName || 'N/A';
        document.getElementById('profileEmail').textContent = data.email || 'N/A';
        document.getElementById('profilePhone').textContent = data.phone || 'N/A';
        document.getElementById('profileCountry').textContent = data.country || 'N/A';
        document.getElementById('profileAddress').textContent = data.address || 'N/A';

        // Stats
        document.getElementById('accountCreated').textContent = 
            data.registrationDate?.toDate().toLocaleDateString() || 'N/A';
        
        document.getElementById('registrationOrder').textContent = 
            data.registrationOrder ? `#${data.registrationOrder}` : 'N/A';
        
        document.getElementById('promoType').textContent = 
            data.promoType === 'first_5_bonus' ? 'VIP Bonus ($10,000)' : 'Standard Bonus ($1,000)';
        
        document.getElementById('accountStatus').innerHTML = 
            `<span class="status-badge success">Verified</span>`;
    }

    async loadActivity() {
        const user = auth.currentUser;
        if (!user) return;

        try {
            // Load recent transactions
            const snapshot = await db.collection('transactions')
                .where('userId', '==', user.uid)
                .orderBy('timestamp', 'desc')
                .limit(10)
                .get();

            const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.updateActivityTable(activities);
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    }

    updateActivityTable(activities) {
        const table = document.getElementById('activityTable');
        if (!table) return;

        if (activities.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        No recent activity
                    </td>
                </tr>
            `;
            return;
        }

        table.innerHTML = activities.map(activity => `
            <tr>
                <td>${activity.timestamp?.toDate().toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${activity.status === 'completed' ? 'success' : 'pending'}">
                        ${activity.type.replace('_', ' ').toUpperCase()}
                    </span>
                </td>
                <td>${this.getActivityDescription(activity)}</td>
                <td style="color: ${activity.amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
                    ${activity.amount >= 0 ? '+' : ''}$${Math.abs(activity.amount).toFixed(2)}
                </td>
            </tr>
        `).join('');
    }

    getActivityDescription(activity) {
        switch (activity.type) {
            case 'promo_credit':
                return activity.promoType === 'first_5_bonus' 
                    ? 'VIP Registration Bonus' 
                    : 'Welcome Bonus';
            case 'trade_execution':
                return `${activity.side} ${activity.pair}`;
            default:
                return activity.type;
        }
    }
}

// Initialize profile manager
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('profile.html')) {
        new ProfileManager();
    }
});