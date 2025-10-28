// ========================================
// Global State
// ========================================

let positions = [];
let positionIdCounter = 0;
let calculationMode = null; // 'margin' or 'rate'

// ========================================
// Initialize Application
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    setTimeout(initializeApp, 500);
});

function onDataLoaded() {
    console.log('Data loaded callback triggered');
    populateRoles();
}

function initializeApp() {
    console.log('initializeApp called');
    populateRoles();
    setupModeToggle();
    
    const form = document.getElementById('positionForm');
    if (form) {
        form.addEventListener('submit', handleAddPosition);
        console.log('Form submit listener added');
    }
    
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', handleClearAll);
        console.log('Clear button listener added');
    }
}

function populateRoles() {
    const roleSelect = document.getElementById('role');
    if (!roleSelect) {
        console.error('Role select not found');
        return;
    }
    
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
        console.log(`✓ ${rateCardData.length} roles loaded`);
    } else {
        console.warn('No rate card data available');
    }
}

// ========================================
// Mode Toggle Setup
// ========================================

function setupModeToggle() {
    console.log('Setting up mode toggle...');
    
    const marginRadio = document.getElementById('modeMargin');
    const rateRadio = document.getElementById('modeRate');
    const marginInputGroup = document.getElementById('marginInputGroup');
    const rateInputGroup = document.getElementById('rateInputGroup');
    
    if (!marginRadio || !rateRadio) {
        console.error('Radio buttons not found');
        return;
    }
    
    marginRadio.addEventListener('change', function() {
        console.log('Margin radio selected');
        if (marginRadio.checked) {
            marginInputGroup.style.display = 'block';
            rateInputGroup.style.display = 'none';
            document.getElementById('clientRate').value = '';
        }
    });
    
    rateRadio.addEventListener('change', function() {
        console.log('Rate radio selected');
        if (rateRadio.checked) {
            marginInputGroup.style.display = 'none';
            rateInputGroup.style.display = 'block';
            document.getElementById('desiredMargin').value = '';
        }
    });
    
    console.log('Mode toggle setup complete');
}

// ========================================
// Handle Add Position
// ========================================

function handleAddPosition(e) {
    e.preventDefault();
    console.log('Add position clicked');
    
    const role = document.getElementById('role').value;
    const hours = parseFloat(document.getElementById('hours').value);
    const marginRadio = document.getElementById('modeMargin');
    const selectedMode = marginRadio.checked ? 'margin' : 'rate';
    
    console.log('Form values:', { role, hours, selectedMode });
    
    if (!role || !hours) {
        alert('Please select a Role and enter Hours');
        return;
    }
    
    // Check if mode is locked
    if (calculationMode && calculationMode !== selectedMode) {
        alert(`You started with ${calculationMode === 'margin' ? 'Margin %' : 'Client Rate'} mode. Please clear all positions to switch modes.`);
        return;
    }
    
    const roleData = rateCardData.find(r => r.role === role);
    if (!roleData) {
        alert('Role data not found');
        console.error('Role not found:', role);
        return;
    }
    
    let position;
    
    if (selectedMode === 'margin') {
        // MARGIN MODE
        const desiredMarginInput = document.getElementById('desiredMargin').value;
        const desiredMargin = desiredMarginInput ? parseFloat(desiredMarginInput) / 100 : 0.70;
        
        console.log('Margin mode:', desiredMargin);
        
        // Find best location (lowest cost)
        const locationCosts = [
            { location: 'offshore', cost: roleData.offshore.cost },
            { location: 'nearshore', cost: roleData.nearshore.cost },
            { location: 'onshore', cost: roleData.onshore.cost }
        ];
        locationCosts.sort((a, b) => a.cost - b.cost);
        const bestLocation = locationCosts[0].location;
        
        position = {
            id: ++positionIdCounter,
            role,
            hours,
            mode: 'margin',
            desiredMargin,
            selectedLocation: bestLocation,
            roleData
        };
        
        if (!calculationMode) {
            calculationMode = 'margin';
            updateModeIndicator();
            lockModeInputs();
        }
    } else {
        // RATE MODE
        const clientRateInput = document.getElementById('clientRate').value;
        if (!clientRateInput) {
            alert('Please enter a Target Client Rate');
            return;
        }
        const clientRate = parseFloat(clientRateInput);
        
        console.log('Rate mode:', clientRate);
        
        // Find best location (highest margin)
        const locationMargins = [
            { location: 'offshore', margin: roleData.offshore.cost > 0 ? ((clientRate - roleData.offshore.cost) / clientRate) : 0 },
            { location: 'nearshore', margin: roleData.nearshore.cost > 0 ? ((clientRate - roleData.nearshore.cost) / clientRate) : 0 },
            { location: 'onshore', margin: roleData.onshore.cost > 0 ? ((clientRate - roleData.onshore.cost) / clientRate) : 0 }
        ];
        locationMargins.sort((a, b) => b.margin - a.margin);
        const bestLocation = locationMargins[0].location;
        
        position = {
            id: ++positionIdCounter,
            role,
            hours,
            mode: 'rate',
            clientRate,
            selectedLocation: bestLocation,
            roleData
        };
        
        if (!calculationMode) {
            calculationMode = 'rate';
            updateModeIndicator();
            lockModeInputs();
        }
    }
    
    positions.push(position);
    console.log('Position added:', position);
    console.log('Total positions:', positions.length);
    
    renderPositions();
    updateSummary();
    
    // Reset form
    document.getElementById('role').value = '';
    document.getElementById('hours').value = '';
    if (calculationMode === 'margin') {
        document.getElementById('desiredMargin').value = '';
    } else {
        document.getElementById('clientRate').value = '';
    }
    
    document.getElementById('resultsPlaceholder').style.display = 'none';
    document.getElementById('positionsPanel').style.display = 'block';
    document.getElementById('summaryPanel').style.display = 'block';
    
    console.log('Position added successfully');
}

