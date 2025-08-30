    const inputEl = document.getElementById('input');
    const outputEl = document.getElementById('output');
    const errorEl  = document.getElementById('error');
    const modeRadios = [...document.querySelectorAll('input[name="mode"]')];
    const prefixCb = document.getElementById('prefix');
    const groupCb  = document.getElementById('group');
    const trimCb   = document.getElementById('trim');

    function setPlaceholder() {
      const m = getMode();
      if (m === 'd2b') {
        inputEl.placeholder = 'Introduza um número decimal (ex.: -42)';
      } else {
        inputEl.placeholder = 'Introduza um número binário (ex.: 1101, -0b1010)';
      }
    }

    function getMode(){
      return modeRadios.find(r => r.checked)?.value || 'd2b';
    }

    function sanitizeDecimal(str){
      return str.trim().replace(/^0d/i, '');
    }

    function sanitizeBinary(str){
      return str.trim().replace(/^(-?)0b/i, '$1');
    }

    function isIntegerString(str){
      return /^[-+]?\d+$/.test(str);
    }

    function isBinaryString(str){
      return /^[-+]?([01]+)$/.test(str);
    }

    function toBinaryBigInt(decStr){
      // decStr may be "+123", "-42" etc.
      try {
        const n = BigInt(decStr);
        const sign = n < 0n ? '-' : '';
        const abs = n < 0n ? -n : n;
        let bin = abs.toString(2);
        if (trimCb.checked) bin = bin.replace(/^0+(?!$)/, '');
        if (groupCb.checked) bin = groupBits(bin);
        if (prefixCb.checked) bin = (groupCb.checked? '' : '0b') + bin; // avoid prefix when grouped (it would break groups)
        return sign + bin;
      } catch(e) {
        throw new Error('Número decimal inválido.');
      }
    }

    function groupBits(bin){
      // group in nibbles from the right
      const clean = bin.replace(/\s+/g, '');
      const pad = (4 - (clean.length % 4)) % 4;
      const padded = '0'.repeat(pad) + clean;
      return padded.replace(/(.{4})/g, '$1 ').trim();
    }

    function binaryToDecimalBigInt(binStr){
      // Accept optional sign and optional 0b already stripped
      try {
        const s = binStr.startsWith('+') ? binStr.slice(1) : binStr; // BigInt handles + but we normalize
        // Use BigInt parsing with 0b prefix for simplicity
        const sign = s.startsWith('-') ? '-' : '';
        const abs = s.replace(/^[-+]?/, '').replace(/\s|_/g, '');
        if (!/^[01]+$/.test(abs)) throw new Error();
        const val = BigInt('0b' + abs);
        return sign ? '-' + val.toString(10) : val.toString(10);
      } catch(e) {
        throw new Error('Número binário inválido. Use apenas 0 e 1.');
      }
    }

    function convert(){
      errorEl.textContent = '';
      const mode = getMode();
      let raw = inputEl.value;
      if (!raw.trim()) { outputEl.textContent = '—'; return; }

      try {
        if (mode === 'd2b') {
          raw = sanitizeDecimal(raw);
          if (!isIntegerString(raw)) throw new Error('Número decimal inválido.');
          outputEl.textContent = toBinaryBigInt(raw);
        } else {
          raw = sanitizeBinary(raw);
          if (!isBinaryString(raw)) throw new Error('Número binário inválido.');
          outputEl.textContent = binaryToDecimalBigInt(raw);
        }
      } catch(err){
        outputEl.textContent = '—';
        errorEl.innerHTML = `<span class="err">Erro:</span> ${err.message}`;
      }
    }

    // UI wiring
    document.getElementById('convert').addEventListener('click', convert);
    document.getElementById('copy').addEventListener('click', async () => {
      const text = outputEl.textContent;
      if (!text || text === '—') return;
      try { await navigator.clipboard.writeText(text); errorEl.textContent = 'Resultado copiado.'; }
      catch { errorEl.innerHTML = '<span class="err">Erro:</span> não foi possível copiar.'; }
    });

    document.getElementById('clear').addEventListener('click', () => {
      inputEl.value = '';
      outputEl.textContent = '—';
      errorEl.textContent = '';
      inputEl.focus();
    });

    document.getElementById('swap').addEventListener('click', () => {
      const curr = getMode();
      document.querySelector(`input[name=mode][value=${curr === 'd2b' ? 'b2d' : 'd2b'}]`).checked = true;
      setPlaceholder();
      convert();
    });

    modeRadios.forEach(r => r.addEventListener('change', () => { setPlaceholder(); convert(); }));
    [prefixCb, groupCb, trimCb, inputEl].forEach(el => el.addEventListener('input', convert));

    // Init
    setPlaceholder();