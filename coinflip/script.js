//Määrittelee muuttujat ja funktiot valuuttamuunnosta varten
const apiUrl = 'https://frankfurter.dev/v1/currencies';
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');

// Muunnosfunktio, joka hakee valuuttakurssit ja laskee summan
async function fillCurrencies() {
    const response = await fetch(apiUrl);
    const data = await response.json();

    for (const code in data) {
        const option1 = document.createElement('option');
        option1.value = code;
        option1.textContent = `${code} - ${data[code]}`;
        fromSelect.appendChild(option1);
//Luo valuuttavalinnat
        const option2 = document.createElement('option');
        option2.value = code;
        option2.textContent = `${code} - ${data[code]}`;
        toSelect.appendChild(option2);
    }
// Valitsee oletusvaluutat
    fromSelect.value = 'EUR';
    toSelect.value = 'USD';
}

fillCurrencies();