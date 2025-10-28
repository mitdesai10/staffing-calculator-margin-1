// ========================================
// Global State
// ========================================

let positions = [];
let positionIdCounter = 0;

// ========================================
// Initialize Application
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App initializing...');
    setTimeout(initializeApp, 500);
});

function onDataLoaded() {
    console.log('✅ Data loaded callback');
    populateRoles();
}

function initializeApp() {
    console.log('🔧 Setting up app...');
    populateRoles();
    setupEventListeners();
    console.log('✅ App ready!');
}

function populateRoles() {
    const roleSelect = document.getElementById('role');
    if (!roleSelect) {
        console.error('❌ Role select not found');
        return;
    }
    
    // Clear existing options (except first)
    while (roleSelect.options.length > 1) {
        roleSelect.remove(1);
    }
    
    if (rateCardData && rateCardData.length > 0) {
        rateCardData.forEach(role => {
            const option = document.createElement('option');
            option.value = role.role;
            option.textContent = role.role;
            roleSelect.appendChild(option);
        });
        console.log(`✅ ${rateCardData.length} roles loaded`);
    } else {
        console.warn('⚠️ No rate card data');
    }
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Role selection - update location costs
    const roleSelect = document.getElementById('role');
    if (roleSelect) {
        roleSelect.addEventListener('change', updateLocationCosts);
    }
    
    // Form submission
    const form = document.getElementById('positionForm');
    if (form) {
        form.addEventListener('submit', handleAddPosition);
    }
    
    // Clear all button
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearAll);
    }
    
    // Live preview - watch all inputs
    const inputs = ['role', 'hours', 'clientRate'];
    const locationRadios = document.querySelectorAll('input[name="location"]');
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateLivePreview);
        }
    });
    
    locationRadios.forEach(radio => {
        radio.addEventListener('change', updateLivePreview);
    });
    
    console.log('✅ Event listeners attached');
}

// ========================================
// Update Location Costs
// ========================================

function updateLocationCosts() {
    const roleSelect = document.getElementById('role');
    const selectedRole = roleSelect.value;
    
    if (!selectedRole) {
        document.getElementById('onshoreRate').textContent = 'Select role first';
        document.getElementById('offshoreRate').textContent = 'Select role first';
        document.getElementById('nearshoreRate').textContent = 'Select role first';
        return;
    }
    
    const roleData = rateCardData.find(r => r.role === selectedRole);
    if (!roleData) {
        console.error('❌ Role data not found:', selectedRole);
        return;
    }
    
    document.getElementById('onshoreRate').textContent = `Cost: ${formatCurrency(roleData.onshore.cost)}/hr`;
    document.getElementById('offshoreRate').textContent = `Cost: ${formatCurrency(roleData.offshore.cost)}/hr`;
    document.getElementById('nearshoreRate').textContent = `Cost: ${formatCurrency(roleData.nearshore.cost)}/hr`;
    
    updateLivePreview();
}

// ========================================
// Live Preview
// ========================================

function updateLivePreview() {
    const livePreview = document.getElementById('livePreview');
    const roleSelect = document.getElementById('role');
    const hoursInput = document.getElementById('hours');
    const clientRateInput = document.getElementById('clientRate');
    const selectedLocation = document.querySelector('input[name="location"]:checked');
    
    // Check if all fields are filled
    if (!roleSelect.value || !hoursInput.value || !clientRateInput.value || !selectedLocation) {
        livePreview.style.display = 'none';
        return;
    }
    
    const role = roleSelect.value;
    const hours = parseFloat(hoursInput.value);
    const clientRate = parseFloat(clientRateInput.value);
    const location = selectedLocation.value;
    
    if (isNaN(hours) || isNaN(clientRate) || hours <= 0 || clientRate <= 0) {
        livePreview.style.display = 'none';
        return;
    }
    
    const roleData = rateCardData.find(r => r.role === role);
    if (!roleData) return;
    
    const cost = roleData[location].cost;
    const revenue = hours * clientRate;
    const totalCost = hours * cost;
    const profit = revenue - totalCost;
    const margin = cost > 0 ? ((clientRate - cost) / clientRate) * 100 : 0;
    
    // Update preview
    document.getElementById('previewCost').textContent = formatCurrency(totalCost);
    document.getElementById('previewRevenue').textContent = formatCurrency(revenue);
    document.getElementById('previewProfit').textContent = formatCurrency(profit);
    
    const marginValue = document.querySelector('#previewMargin .margin-value');
    marginValue.textContent = `${margin.toFixed(1)}%`;
    
    const previewMargin = document.getElementById('previewMargin');
    previewMargin.className = 'preview-margin';
    if (margin >= 70) {
        previewMargin.classList.add('excellent');
    } else if (margin >= 55) {
        previewMargin.classList.add('good');
    } else if (margin >= 40) {
        previewMargin.classList.add('warning');
    } else {
        previewMargin.classList.add('danger');
    }
    
    livePreview.style.display = 'block';
}