// ========================================
// Change Location Selection
// ========================================

window.selectLocation = function(positionId, location) {
    console.log('Selecting location:', positionId, location);
    const position = positions.find(p => p.id === positionId);
    if (position) {
        position.selectedLocation = location;
        renderPositions();
        updateSummary();
    }
};

// ========================================
// Mode Indicator
// ========================================

function updateModeIndicator() {
    const indicator = document.getElementById('modeIndicator');
    if (calculationMode === 'margin') {
        indicator.innerHTML = '🎯 <strong>Mode:</strong> Calculating by Margin %';
        indicator.className = 'mode-indicator mode-margin';
    } else {
        indicator.innerHTML = '💰 <strong>Mode:</strong> Calculating by Client Rate';
        indicator.className = 'mode-indicator mode-rate';
    }
    indicator.style.display = 'block';
}

function lockModeInputs() {
    const marginRadio = document.getElementById('modeMargin');
    const rateRadio = document.getElementById('modeRate');
    const marginOption = document.getElementById('marginOption');
    const rateOption = document.getElementById('rateOption');
    
    if (calculationMode === 'margin') {
        rateRadio.disabled = true;
        if (rateOption) rateOption.classList.add('disabled');
    } else {
        marginRadio.disabled = true;
        if (marginOption) marginOption.classList.add('disabled');
    }
}

function unlockModeInputs() {
    const marginRadio = document.getElementById('modeMargin');
    const rateRadio = document.getElementById('modeRate');
    const marginOption = document.getElementById('marginOption');
    const rateOption = document.getElementById('rateOption');
    
    marginRadio.disabled = false;
    rateRadio.disabled = false;
    if (marginOption) marginOption.classList.remove('disabled');
    if (rateOption) rateOption.classList.remove('disabled');
}

// ========================================
// Render Positions
// ========================================

function renderPositions() {
    const positionsList = document.getElementById('positionsList');
    const positionCount = document.getElementById('positionCount');
    
    positionCount.textContent = `${positions.length} position${positions.length !== 1 ? 's' : ''}`;
    positionsList.innerHTML = '';
    
    positions.forEach(position => {
        const card = createPositionCard(position);
        positionsList.appendChild(card);
    });
}

// ========================================
// Create Position Card
// ========================================

