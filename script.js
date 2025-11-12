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
     * Python's calculate_position_size converted to JavaScript.
     */
    function calculatePositionSize(entryPrice, stopLossPrice, maxLossUSDT, contractSize, rewardR) {
        // All inputs are expected to be numbers or null/undefined
        const priceDifference = Math.abs(entryPrice - stopLossPrice);

        if (priceDifference === 0) {
            throw new Error("Entry price and stop loss price cannot be the same.");
        }

        const isLong = entryPrice > stopLossPrice;
        let result = {};

        if (contractSize) {
            // Position Size in Contracts Mode
            const contracts = maxLossUSDT / (priceDifference * contractSize);
            const totalPositionValue = contracts * contractSize * entryPrice;
            
            result = {
                mode: "contract",
                contracts_to_open: contracts,
                total_position_value: totalPositionValue
            };
        } else {
            // Position Size in USDT Mode
            const positionSizeUSDT = (maxLossUSDT * entryPrice) / priceDifference;
            
            result = {
                mode: "usdt",
                position_size_usdt: positionSizeUSDT
            };
        }

        if (rewardR !== null && rewardR !== undefined && rewardR > 0) {
            const tpDifference = priceDifference * rewardR;
            const tpPrice = isLong ? entryPrice + tpDifference : entryPrice - tpDifference;
            
            result.take_profit_price = tpPrice;
            result.reward_r = rewardR;
            result.risk_reward_summary = `Risk ${priceDifference.toFixed(4)} → Reward ${tpDifference.toFixed(4)}`;
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
            const rewardR = parseFloat(document.getElementById('rewardR').value) || null; // Use null if empty
            const useContract = useContractToggle.checked;
            const contractSize = useContract ? parseFloat(document.getElementById('contractSize').value) : null;

            if (isNaN(entryPrice) || isNaN(stopLossPrice) || isNaN(maxLossUSDT) || maxLossUSDT <= 0) {
                throw new Error("Please enter valid positive values for Entry Price, Stop Loss Price, and Max Loss USDT.");
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
            } else { // contract mode
                contractsToOpenDiv.style.display = 'block';
                positionValueDiv.innerHTML = `💰 **Total Position Value:** ${result.total_position_value.toFixed(2)} USDT`;
                contractsToOpenDiv.innerHTML = `📈 **Contracts to Open:** ${result.contracts_to_open.toFixed(4)}`;
            }

            if (result.take_profit_price) {
                takeProfitDiv.style.display = 'block';
                rrSummaryDiv.style.display = 'block';
                takeProfitDiv.innerHTML = `🎯 **Take Profit Price (${result.reward_r}R):** ${result.take_profit_price.toFixed(4)}`;
                rrSummaryDiv.innerHTML = `📊 **R/R Summary:** ${result.risk_reward_summary}`;
            } else {
                takeProfitDiv.style.display = 'none';
                rrSummaryDiv.style.display = 'none';
            }

        } catch (e) {
            // Handle errors (e.g., price difference is zero or invalid input)
            resultOutput.style.display = 'none';
            errorMsg.textContent = `Error: ${e.message}`;
            errorMsg.style.display = 'block';
        }
    }

    calculateBtn.addEventListener('click', handleCalculation);
});