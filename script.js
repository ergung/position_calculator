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

    /**
     * Helper to clean floating point math errors (e.g. 0.1 + 0.2 = 0.300000004)
     */
    function stripFloat(number) {
        return parseFloat(number.toPrecision(12));
    }

    /**
     * Helper to format numbers nicely (up to 8 decimals for crypto, but no trailing zeros)
     */
    function fmt(num) {
        return parseFloat(num.toFixed(8));
    }

    function calculatePositionSize(entryPrice, stopLossPrice, maxLossUSDT, contractSize, rewardR) {
        // Calculate raw distance and strip floating point errors
        const rawDiff = Math.abs(entryPrice - stopLossPrice);
        const priceDifference = stripFloat(rawDiff);

        if (priceDifference === 0) {
            throw new Error("Entry price and stop loss price cannot be the same.");
        }

        const isLong = entryPrice > stopLossPrice;
        let result = {};

        if (contractSize) {
            // Position Size in Contracts Mode
            // Math: Contracts = Risk / (Distance * ContractSize)
            const denominator = stripFloat(priceDifference * contractSize);
            const contracts = maxLossUSDT / denominator;
            const totalPositionValue = contracts * contractSize * entryPrice;
            
            result = {
                mode: "contract",
                contracts_to_open: contracts,
                total_position_value: totalPositionValue
            };
        } else {
            // Position Size in USDT Mode
            // Math: Size = (Risk * Entry) / Distance
            const positionSizeUSDT = (maxLossUSDT * entryPrice) / priceDifference;
            
            result = {
                mode: "usdt",
                position_size_usdt: positionSizeUSDT
            };
        }

        // Risk to Reward Calculation
        if (rewardR !== null && rewardR !== undefined && rewardR > 0) {
            const tpDifference = stripFloat(priceDifference * rewardR);
            const tpPrice = isLong ? (entryPrice + tpDifference) : (entryPrice - tpDifference);
            
            // Calculate exactly how much money we make if TP is hit
            const potentialProfit = maxLossUSDT * rewardR;

            result.take_profit_price = tpPrice;
            result.reward_r = rewardR;
            result.potential_profit = potentialProfit;
            // We show the Price Gap (Risk) vs Price Gap (Reward)
            result.risk_reward_summary = `Risk Price Gap: ${fmt(priceDifference)} → Reward Price Gap: ${fmt(tpDifference)}`;
        }

        return result;
    }

    // Main calculation and UI update function
    function handleCalculation() {
        errorMsg.style.display = 'none';
        resultOutput.style.display = 'none';
        
        try {
            // 1. Collect and validate inputs
            const entryPrice = parseFloat(document.getElementById('entryPrice').value);
            const stopLossPrice = parseFloat(document.getElementById('stopLossPrice').value);
            const maxLossUSDT = parseFloat(document.getElementById('maxLossUSDT').value);
            const rewardR = parseFloat(document.getElementById('rewardR').value) || null;
            const useContract = useContractToggle.checked;
            const contractSize = useContract ? parseFloat(document.getElementById('contractSize').value) : null;

            if (isNaN(entryPrice) || isNaN(stopLossPrice) || isNaN(maxLossUSDT) || maxLossUSDT <= 0) {
                throw new Error("Please enter valid positive values for Entry, Stop Loss, and Max Risk.");
            }
            if (useContract && (isNaN(contractSize) || contractSize <= 0)) {
                 throw new Error("Please enter a valid positive value for Contract Size.");
            }

            // 2. Perform calculation
            const result = calculatePositionSize(entryPrice, stopLossPrice, maxLossUSDT, contractSize, rewardR);

            // 3. Update UI
            resultOutput.style.display = 'block';

            if (result.mode === "usdt") {
                positionValueDiv.innerHTML = `💰 **Position Size:** ${result.position_size_usdt.toFixed(2)} USDT`;
                contractsToOpenDiv.style.display = 'none';
            } else { 
                // Contract mode
                contractsToOpenDiv.style.display = 'block';
                positionValueDiv.innerHTML = `💰 **Total Position Value:** ${result.total_position_value.toFixed(2)} USDT`;
                // Show up to 6 decimals for contracts (useful for crypto like ETH/BTC)
                contractsToOpenDiv.innerHTML = `📈 **Contracts to Open:** ${result.contracts_to_open.toFixed(6)}`;
            }

            if (result.take_profit_price) {
                takeProfitDiv.style.display = 'block';
                rrSummaryDiv.style.display = 'block';
                
                // Updated Output: Shows Price AND Projected Dollar Profit
                takeProfitDiv.innerHTML = `
                    🎯 **Take Profit Price (${result.reward_r}R):** ${fmt(result.take_profit_price)} <br>
                    <span style="color: green; font-size: 0.9em;">(Projected Profit: +$${result.potential_profit.toFixed(2)} USDT)</span>
                `;
                
                rrSummaryDiv.innerHTML = `📊 **Math:** ${result.risk_reward_summary}`;
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
