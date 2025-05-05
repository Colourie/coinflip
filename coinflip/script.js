// Määritellään api:n perusosoite ja haetaan html-elementit
const apiUrl = 'https://api.frankfurter.dev/v1';
const amountInput = document.getElementById('amount');
const fromSelect = document.getElementById('fromCurrency');
const toSelect = document.getElementById('toCurrency');
const resultDiv = document.getElementById('conversionResult');

// Muistaa edellisen syötetyn arvo
let previousAmount = amountInput.value;

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
    const to = toSelect.value;         // Haetaan kohdevaluutta.
    previousAmount = amount; // Päivitetään edellinen määrä.
    const decimalPlacesSelect = document.getElementById('decimalPlaces'); // Haetaan elementti täällä

    // Tarkistetaan, että syöte on kelvollinen.
    if (!amount || isNaN(amount) || amount <= 0) {
        resultDiv.textContent = 'Anna kelvollinen positiivinen summa.';
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/latest?amount=${amount}&from=${from}&to=${to}`); // Lähetetään pyyntö muunnoskurssille.
        const data = await response.json(); // Muutetaan vastaus JSON-muotoon.

        if (data.rates && data.rates[to]) {
            // Lisätty pyöristyksen hallinta tähän:
            const selectedDecimalPlaces = decimalPlacesSelect ? decimalPlacesSelect.value : '2'; // Käytetään oletusarvoa, jos elementtiä ei löydy
            let convertedAmount = data.rates[to];
            if (selectedDecimalPlaces !== '0') {
                convertedAmount = parseFloat(convertedAmount).toFixed(parseInt(selectedDecimalPlaces));
            }
            // Näytetään tulos pyöristettynä tai ilman pyöristystä.
            resultDiv.textContent = `${amount} ${from} on ${convertedAmount} ${to}`;
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

// Muutoksien seuraus "Mistä"-valuuttavalikossa
fromSelect.addEventListener('change', function() {
    amountInput.value = previousAmount;
});

// Muutoksien seuraus "Mihin"-valuuttavalikossa
toSelect.addEventListener('change', function() {
    amountInput.value = previousAmount;
});

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
    // haetaan desimaalien valintaelementti
    const decimalPlacesSelect = document.getElementById('decimalPlaces');
    // haetaan valittu desimaalien määrä, käytetään oletusarvoa '2' jos elementtiä ei löydy
    const selectedDecimalPlaces = decimalPlacesSelect ? decimalPlacesSelect.value : '2';

    // Tarkistaa, onko käyttäjä valinnut päivämäärän. Jos ei, näyttää viestin ja lopettaa funktion suorituksen.
    if (!date) {
        resultDiv.textContent = 'Valitse päivämäärä.';
        return;
    }

    // Muodostaa api-url:n historiallisen kurssin hakemista varten.
    const url = `${apiUrl}/${date}?base=${from}&symbols=${to}`;

    // Lähettää pyynnön api:lle.
    const response = await fetch(url);
    // Muuntaa api:n vastauksen json-muotoon.
    const data = await response.json();

    // Tarkistaa, onko kurssitieto olemassa ja näyttää tuloksen.
    if (data.rates && data.rates[to]) {
        let historicalRate = data.rates[to];
        // pyöristetään historiallinen kurssi valitun desimaalien määrän mukaan
        if (selectedDecimalPlaces !== '0') {
            historicalRate = parseFloat(historicalRate).toFixed(parseInt(selectedDecimalPlaces));
        }
        resultDiv.textContent = `Kurssi ${from}-${to} ${date}: ${historicalRate}`;
    } else {
        // Jos historiallista kurssia ei löydy, näyttää viestin.
        resultDiv.textContent = 'Historiallista kurssia ei löytynyt.';
    }
}