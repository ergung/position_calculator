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
    
    // Copy Button Logic
    let copyBtn = document.getElementById('copyBtn');
    if (!copyBtn) {
        copyBtn = document.createElement('button');
        copyBtn.id = 'copyBtn';
        copyBtn.innerText = '📋 Copy for Sheets';
        copyBtn.style.marginTop = '15px';
        copyBtn.style.padding = '10px 20px';
        copyBtn.style.backgroundColor = '#2196F3'; // Blue for sheets
        copyBtn.style.color = 'white';
        copyBtn.style.border = 'none';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.fontWeight = 'bold';
        copyBtn.style.display = 'none'; 
        resultOutput.appendChild(copyBtn);
    }

    // Toggle Visibility
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

        if (contractSize) {
            // CONTRACT MODE
            res.mode = 'contract';
            const denom = stripFloat(diff * contractSize);
            res.qty = risk / denom;
            res.money = res.qty * contractSize * entry;
        } else {
            // USDT MODE
            res.mode = 'usdt';
            res.money = (risk * entry) / diff;
            res.qty = res.money / entry; 
        }

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

            // 1. RENDER UI
            resultOutput.style.display = 'block';
            
            // Show Money Value
            positionValueDiv.innerHTML = `💰 **Position Size:** ${r.money.toFixed(2)} USDT`;

            // Logic: Only show Quantity on UI if in Contract Mode
            if (r.mode === 'contract') {
                contractsToOpenDiv.style.display = 'block';
                contractsToOpenDiv.innerHTML = `📦 **Contracts:** ${r.qty.toFixed(6)}`;
            } else {
                contractsToOpenDiv.style.display = 'none';
            }

            // Show Targets
            if (r.tp) {
                takeProfitDiv.style.display = 'block';
                rrSummaryDiv.style.display = 'block';
                takeProfitDiv.innerHTML = `🎯 **TP (${r.rewardR}R):** ${fmt(r.tp)} <span style="color:green">($${r.profit.toFixed(2)})</span>`;
                rrSummaryDiv.innerHTML = `📊 **Math:** Risk Gap ${fmt(Math.abs(entry-stop))} → Reward Gap ${fmt(Math.abs(entry-r.tp))}`;
            } else {
                takeProfitDiv.style.display = 'none';
                rrSummaryDiv.style.display = 'none';
            }

            // 2. CLIPBOARD STRING BUILDER (TSV Format)
            // Desired Order: Date | Side | Entry | SL | TP | Risk($) | Size(USDT) | Cont
            
            const dateStr = new Date().toLocaleDateString();
            const typeStr = r.isLong ? "LONG" : "SHORT";
            const tpStr = r.tp ? fmt(r.tp) : "-";
            
            // If contract mode, show qty. If USDT mode, show "-"
            const contractVal = r.mode === 'contract' ? r.qty.toFixed(6) : "-";
            
            // \t is the Tab character for spreadsheets
            const sheetRow = `${dateStr}\t${typeStr}\t${entry}\t${stop}\t${tpStr}\t${risk}\t${r.money.toFixed(2)}\t${contractVal}`;

            copyBtn.style.display = 'block';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(sheetRow);
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
