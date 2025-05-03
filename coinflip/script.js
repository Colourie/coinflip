// Määritellään API:n perusosoite ja haetaan HTML-elementit.
const apiUrl = 'https://api.frankfurter.dev/v1';
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const resultDiv = document.getElementById('conversionResult');

// Funktio valuuttavalintojen täyttämiseen pudotusvalikoihin.
async function fillCurrencies() {
    try {
        const response = await fetch(`${apiUrl}/currencies`); // Lähetetään pyyntö valuuttalistan hakemiseksi.
        const data = await response.json(); // Muutetaan vastaus JSON-muotoon.

        for (const code in data) {
            // Luodaan ja lisätään <option>-elementit molempiin pudotusvalikoihin.
            const option1 = document.createElement('option');
            option1.value = code;
            option1.textContent = `${code} - ${data[code]}`;
            fromSelect.appendChild(option1);

            const option2 = document.createElement('option');
            option2.value = code;
            option2.textContent = `${code} - ${data[code]}`;
            toSelect.appendChild(option2);
        }

        // Oletusvalinnat valuuttavalikoille
        fromSelect.value = 'EUR';
        toSelect.value = 'USD';
    } catch (error) {
        resultDiv.textContent = 'Virhe ladattaessa valuuttoja.';
        console.error('Virhe valuuttojen haussa:', error);
    }
}

// Funktio valuutan muuntamista varten.
async function convertCurrency() {
    const amount = amountInput.value; // Haetaan muunnettava määrä.
    const from = fromSelect.value;     // Haetaan lähtövaluutta.
    const to = toSelect.value;        // Haetaan kohdevaluutta.

    // Tarkistetaan, että syöte on kelvollinen.
    if (!amount || isNaN(amount) || amount <= 0) {
        resultDiv.textContent = 'Anna kelvollinen positiivinen summa.';
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/latest?amount=${amount}&from=${from}&to=${to}`); // Lähetetään pyyntö muunnoskurssille.
        const data = await response.json(); // Muutetaan vastaus JSON-muotoon.

        if (data.rates && data.rates[to]) {
            // Jos kurssi löytyy, näytetään tulos.
            resultDiv.textContent = `${amount} ${from} on ${data.rates[to].toFixed(2)} ${to}`;
        } else {
            // Jos muunnos epäonnistuu, näytetään virheilmoitus.
            resultDiv.textContent = 'Muunnos epäonnistui.';
        }
    } catch (error) {
        resultDiv.textContent = 'Virhe haettaessa muunnostietoja.';
        console.error('Virhe muunnoksessa:', error);
    }
}

// Täytetään valuuttavalikot sivun latautuessa.
fillCurrencies();

// Enter-näppäimen käyttö 'määrä'-kentässä.
amountInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        convertCurrency();
    }
});
    

async function fetchHistoricalRates() {
    // Hakee päivämäärän valintakentästä.
    const date = document.getElementById('historicalDate').value;
    // Hakee lähtövaluutan pudotusvalikosta.
    const from = document.getElementById('fromCurrency').value;
    // Hakee kohdevaluutan pudotusvalikosta.
    const to = document.getElementById('toCurrency').value;
    // Hakee div-elementin, jossa tulos näytetään.
    const resultDiv = document.getElementById('historicalResult');

    // Tarkistaa, onko käyttäjä valinnut päivämäärän. Jos ei, näyttää viestin ja lopettaa funktion suorituksen.
    if (!date) {
        resultDiv.textContent = 'Valitse päivämäärä.';
        return;
    }

    // Muodostaa API-URL:n historiallisen kurssin hakemista varten.
    const url = `${apiUrl}/${date}?base=${from}&symbols=${to}`;

    // Lähettää pyynnön API:lle.
    const response = await fetch(url);
    // Muuntaa API:n vastauksen JSON-muotoon.
    const data = await response.json();

    // Tarkistaa, onko kurssitieto olemassa vastauksessa ja näyttää tuloksen.
    if (data.rates && data.rates[to]) {
        resultDiv.textContent = `Kurssi ${from}-${to} ${date}: ${data.rates[to]}`;
    } else {
        // Jos historiallista kurssia ei löydy, näyttää viestin.
        resultDiv.textContent = 'Historiallista kurssia ei löytynyt.';
    }
}