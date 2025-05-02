// Määritellään API:n perusosoite ja haetaan HTML-elementit.
const apiUrl = 'https://api.frankfurter.dev/v1';
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const resultDiv = document.getElementById('conversionResult');

// Funktio valuuttavalintojen täyttämiseen pudotusvalikoihin.
async function fillCurrencies() {
    const response = await fetch(`${apiUrl}/currencies`); // Lähetetään pyyntö valuuttalistan hakemiseksi.
    const data = await response.json(); // Muutetaan vastaus JSON-muotoon.
    for (const code in data) {
        // Luodaan ja lisätään <option>-elementit molempiin pudotusvalikoihin.
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
    // Oletusvalinnat valluuttavalikoille
    fromSelect.value = 'EUR';
    toSelect.value = 'USD';
}

// Funktio valuutan muuntamista varten.
async function convertCurrency() {
    const amount = amountInput.value; // Haetaan muunnettava määrä.
    const from = fromSelect.value;     // Haetaan lähtövaluutta.
    const to = toSelect.value;       // Haetaan kohdevaluutta.
    const response = await fetch(`${apiUrl}/latest?amount=${amount}&from=${from}&to=${to}`); // Lähetetään pyyntö muunnoskurssille.
    const data = await response.json(); // Muutetaan vastaus JSON-muotoon.
    if (data.rates && data.rates[to]) {
        // Jos kurssi löytyy, näytetään tulos.
        resultDiv.textContent = `${amount} ${from} on ${data.rates[to].toFixed(2)} ${to}`;
    } else {
        // Jos muunnos epäonnistuu, näytetään virheilmoitus.
        resultDiv.textContent = 'Muunnos epäonnistui.';
    }
}

// Täytetään valuuttavalikot sivun latautuessa.
fillCurrencies();
