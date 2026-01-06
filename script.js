document.addEventListener('DOMContentLoaded', () => {
    // UVT Configuration
    const UVT_VALUES = {
        2025: 49799,
        2026: 52374
    };

    // Get current UVT value based on selected year
    function getCurrentUVT() {
        const yearSelect = document.getElementById('uvt-year');
        const selectedYear = yearSelect ? parseInt(yearSelect.value) : 2026;
        return UVT_VALUES[selectedYear] || UVT_VALUES[2026];
    }

    // Calculate retention bases dynamically based on UVT
    // Uses commercial rounding (to nearest thousand) for practical business use
    function getTablaRetencion() {
        const UVT = getCurrentUVT();
        // Round to nearest thousand for commercial use
        const UVT_10 = Math.round((UVT * 10) / 1000) * 1000;  // 524.000 (2026) or 498.000 (2025)
        const UVT_2 = Math.round((UVT * 2) / 1000) * 1000;     // 105.000 (2026) or 100.000 (2025)
        const UVT_70 = Math.round((UVT * 70) / 1000) * 1000;   // 3.666.000 (2026) or 3.486.000 (2025)

        return {
            compras_generales: { declarante: { base: UVT_10, tarifa: 0.025 }, no_declarante: { base: UVT_10, tarifa: 0.035 } },
            compras_tarjeta: { base: 0, tarifa: 0.015 },
            compras_agricolas_sin_procesamiento: { base: UVT_70, tarifa: 0.015 },
            compras_agricolas_con_procesamiento: { declarante: { base: UVT_10, tarifa: 0.025 }, no_declarante: { base: UVT_10, tarifa: 0.035 } },
            compras_cafe: { base: UVT_70, tarifa: 0.005 },
            compras_combustibles: { base: 0, tarifa: 0.001 },
            compras_vehiculos: { base: 0, tarifa: 0.01 },
            servicios_generales: { declarante: { base: UVT_2, tarifa: 0.04 }, no_declarante: { base: UVT_2, tarifa: 0.06 } },
            transporte_carga: { base: UVT_2, tarifa: 0.01 },
            transporte_pasajeros_terrestre: { declarante: { base: UVT_10, tarifa: 0.035 }, no_declarante: { base: UVT_10, tarifa: 0.035 } },
            servicios_temporales: { base: UVT_2, tarifa: 0.01 },
            servicios_vigilancia_aseo: { base: UVT_2, tarifa: 0.02 },
            servicios_hoteles_restaurantes: { declarante: { base: UVT_2, tarifa: 0.035 }, no_declarante: { base: UVT_2, tarifa: 0.035 } },
            arrendamiento_inmuebles: { declarante: { base: UVT_10, tarifa: 0.035 }, no_declarante: { base: UVT_10, tarifa: 0.035 } },
            arrendamiento_muebles: { base: 0, tarifa: 0.04 },
            honorarios_juridica: { base: 0, tarifa: 0.11 },
            honorarios_natural: { declarante: { base: 0, tarifa: 0.11 }, no_declarante: { base: 0, tarifa: 0.10 } },
            contratos_construccion: { base: UVT_10, tarifa: 0.02 },
            rendimientos_financieros: { base: 0, tarifa: 0.07 },
            otros_ingresos: { declarante: { base: UVT_10, tarifa: 0.025 }, no_declarante: { base: UVT_10, tarifa: 0.035 } }
        };
    }

    const conceptsConReteIvaServicios = ['servicios_generales', 'servicios_temporales', 'servicios_vigilancia_aseo', 'servicios_hoteles_restaurantes', 'contratos_construccion'];

    // Elements
    const priceInput = document.getElementById('price');
    const hasIvaSwitch = document.getElementById('has-iva');
    const ivaSelectGroup = document.getElementById('iva-select-group');
    const ivaRateSelect = document.getElementById('iva-rate');
    const applyIcaSwitch = document.getElementById('apply-ica');
    const icaInputGroup = document.getElementById('ica-input-group');
    const icaRateInput = document.getElementById('ica-rate');

    const buyerRegimeSelect = document.getElementById('buyer-regime');
    const sellerRegimeSelect = document.getElementById('seller-regime');

    const isReteIvaAgentCheck = document.getElementById('is-reteiva-agent');
    const reteIvaRateGroup = document.getElementById('reteiva-rate-group');
    const reteIvaRateSelect = document.getElementById('reteiva-rate');

    // Result Elements
    const resBase = document.getElementById('res-base');
    const resIva = document.getElementById('res-iva');
    const resAuto = document.getElementById('res-auto');
    const resRete = document.getElementById('res-rete');
    const resReteIva = document.getElementById('res-reteiva');
    const resIca = document.getElementById('res-ica');
    const resTotal = document.getElementById('res-total');
    const badgeRete = document.getElementById('badge-rete');
    const badgeReteIva = document.getElementById('badge-reteiva');
    const badgeIca = document.getElementById('badge-ica');

    // Card Elements for visibility control
    const cardIva = document.getElementById('card-iva');
    const cardAuto = document.getElementById('card-auto');
    const cardRete = document.getElementById('card-rete');
    const cardReteIva = document.getElementById('card-reteiva');
    const cardIca = document.getElementById('card-ica');

    const regimeOptions = {
        juridica: [
            { value: 'ordinario', label: 'Común / Ordinario' },
            { value: 'gran_contribuyente', label: 'Gran Contribuyente (O-13)' },
            { value: 'autorretenedor', label: 'Autorretenedor (O-15)' },
            { value: 'regimen_simple', label: 'Régimen Simple (O-47)' }
        ],
        natural: [
            { value: 'declarante', label: 'Persona Natural Declarante' },
            { value: 'no_declarante', label: 'Persona Natural No Declarante' },
            { value: 'regimen_simple', label: 'Régimen Simple (O-47)' }
        ]
    };

    function updateRegimeOptions(selectId, type) {
        const select = document.getElementById(selectId);
        const currentVal = select.value;
        select.innerHTML = '';

        regimeOptions[type].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            select.appendChild(o);
        });

        // Try to keep previous value if it exists in the new list
        if ([...select.options].some(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(value);
    }

    function calculate() {
        const p = parseFloat(priceInput.value) || 0;
        const ivaPerc = hasIvaSwitch.checked ? parseFloat(ivaRateSelect.value) : 0;
        const conceptKey = document.getElementById('concept').value;
        const icaMil = applyIcaSwitch.checked ? parseFloat(icaRateInput.value) || 0 : 0;

        // 1. Calculate Base and Total
        let base = p; // Input is treated as Base (without IVA)
        const ivaAmount = hasIvaSwitch.checked ? Math.round(base * (ivaPerc / 100)) : 0;
        const totalPrice = base + ivaAmount;

        // 2. Roles extraction
        const buyerType = document.querySelector('input[name="buyer-type"]:checked').value;
        const buyerRegime = buyerRegimeSelect.value;
        const sellerType = document.querySelector('input[name="seller-type"]:checked').value;
        const sellerRegime = sellerRegimeSelect.value;

        const buyerIsSimple = buyerRegime === 'regimen_simple';
        const buyerIsPJ = buyerType === 'juridica';
        const sellerIsSimple = sellerRegime === 'regimen_simple';
        const sellerIsGC = sellerRegime === 'gran_contribuyente';
        const sellerIsAuto = sellerRegime === 'autorretenedor';
        const sellerIsNoDeclarante = (sellerType === 'natural' && sellerRegime === 'no_declarante');

        // 3. Retefuente Calculation
        let reteAmount = 0;
        let autoReteAmount = 0;
        let retePerc = 0;
        const tablaRetencion = getTablaRetencion();
        const data = tablaRetencion[conceptKey];

        // Rules: No Retefuente subtraction if:
        // - Buyer is RST (not a withholding agent)
        // - Seller is RST, GC, or Auto (exempt/self-withholding)
        // BUT if Seller is RST and Buyer is NOT RST, Buyer must SELF-WITHHOLD (Autorretención)
        if (data) {
            let config = data.tarifa !== undefined ? data : (sellerIsNoDeclarante ? data.no_declarante : data.declarante);
            if (base >= config.base) {
                const calculatedValue = Math.round(base * config.tarifa);
                retePerc = config.tarifa * 100;

                if (!buyerIsSimple) {
                    if (sellerIsSimple) {
                        // Seller is RST -> Buyer self-withholds (doesn't subtract from payment)
                        autoReteAmount = calculatedValue;
                    } else if (!sellerIsGC && !sellerIsAuto) {
                        // Ordinary case -> Standard retention
                        reteAmount = calculatedValue;
                    }
                }
            }
        }

        // 4. ReteIVA Calculation (15% of IVA if Base >= Min)
        // Rules: 
        // - NO ReteIVA if Buyer is RST or Persona Natural (not withholding agents)
        // - NO ReteIVA if Seller is GC or Auto (except from PJ to RST)
        // - YES ReteIVA if Seller is RST and Buyer is PJ (15%)
        // - MANUAL OVERRIDE: If isReteIvaAgentCheck.checked, apply selected rate
        let reteIvaAmount = 0;
        let reteIvaPerc = 0;

        if (ivaAmount > 0) {
            const manualAgent = isReteIvaAgentCheck.checked;
            const manualRate = parseFloat(reteIvaRateSelect.value) / 100;

            if (manualAgent) {
                // Strictly manual calculation
                reteIvaAmount = Math.round(ivaAmount * manualRate);
                reteIvaPerc = manualRate * 100;
            }
            // All automatic logic removed as per user request
        }

        // 5. ICA Calculation
        // Rules: No ReteICA if:
        // - Buyer is RST (not a withholding agent)
        // - Seller is RST (exempt)
        // - Seller is GC and Buyer is private PJ
        let icaAmount = 0;
        if (applyIcaSwitch.checked && !buyerIsSimple && !sellerIsSimple && !sellerIsGC) {
            icaAmount = Math.round(base * (icaMil / 1000));
        }

        // 6. Final Total (Subtraction of actual retentions from payment)
        const total = totalPrice - reteAmount - reteIvaAmount - icaAmount;

        // Update UI Visibility
        cardIva.classList.toggle('hidden', ivaAmount === 0);
        cardAuto.classList.toggle('hidden', autoReteAmount === 0);
        cardRete.classList.toggle('hidden', reteAmount === 0);
        cardReteIva.classList.toggle('hidden', reteIvaAmount === 0);
        cardIca.classList.toggle('hidden', icaAmount === 0);

        // Update Values
        resBase.textContent = formatCurrency(base);
        resIva.textContent = formatCurrency(ivaAmount);
        resAuto.textContent = formatCurrency(autoReteAmount);
        resRete.textContent = formatCurrency(reteAmount);
        resReteIva.textContent = formatCurrency(reteIvaAmount);
        resIca.textContent = formatCurrency(icaAmount);
        resTotal.textContent = formatCurrency(total);

        badgeRete.textContent = Math.round(retePerc * 100) / 100 + '%';
        badgeReteIva.textContent = (reteIvaPerc > 0 ? Math.round(reteIvaPerc * 100) / 100 + '%' : '0%') + ' s/IVA';

        if (applyIcaSwitch.checked && icaAmount > 0) {
            badgeIca.classList.remove('hidden');
            let icaLabel = icaMil + ' x 1000';
            if (sellerIsSimple) icaLabel = 'Exento RST';
            if (sellerIsGC) icaLabel = 'Exento GC';
            badgeIca.textContent = icaLabel;
        } else {
            badgeIca.classList.add('hidden');
        }
    }

    // Expose to window for debugging
    window.calculate = calculate;

    // Accordion Logic
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.accordion-icon');

            content.classList.toggle('active');
            icon.style.transform = content.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    });

    // Input listeners
    priceInput.addEventListener('input', (e) => {
        // Sanitization from AUXILIAR IBAGUE.html
        let val = e.target.value.replace(/[^0-9.]/g, '');
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');

        const numericVal = parseFloat(val);
        if (numericVal > 999999999999999) val = '999999999999999';

        if (val !== e.target.value) e.target.value = val;
        calculate();
    });

    [
        buyerRegimeSelect, sellerRegimeSelect,
        document.getElementById('concept'),
        document.getElementById('uvt-year'),
        ivaRateSelect, icaRateInput,
        isReteIvaAgentCheck, reteIvaRateSelect
    ].forEach(el => el.addEventListener('change', calculate));

    isReteIvaAgentCheck.addEventListener('change', () => {
        reteIvaRateGroup.classList.toggle('hidden', !isReteIvaAgentCheck.checked);
        calculate();
    });

    // Radio buttons listeners
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const name = e.target.name;
            const type = e.target.value;
            if (name === 'buyer-type') {
                updateRegimeOptions('buyer-regime', type);
            } else if (name === 'seller-type') {
                updateRegimeOptions('seller-regime', type);
            }
            calculate();
        });
    });

    hasIvaSwitch.addEventListener('change', () => { ivaSelectGroup.classList.toggle('hidden', !hasIvaSwitch.checked); calculate(); });
    applyIcaSwitch.addEventListener('change', () => { icaInputGroup.classList.toggle('hidden', !applyIcaSwitch.checked); calculate(); });

    // Modal logic
    const openInfoBtn = document.getElementById('open-info');
    const infoModal = document.getElementById('info-modal');

    openInfoBtn.addEventListener('click', () => {
        infoModal.classList.remove('hidden');
    });

    infoModal.addEventListener('click', () => {
        infoModal.classList.add('hidden');
    });

    // Initialize regime options
    updateRegimeOptions('buyer-regime', 'juridica');
    updateRegimeOptions('seller-regime', 'juridica');

    calculate();
});