function createPositionCard(position) {
    const card = document.createElement('div');
    card.className = 'position-card';
    
    const locations = [
        { name: 'Offshore', location: 'offshore', cost: position.roleData.offshore.cost },
        { name: 'Nearshore', location: 'nearshore', cost: position.roleData.nearshore.cost },
        { name: 'Onshore', location: 'onshore', cost: position.roleData.onshore.cost }
    ];
    
    if (position.mode === 'margin') {
        // MARGIN MODE
        locations.forEach(loc => {
            loc.clientRate = loc.cost / (1 - position.desiredMargin);
            loc.totalCost = position.hours * loc.clientRate;
            loc.totalProfit = loc.totalCost - (position.hours * loc.cost);
            loc.margin = position.desiredMargin * 100;
        });
        
        locations.sort((a, b) => a.totalCost - b.totalCost);
        const best = locations[0];
        const selected = locations.find(l => l.location === position.selectedLocation);
        
        card.innerHTML = `
            <div class="position-header">
                <div>
                    <div class="position-title">${position.role}</div>
                    <span class="mode-badge margin">Margin Mode</span>
                </div>
                <button class="position-delete" onclick="deletePosition(${position.id})">✕</button>
            </div>
            <div class="position-metrics">
                <div class="position-metric">
                    <span class="position-metric-label">Hours</span>
                    <span class="position-metric-value">${position.hours}</span>
                </div>
                <div class="position-metric">
                    <span class="position-metric-label">Target Margin</span>
                    <span class="position-metric-value">${(position.desiredMargin * 100).toFixed(1)}%</span>
                </div>
            </div>
            <div class="location-comparison-grid">
                ${locations.map(loc => {
                    const isBest = loc.location === best.location;
                    const isSelected = loc.location === position.selectedLocation;
                    return `
                        <div class="location-card ${isSelected ? 'selected' : ''} ${isBest ? 'best' : ''}" 
                             onclick="selectLocation(${position.id}, '${loc.location}')">
                            ${isBest ? '<div class="best-badge">🏆 LOWEST COST</div>' : ''}
                            ${isSelected ? '<div class="selected-badge">✓ SELECTED</div>' : ''}
                            <div class="location-name">${loc.name}</div>
                            <div class="location-metrics">
                                <div class="metric">
                                    <span class="label">Your Cost/hr</span>
                                    <span class="value">${formatCurrency(loc.cost)}</span>
                                </div>
                                <div class="metric highlight">
                                    <span class="label">Charge Client</span>
                                    <span class="value large">${formatCurrency(loc.clientRate)}/hr</span>
                                </div>
                                <div class="metric">
                                    <span class="label">Total Project</span>
                                    <span class="value">${formatCurrency(loc.totalCost)}</span>
                                </div>
                                <div class="metric success">
                                    <span class="label">Your Profit</span>
                                    <span class="value">${formatCurrency(loc.totalProfit)}</span>
                                </div>
                            </div>
                            ${!isSelected ? '<div class="click-hint">Click to select</div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="recommendation">
                ${position.selectedLocation === best.location 
                    ? `✅ <strong>Optimal choice!</strong> ${best.name} gives lowest cost (${formatCurrency(best.totalCost)})`
                    : `⚠️ <strong>You selected:</strong> ${selected.name} at ${formatCurrency(selected.totalCost)} 
                       · Losing ${formatCurrency(selected.totalCost - best.totalCost)} vs ${best.name}`
                }
            </div>
        `;
    } else {
        // RATE MODE
        locations.forEach(loc => {
            loc.clientRate = position.clientRate;
            loc.totalCost = position.hours * loc.clientRate;
            loc.totalProfit = loc.totalCost - (position.hours * loc.cost);
            loc.margin = loc.cost > 0 ? ((loc.clientRate - loc.cost) / loc.clientRate) * 100 : 0;
        });
        
        locations.sort((a, b) => b.margin - a.margin);
        const best = locations[0];
        const selected = locations.find(l => l.location === position.selectedLocation);
        
        card.innerHTML = `
            <div class="position-header">
                <div>
                    <div class="position-title">${position.role}</div>
                    <span class="mode-badge rate">Rate Mode</span>
                </div>
                <button class="position-delete" onclick="deletePosition(${position.id})">✕</button>
            </div>
            <div class="position-metrics">
                <div class="position-metric">
                    <span class="position-metric-label">Hours</span>
                    <span class="position-metric-value">${position.hours}</span>
                </div>
                <div class="position-metric">
                    <span class="position-metric-label">Client Rate</span>
                    <span class="position-metric-value">${formatCurrency(position.clientRate)}/hr</span>
                </div>
            </div>
            <div class="location-comparison-grid">
                ${locations.map(loc => {
                    const isBest = loc.location === best.location;
                    const isSelected = loc.location === position.selectedLocation;
                    return `
                        <div class="location-card ${isSelected ? 'selected' : ''} ${isBest ? 'best' : ''}" 
                             onclick="selectLocation(${position.id}, '${loc.location}')">
                            ${isBest ? '<div class="best-badge">🏆 BEST MARGIN</div>' : ''}
                            ${isSelected ? '<div class="selected-badge">✓ SELECTED</div>' : ''}
                            <div class="location-name">${loc.name}</div>
                            <div class="location-metrics">
                                <div class="metric">
                                    <span class="label">Your Cost/hr</span>
                                    <span class="value">${formatCurrency(loc.cost)}</span>
                                </div>
                                <div class="metric highlight">
                                    <span class="label">Your Margin</span>
                                    <span class="value large">${loc.margin.toFixed(1)}%</span>
                                </div>
                                <div class="metric">
                                    <span class="label">Total Revenue</span>
                                    <span class="value">${formatCurrency(loc.totalCost)}</span>
                                </div>
                                <div class="metric success">
                                    <span class="label">Your Profit</span>
                                    <span class="value">${formatCurrency(loc.totalProfit)}</span>
                                </div>
                            </div>
                            ${!isSelected ? '<div class="click-hint">Click to select</div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="recommendation">
                ${position.selectedLocation === best.location 
                    ? `✅ <strong>Optimal choice!</strong> ${best.name} gives ${best.margin.toFixed(1)}% margin`
                    : `⚠️ <strong>You selected:</strong> ${selected.name} with ${selected.margin.toFixed(1)}% margin 
                       · Losing ${formatCurrency(best.totalProfit - selected.totalProfit)} profit vs ${best.name}`
                }
            </div>
        `;
    }
    
    return card;
}

// ========================================
// Delete Position
// ========================================

window.deletePosition = function(id) {
    positions = positions.filter(p => p.id !== id);
    
    if (positions.length === 0) {
        calculationMode = null;
        unlockModeInputs();
        document.getElementById('modeIndicator').style.display = 'none';
        document.getElementById('positionsPanel').style.display = 'none';
        document.getElementById('summaryPanel').style.display = 'none';
        document.getElementById('resultsPlaceholder').style.display = 'block';
    } else {
        renderPositions();
        updateSummary();
    }
};

// ========================================
// Clear All
// ========================================

function handleClearAll() {
    if (positions.length === 0) return;
    if (confirm('Clear all positions?')) {
        positions = [];
        calculationMode = null;
        unlockModeInputs();
        document.getElementById('modeIndicator').style.display = 'none';
        document.getElementById('positionsPanel').style.display = 'none';
        document.getElementById('summaryPanel').style.display = 'none';
        document.getElementById('resultsPlaceholder').style.display = 'block';
    }
}

// ========================================
// Update Summary  
// ========================================

function updateSummary() {
    if (positions.length === 0) return;
    
    const summaryContent = document.getElementById('summaryContent');
    
    let totalCostSelected = 0;
    let totalProfitSelected = 0;
    let totalHours = 0;
    let totalCostOptimal = 0;
    let totalProfitOptimal = 0;
    
    positions.forEach(pos => {
        totalHours += pos.hours;
        
        // Selected location
        const selectedCost = pos.roleData[pos.selectedLocation].cost;
        let selectedClientRate, selectedProfit;
        
        if (pos.mode === 'margin') {
            selectedClientRate = selectedCost / (1 - pos.desiredMargin);
        } else {
            selectedClientRate = pos.clientRate;
        }
        
        const selectedTotal = pos.hours * selectedClientRate;
        selectedProfit = selectedTotal - (pos.hours * selectedCost);
        
        totalCostSelected += selectedTotal;
        totalProfitSelected += selectedProfit;
        
        // Optimal location
        let optimalLocation;
        if (pos.mode === 'margin') {
            const costs = [
                { loc: 'offshore', cost: pos.roleData.offshore.cost },
                { loc: 'nearshore', cost: pos.roleData.nearshore.cost },
                { loc: 'onshore', cost: pos.roleData.onshore.cost }
            ];
            costs.sort((a, b) => a.cost - b.cost);
            optimalLocation = costs[0].loc;
        } else {
            const margins = [
                { loc: 'offshore', margin: (pos.clientRate - pos.roleData.offshore.cost) / pos.clientRate },
                { loc: 'nearshore', margin: (pos.clientRate - pos.roleData.nearshore.cost) / pos.clientRate },
                { loc: 'onshore', margin: (pos.clientRate - pos.roleData.onshore.cost) / pos.clientRate }
            ];
            margins.sort((a, b) => b.margin - a.margin);
            optimalLocation = margins[0].loc;
        }
        
        const optimalCost = pos.roleData[optimalLocation].cost;
        let optimalClientRate, optimalProfit;
        
        if (pos.mode === 'margin') {
            optimalClientRate = optimalCost / (1 - pos.desiredMargin);
        } else {
            optimalClientRate = pos.clientRate;
        }
        
        const optimalTotal = pos.hours * optimalClientRate;
        optimalProfit = optimalTotal - (pos.hours * optimalCost);
        
        totalCostOptimal += optimalTotal;
        totalProfitOptimal += optimalProfit;
    });
    
    const avgMargin = (totalProfitSelected / totalCostSelected) * 100;
    const isOptimal = Math.abs(totalProfitSelected - totalProfitOptimal) < 1;
    const profitDifference = totalProfitOptimal - totalProfitSelected;
    
    summaryContent.innerHTML = `
        <div class="summary-header">
            <h3>Your Selection Summary</h3>
            <div class="summary-stat">${positions.length} Positions · ${totalHours} Total Hours</div>
        </div>
        
        <div class="summary-totals">
            <div class="summary-total-card ${isOptimal ? 'optimal' : ''}">
                <div class="summary-total-label">Total to Client</div>
                <div class="summary-total-value">${formatCurrency(totalCostSelected)}</div>
            </div>
            <div class="summary-total-card ${isOptimal ? 'optimal' : ''}">
                <div class="summary-total-label">Your Profit</div>
                <div class="summary-total-value profit">${formatCurrency(totalProfitSelected)}</div>
            </div>
            <div class="summary-total-card ${isOptimal ? 'optimal' : ''}">
                <div class="summary-total-label">Average Margin</div>
                <div class="summary-total-value">${avgMargin.toFixed(1)}%</div>
            </div>
        </div>
        
        ${!isOptimal ? `
            <div class="summary-comparison">
                <div class="comparison-alert">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-content">
                        <div class="alert-title">Not Using Optimal Strategy</div>
                        <div class="alert-details">
                            If you selected all best locations, you would earn ${formatCurrency(profitDifference)} more profit!
                        </div>
                    </div>
                </div>
            </div>
        ` : `
            <div class="summary-success">
                <div class="success-icon">🎉</div>
                <div class="success-content">
                    <div class="success-title">Optimal Strategy!</div>
                    <div class="success-message">
                        You've selected the best location for each position.
                    </div>
                </div>
            </div>
        `}
        
        <div class="summary-breakdown">
            <h4>Position Breakdown</h4>
            <div class="breakdown-list">
                ${positions.map(pos => {
                    const cost = pos.roleData[pos.selectedLocation].cost;
                    let clientRate, profit;
                    
                    if (pos.mode === 'margin') {
                        clientRate = cost / (1 - pos.desiredMargin);
                    } else {
                        clientRate = pos.clientRate;
                    }
                    
                    const total = pos.hours * clientRate;
                    profit = total - (pos.hours * cost);
                    
                    return `
                        <div class="breakdown-item">
                            <div class="breakdown-role">${pos.role}</div>
                            <div class="breakdown-location">${pos.selectedLocation}</div>
                            <div class="breakdown-profit">${formatCurrency(profit)}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ========================================
// Utility Functions
// ========================================

function formatCurrency(value) {
    if (isNaN(value) || value === 0) return '$0.00';
    return `$${value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

console.log('Script loaded');