// ========================================
// Handle Add Position
// ========================================

function handleAddPosition(e) {
    e.preventDefault();
    console.log('➕ Adding position...');
    
    try {
        const roleSelect = document.getElementById('role');
        const hoursInput = document.getElementById('hours');
        const clientRateInput = document.getElementById('clientRate');
        const selectedLocation = document.querySelector('input[name="location"]:checked');
        
        // Validation
        if (!roleSelect.value) {
            alert('❌ Please select a Role');
            return;
        }
        if (!hoursInput.value || parseFloat(hoursInput.value) <= 0) {
            alert('❌ Please enter valid Hours');
            return;
        }
        if (!clientRateInput.value || parseFloat(clientRateInput.value) <= 0) {
            alert('❌ Please enter valid Client Rate');
            return;
        }
        if (!selectedLocation) {
            alert('❌ Please select a Location');
            return;
        }
        
        const role = roleSelect.value;
        const hours = parseFloat(hoursInput.value);
        const clientRate = parseFloat(clientRateInput.value);
        const location = selectedLocation.value;
        
        const roleData = rateCardData.find(r => r.role === role);
        if (!roleData) {
            alert('❌ Role data not found');
            return;
        }
        
        const cost = roleData[location].cost;
        const revenue = hours * clientRate;
        const totalCost = hours * cost;
        const profit = revenue - totalCost;
        const margin = cost > 0 ? ((clientRate - cost) / clientRate) * 100 : 0;
        
        const position = {
            id: ++positionIdCounter,
            role,
            hours,
            location,
            cost,
            clientRate,
            revenue,
            totalCost,
            profit,
            margin
        };
        
        positions.push(position);
        console.log('✅ Position added:', position);
        
        renderPositions();
        updateSummary();
        updateMarginTracker();
        
        // Reset form
        roleSelect.value = '';
        hoursInput.value = '';
        clientRateInput.value = '';
        document.querySelectorAll('input[name="location"]').forEach(r => r.checked = false);
        updateLocationCosts();
        document.getElementById('livePreview').style.display = 'none';
        
        // Show results, hide placeholder
        document.getElementById('resultsPlaceholder').style.display = 'none';
        document.getElementById('marginTracker').style.display = 'block';
        document.getElementById('positionsTablePanel').style.display = 'block';
        document.getElementById('summaryPanel').style.display = 'block';
        document.getElementById('clearAllBtn').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Error adding position:', error);
        alert('❌ Error adding position. Please try again.');
    }
}

// ========================================
// Render Positions Table
// ========================================

function renderPositions() {
    const tbody = document.getElementById('positionsTableBody');
    const positionCount = document.getElementById('positionCount');
    
    positionCount.textContent = `${positions.length} position${positions.length !== 1 ? 's' : ''}`;
    tbody.innerHTML = '';
    
    positions.forEach(pos => {
        const row = document.createElement('tr');
        
        let marginClass = '';
        let marginIcon = '';
        if (pos.margin >= 70) {
            marginClass = 'excellent';
            marginIcon = '🎉';
        } else if (pos.margin >= 55) {
            marginClass = 'good';
            marginIcon = '✅';
        } else if (pos.margin >= 40) {
            marginClass = 'warning';
            marginIcon = '⚠️';
        } else {
            marginClass = 'danger';
            marginIcon = '❌';
        }
        
        row.innerHTML = `
            <td class="role-cell">${pos.role}</td>
            <td>${pos.hours}</td>
            <td><span class="location-badge ${pos.location}">${capitalizeFirst(pos.location)}</span></td>
            <td>${formatCurrency(pos.cost)}/hr</td>
            <td>${formatCurrency(pos.clientRate)}/hr</td>
            <td>${formatCurrency(pos.revenue)}</td>
            <td class="profit-cell">${formatCurrency(pos.profit)}</td>
            <td class="margin-cell ${marginClass}">${marginIcon} ${pos.margin.toFixed(1)}%</td>
            <td><button class="btn-delete" onclick="deletePosition(${pos.id})" title="Delete position">🗑️</button></td>
        `;
        
        tbody.appendChild(row);
    });
}

// ========================================
// Update Summary
// ========================================

