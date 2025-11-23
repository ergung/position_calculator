document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculateBtn');
    const useContractToggle = document.getElementById('useContract');
    const contractSizeGroup = document.getElementById('contractSizeGroup');
    const resultOutput = document.getElementById('resultOutput');
    const errorMsg = document.getElementById('errorMsg');

    // DOM Elements for Results
    const positionValueDiv = document.getElementById('positionValue');
    const contractsToOpenDiv = document.getElementById('contractsToOpen');
    const takeProfitDiv = document.getElementById('takeProfit');
    const rrSummaryDiv = document.getElementById('rrSummary');

    // Toggle Contract Size Visibility
    useContractToggle.addEventListener('change', () => {
        contractSizeGroup.style.display = useContractToggle.checked ? 'block' : 'none';
    });

    // Helper to clean floating point math
    function stripFloat(number) {
        return parseFloat(number.toPrecision(12));
    }

    // Helper for display
    function fmt(num) {
        return parseFloat(num.toFixed(8));
    }

    function calculatePositionSize(entryPrice, stopLossPrice, maxLossUSDT, contractSize, rewardR) {
        const rawDiff = Math.abs(entryPrice - stopLossPrice);
        const priceDifference = stripFloat(rawDiff);

        if (priceDifference === 0) {
            throw new Error("Entry price and stop loss price cannot be the same.");
        }

        const isLong = entryPrice > stopLossPrice;
        let result = {};

        if (contractSize) {
            // Contract Mode
            const denominator = stripFloat(priceDifference * contractSize);
            const contracts = maxLossUSDT / denominator;
            const totalPositionValue = contracts * contractSize * entryPrice;
            
            result = {
                mode: "contract",
                quantity: contracts, 
                total_position_value: totalPositionValue,
                label_unit: "Contracts"
            };
        } else {
            // USDT Mode
            const positionSizeUSDT = (maxLossUSDT * entryPrice) / priceDifference;
            // Calculate Quantity (How many coins/shares)
            const quantity = positionSizeUSDT / entryPrice;
            
            result = {
                mode: "usdt",
                position_size_usdt: positionSizeUSDT,
                quantity: quantity,
                label_unit: "Coins/Units"
            };
        }

        // Reward Calculation
        if (rewardR !== null && rewardR !== undefined && rewardR > 0) {
            const tpDifference = stripFloat(priceDifference * rewardR);
            const tpPrice = isLong ? (entryPrice + tpDifference) : (entryPrice - tpDifference);
            const potentialProfit = maxLossUSDT * rewardR;

            result.take_profit_price = tpPrice;
            result.reward_r = rewardR;
            result.potential_profit = potentialProfit;
            
            // RENAMED to be clearer: "Price Drop" vs "Price Jump"
            const direction = isLong ? "Drop" : "Rise"; // For Stop Loss
            const profitDir = isLong ? "Rise" : "Drop"; // For Take Profit
            result.risk_reward_summary = `SL (Price ${direction}): ${fmt(priceDifference)} → TP (Price ${profitDir}): ${fmt(tpDifference)}`;
        }

        return result;
    }

    function handleCalculation() {
        errorMsg.style.display = 'none';
        resultOutput.style.display = 'none';
        
        try {
            const entryPrice = parseFloat(document.getElementById('entryPrice').value);
            const stopLossPrice = parseFloat(document.getElementById('stopLossPrice').value);
            const maxLossUSDT = parseFloat(document.getElementById('maxLossUSDT').value);
            const rewardR = parseFloat(document.getElementById('rewardR').value) || null;
            const useContract = useContractToggle.checked;
            const contractSize = useContract ? parseFloat(document.getElementById('contractSize').value) : null;

            if (isNaN(entryPrice) || isNaN(stopLossPrice) || isNaN(maxLossUSDT) || maxLossUSDT <= 0) {
                throw new Error("Please enter valid positive values.");
            }

            const result = calculatePositionSize(entryPrice, stopLossPrice, maxLossUSDT, contractSize, rewardR);

            resultOutput.style.display = 'block';

            // DYNAMIC OUTPUT
            // 1. Show Total Money Required
            const moneyValue = result.mode === "usdt" ? result.position_size_usdt : result.total_position_value;
            positionValueDiv.innerHTML = `💰 **Total Value:** ${moneyValue.toFixed(2)} USDT`;

            // 2. Show Quantity (The new helpful part)
            contractsToOpenDiv.style.display = 'block';
            contractsToOpenDiv.innerHTML = `📦 **Quantity to Buy:** ${result.quantity.toFixed(6)} ${result.label_unit}`;

            // 3. Show Targets
            if (result.take_profit_price) {
                takeProfitDiv.style.display = 'block';
                rrSummaryDiv.style.display = 'block';
                
                takeProfitDiv.innerHTML = `
                    🎯 **Target Price (${result.reward_r}R):** ${fmt(result.take_profit_price)} <br>
                    <span style="color: green; font-size: 0.9em;">(Profit: +$${result.potential_profit.toFixed(2)} USDT)</span>
                `;
                
                rrSummaryDiv.innerHTML = `📊 **Distance:** ${result.risk_reward_summary}`;
            } else {
                takeProfitDiv.style.display = 'none';
                rrSummaryDiv.style.display = 'none';
            }

        } catch (e) {
            resultOutput.style.display = 'none';
            errorMsg.textContent = `Error: ${e.message}`;
            errorMsg.style.display = 'block';
        }
    }

    calculateBtn.addEventListener('click', handleCalculation);
});
