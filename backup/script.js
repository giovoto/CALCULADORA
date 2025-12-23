document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const priceInput = document.getElementById('price');
    const conceptSelect = document.getElementById('concept');
    const hasIvaSwitch = document.getElementById('has-iva');
    const ivaSelectGroup = document.getElementById('iva-select-group');
    const ivaRateSelect = document.getElementById('iva-rate');
    const applyIcaSwitch = document.getElementById('apply-ica');
    const icaInputGroup = document.getElementById('ica-input-group');
    const icaRateInput = document.getElementById('ica-rate');

    // Result Elements
    const resBase = document.getElementById('res-base');
    const resIva = document.getElementById('res-iva');
    const resRete = document.getElementById('res-rete');
    const resIca = document.getElementById('res-ica');
    const resTotal = document.getElementById('res-total');
    const badgeRete = document.getElementById('badge-rete');
    const badgeIca = document.getElementById('badge-ica');

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    function calculate() {
        const p = parseFloat(priceInput.value) || 0;
        const ivaPerc = hasIvaSwitch.checked ? parseFloat(ivaRateSelect.value) : 0;
        const retePerc = parseFloat(conceptSelect.options[conceptSelect.selectedIndex].dataset.rate);
        const icaMil = applyIcaSwitch.checked ? parseFloat(icaRateInput.value) || 0 : 0;

        // 1. Calculate Base
        // If IVA included: Base = P / (1 + (IVA/100))
        let base = p;
        if (hasIvaSwitch.checked) {
            base = p / (1 + (ivaPerc / 100));
        }
        base = Math.round(base);

        // 2. Calculate IVA amount
        const ivaAmount = p - base;

        // 3. Calculate Retefuente
        const reteAmount = Math.round(base * (retePerc / 100));

        // 4. Calculate ICA (per thousand logic)
        const icaAmount = Math.round(base * (icaMil / 1000));

        // 5. Final Total
        const total = p - reteAmount - icaAmount;

        // Update UI
        resBase.textContent = formatCurrency(base);
        resIva.textContent = formatCurrency(ivaAmount);
        resRete.textContent = formatCurrency(reteAmount);
        resIca.textContent = formatCurrency(icaAmount);
        resTotal.textContent = formatCurrency(total);

        badgeRete.textContent = retePerc + '%';
        if (applyIcaSwitch.checked) {
            badgeIca.classList.remove('hidden');
            badgeIca.textContent = icaMil + ' x 1000';
        } else {
            badgeIca.classList.add('hidden');
        }
    }

    // Toggle logic
    hasIvaSwitch.addEventListener('change', () => {
        ivaSelectGroup.classList.toggle('hidden', !hasIvaSwitch.checked);
        calculate();
    });

    applyIcaSwitch.addEventListener('change', () => {
        icaInputGroup.classList.toggle('hidden', !applyIcaSwitch.checked);
        calculate();
    });

    // Input listeners
    [priceInput, conceptSelect, ivaRateSelect, icaRateInput].forEach(el => {
        el.addEventListener('input', calculate);
    });

    // Initial calculation
    calculate();
});