function updateSummary() {
    if (positions.length === 0) return;
    
    const totalHours = positions.reduce((sum, p) => sum + p.hours, 0);
    const totalCost = positions.reduce((sum, p) => sum + p.totalCost, 0);
    const totalRevenue = positions.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    document.getElementById('summaryHours').textContent = totalHours.toLocaleString();
    document.getElementById('summaryCost').textContent = formatCurrency(totalCost);
    document.getElementById('summaryRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('summaryProfit').textContent = formatCurrency(totalProfit);
    
    // Update average margin
    const summaryMarginElement = document.getElementById('summaryMargin');
    summaryMarginElement.textContent = `${avgMargin.toFixed(1)}%`;
    
    // Color code the average margin
    const marginCard = document.querySelector('.summary-card.average-margin');
    marginCard.className = 'summary-card average-margin';
    if (avgMargin >= 70) {
        marginCard.classList.add('excellent');
    } else if (avgMargin >= 55) {
        marginCard.classList.add('good');
    } else if (avgMargin >= 40) {
        marginCard.classList.add('warning');
    } else {
        marginCard.classList.add('danger');
    }
    
    // Warnings
    const warningsContainer = document.getElementById('warningsContainer');
    warningsContainer.innerHTML = '';
    
    const lowMarginPositions = positions.filter(p => p.margin < 40);
    if (lowMarginPositions.length > 0) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-box';
        warningDiv.innerHTML = `
            <div class="warning-header">⚠️ Low Margin Alert</div>
            <div class="warning-content">
                ${lowMarginPositions.length} position${lowMarginPositions.length !== 1 ? 's' : ''} below 40% margin:
                <ul>
                    ${lowMarginPositions.map(p => {
                        const suggestedRate = p.cost / 0.45; // For 55% margin
                        const increase = suggestedRate - p.clientRate;
                        return `<li><strong>${p.role}</strong> (${p.margin.toFixed(1)}%) - Consider raising rate by ${formatCurrency(increase)}/hr to hit 55%</li>`;
                    }).join('')}
                </ul>
            </div>
        `;
        warningsContainer.appendChild(warningDiv);
    }
    
    if (avgMargin < 55) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-box danger';
        warningDiv.innerHTML = `
            <div class="warning-header">❌ Below Target</div>
            <div class="warning-content">
                Average margin is ${avgMargin.toFixed(1)}% (Target: 55%+)
                <br>Consider adjusting rates to reach target margin.
            </div>
        `;
        warningsContainer.appendChild(warningDiv);
    }
}

// ========================================
// Update Margin Tracker
// ========================================

function updateMarginTracker() {
    if (positions.length === 0) {
        document.getElementById('trackerValue').textContent = '0%';
        document.getElementById('trackerStatus').textContent = 'No positions added';
        document.getElementById('trackerBarFill').style.width = '0%';
        return;
    }
    
    const totalRevenue = positions.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = positions.reduce((sum, p) => sum + p.profit, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    const trackerValue = document.getElementById('trackerValue');
    const trackerStatus = document.getElementById('trackerStatus');
    const trackerBarFill = document.getElementById('trackerBarFill');
    const tracker = document.querySelector('.margin-tracker');
    
    trackerValue.textContent = `${avgMargin.toFixed(1)}%`;
    
    const barWidth = Math.min(avgMargin, 100);
    trackerBarFill.style.width = `${barWidth}%`;
    
    tracker.className = 'margin-tracker';
    if (avgMargin >= 70) {
        tracker.classList.add('excellent');
        trackerStatus.textContent = '🎉 Excellent! Way above target';
    } else if (avgMargin >= 55) {
        tracker.classList.add('good');
        trackerStatus.textContent = '✅ Good! Above target';
    } else if (avgMargin >= 45) {
        tracker.classList.add('warning');
        trackerStatus.textContent = '⚠️ Close to target';
    } else {
        tracker.classList.add('danger');
        trackerStatus.textContent = '❌ Below target!';
    }
}

// ========================================
// Delete Position
// ========================================

window.deletePosition = function(id) {
    console.log('🗑️ Deleting position:', id);
    positions = positions.filter(p => p.id !== id);
    
    if (positions.length === 0) {
        document.getElementById('resultsPlaceholder').style.display = 'block';
        document.getElementById('marginTracker').style.display = 'none';
        document.getElementById('positionsTablePanel').style.display = 'none';
        document.getElementById('summaryPanel').style.display = 'none';
        document.getElementById('clearAllBtn').style.display = 'none';
    } else {
        renderPositions();
        updateSummary();
        updateMarginTracker();
    }
};

// ========================================
// Clear All
// ========================================

function handleClearAll() {
    if (positions.length === 0) return;
    if (confirm('🗑️ Clear all positions?')) {
        positions = [];
        document.getElementById('resultsPlaceholder').style.display = 'block';
        document.getElementById('marginTracker').style.display = 'none';
        document.getElementById('positionsTablePanel').style.display = 'none';
        document.getElementById('summaryPanel').style.display = 'none';
        document.getElementById('clearAllBtn').style.display = 'none';
        console.log('✅ All positions cleared');
    }
}

// ========================================
// Utility Functions
// ========================================

function formatCurrency(value) {
    if (isNaN(value)) return '$0.00';
    return `$${Math.abs(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

console.log('✅ Script loaded');
