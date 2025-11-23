document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const calculateBtn = document.getElementById('calculateBtn');
    const useContractToggle = document.getElementById('useContract');
    const contractSizeGroup = document.getElementById('contractSizeGroup');
    const resultOutput = document.getElementById('resultOutput');
    const errorMsg = document.getElementById('errorMsg');

    // Result Elements
    const positionValueDiv = document.getElementById('positionValue');
    const contractsToOpenDiv = document.getElementById('contractsToOpen');
    const takeProfitDiv = document.getElementById('takeProfit');
    const rrSummaryDiv = document.getElementById('rrSummary');
    
    // NEW: Create Copy Button dynamically if it doesn't exist in HTML
    let copyBtn = document.getElementById('copyBtn');
    if (!copyBtn) {
        copyBtn = document.createElement('button');
        copyBtn.id = 'copyBtn';
        copyBtn.innerText = '📋 Copy Trade Details';
        copyBtn.style.marginTop = '10px';
        copyBtn.style.padding = '8px 16px';
        copyBtn.style.backgroundColor = '#4CAF50';
        copyBtn.style.color = 'white';
        copyBtn.style.border = 'none';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.display = 'none'; // hidden initially
        resultOutput.appendChild(copyBtn);
    }

    // Toggle Contract Input
    useContractToggle.addEventListener('change', () => {
        contractSizeGroup.style.display = useContractToggle.checked ? 'block' : 'none';
    });

    // --- MATH HELPERS ---
    function stripFloat(number) { return parseFloat(number.toPrecision(12)); }
    function fmt(num) { return parseFloat(num.toFixed(8)); }

    // --- MAIN LOGIC ---
    function calculatePositionSize(entry, stop, risk, contractSize, rewardR) {
        const rawDiff = Math.abs(entry - stop);
        const diff = stripFloat(rawDiff);
        
        if (diff === 0) throw new Error("Entry and Stop cannot be the same.");

        const isLong = entry > stop;
        let res = { entry, stop, risk, rewardR, isLong };

        // Position Size Calc
        if (contractSize) {
            const denom = stripFloat(diff * contractSize);
            res.qty = risk / denom;
            res.money = res.qty * contractSize * entry;
            res.unit = "Contracts";
        } else {
            res.money = (risk * entry) / diff;
            res.qty = res.money / entry;
            res.unit = "Coins";
        }

        // Reward Calc
        if (rewardR) {
            const tpDist = stripFloat(diff * rewardR);
            res.tp = isLong ? (entry + tpDist) : (entry - tpDist);
            res.profit = risk * rewardR;
        }
        return res;
    }

    // --- HANDLER ---
    function handleCalculation() {
        errorMsg.style.display = 'none';
        resultOutput.style.display = 'none';
        copyBtn.style.display = 'none';

        try {
            const entry = parseFloat(document.getElementById('entryPrice').value);
            const stop = parseFloat(document.getElementById('stopLossPrice').value);
            const risk = parseFloat(document.getElementById('maxLossUSDT').value);
            const rewardR = parseFloat(document.getElementById('rewardR').value) || null;
            const useCon = useContractToggle.checked;
            const conSize = useCon ? parseFloat(document.getElementById('contractSize').value) : null;

            if (isNaN(entry) || isNaN(stop) || isNaN(risk) || risk <= 0) throw new Error("Invalid Inputs");

            const r = calculatePositionSize(entry, stop, risk, conSize, rewardR);

            // RENDER
            resultOutput.style.display = 'block';
            
            positionValueDiv.innerHTML = `💰 **Total Value:** ${r.money.toFixed(2)} USDT`;
            contractsToOpenDiv.style.display = 'block';
            contractsToOpenDiv.innerHTML = `📦 **Quantity:** ${r.qty.toFixed(6)} ${r.unit}`;

            let journalString = "";

            if (r.tp) {
                takeProfitDiv.style.display = 'block';
                rrSummaryDiv.style.display = 'block';
                takeProfitDiv.innerHTML = `🎯 **TP (${r.rewardR}R):** ${fmt(r.tp)} <span style="color:green">($${r.profit.toFixed(2)})</span>`;
                rrSummaryDiv.innerHTML = `📊 **SL:** ${stop} | **TP:** ${fmt(r.tp)}`;
                
                // Format for Journal
                const side = r.isLong ? "LONG" : "SHORT";
                journalString = `${new Date().toLocaleDateString()} | ${side} | Entry: ${entry} | SL: ${stop} | TP: ${fmt(r.tp)} | Qty: ${r.qty.toFixed(4)} | Risk: $${risk}`;
            } else {
                takeProfitDiv.style.display = 'none';
                rrSummaryDiv.style.display = 'none';
                journalString = `Entry: ${entry} | SL: ${stop} | Qty: ${r.qty.toFixed(4)}`;
            }

            // SETUP COPY BUTTON
            copyBtn.style.display = 'block';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(journalString);
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✅ Copied!";
                setTimeout(() => copyBtn.innerText = originalText, 1500);
            };

        } catch (e) {
            resultOutput.style.display = 'none';
            errorMsg.textContent = e.message;
            errorMsg.style.display = 'block';
        }
    }

    calculateBtn.addEventListener('click', handleCalculation);
});
