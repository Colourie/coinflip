// Määritellään API:n perusosoite
const apiUrl = 'https://api.frankfurter.dev/v1';

// Globaali muuttuja Chart-instanssille (voidaan alustaa heti)
let historicalChartInstance = null;

// Muuttujat, joihin HTML-elementit tallennetaan.
// Ne alustetaan vasta DOMContentLoaded-tapahtuman yhteydessä.
let amountInput;
let fromSelect;
let toSelect;
let resultDiv;
let previousAmount;

let historicalChartCanvas;
let chartTimeframeSelect;
let historicalChartMessageDiv;

let swapButton;
let decimalPlacesSelect;
let historicalResultDiv;


let resetDefaultsButton;


const DEFAULT_AMOUNT = 1;
const DEFAULT_FROM_CURRENCY = 'EUR';
const DEFAULT_TO_CURRENCY = 'USD';
const DEFAULT_HISTORICAL_DATE = ''; 


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
        if (resultDiv) resultDiv.textContent = 'Virhe ladattaessa valuuttoja.';
        console.error('Virhe valuuttojen haussa:', error);
    }
}

// Funktio historiallisten kurssien piirtämiseen
async function plotHistoricalRates() {
    if (!fromSelect || !toSelect || !historicalChartCanvas || !historicalChartMessageDiv || !chartTimeframeSelect) {
        if (historicalChartMessageDiv) historicalChartMessageDiv.textContent = 'Odota, elementtejä ladataan...';
        return;
    }

    const from = fromSelect.value;
    const to = toSelect.value;
    const chartTimeframe = chartTimeframeSelect.value;

    historicalChartMessageDiv.textContent = ''; 

    // Tämä tarkistus on edelleen tärkeä, jos valuuttoja ei ole vielä ladattu API:sta
    if (!from || !to || (fromSelect.options.length <= 1 && toSelect.options.length <= 1)) {
        historicalChartMessageDiv.textContent = 'Odota, valuuttoja ladataan...';
        return; // Älä yritä piirtää graafia ilman valuuttoja
    }

    let startDate = new Date();
    const endDate = new Date();

    switch (chartTimeframe) {
        case '7d': startDate.setDate(endDate.getDate() - 7); break;
        case '30d': startDate.setDate(endDate.getDate() - 30); break;
        case '90d': startDate.setDate(endDate.getDate() - 90); break;
        case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
        default: startDate.setDate(endDate.getDate() - 30);
    }

    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    try {
        const response = await fetch(`${apiUrl}/${formattedStartDate}..${formattedEndDate}?from=${from}&to=${to}`);
        const data = await response.json();

        if (data.rates && Object.keys(data.rates).length > 0) {
            const dates = Object.keys(data.rates).sort();
            const rates = dates.map(date => data.rates[date][to]);

            if (historicalChartInstance) {
                historicalChartInstance.destroy();
            }

            historicalChartInstance = new Chart(historicalChartCanvas, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: `Kurssi (${from} to ${to})`,
                        data: rates,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true, 
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Päivämäärä',
                                color: '#e0e0e0' 
                            },
                            ticks: {
                                color: '#e0e0e0' 
                            },
                            grid: {
                                color: 'rgba(100, 100, 100, 0.2)' 
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: `Kurssi (${from} -> ${to})`,
                                color: '#e0e0e0' 
                            },
                            ticks: {
                                color: '#e0e0e0' 
                            },
                            grid: {
                                color: 'rgba(100, 100, 100, 0.2)' 
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y.toFixed(4)}`;
                                }
                            }
                        },
                        legend: { 
                            labels: {
                                color: '#e0e0e0' 
                            }
                        }
                    }
                }
            });
        } else {
            // Jos dataa ei löytynyt, graafi tuhotaan ja näytetään viesti.
            if (historicalChartInstance) {
                historicalChartInstance.destroy();
                historicalChartInstance = null;
            }
            historicalChartMessageDiv.textContent = 'Historiallista kurssidataa ei löytynyt valitulle aikavälille tai valuuttaparille.';
        }
    } catch (error) {
        console.error('Virhe historiallisten kurssien piirtämisessä:', error);
        if (historicalChartInstance) {
            historicalChartInstance.destroy();
            historicalChartInstance = null;
        }
        if (historicalChartMessageDiv) historicalChartMessageDiv.textContent = 'Virhe haettaessa graafidataa.';
    }
}

// Funktio valuutan muuntamista varten.
async function convertCurrency() {
    if (!amountInput || !fromSelect || !toSelect || !resultDiv) return; // Turvatarkistus

    const amount = amountInput.value;
    const from = fromSelect.value;
    const to = toSelect.value;
    previousAmount = amount; // Päivitetään edellinen määrä.

    // Tarkistetaan, että syöte on kelvollinen.
    if (!amount || isNaN(amount) || amount <= 0) {
        resultDiv.textContent = 'Anna kelvollinen positiivinen summa.';
        return;
    }

    try {
        const response = await fetch(`${apiUrl}/latest?amount=${amount}&from=${from}&to=${to}`); // Lähetetään pyyntö muunnoskurssille.
        const data = await response.json(); // Muutetaan vastaus JSON-muotoon.

        if (data.rates && data.rates[to]) {
            const selectedDecimalPlaces = decimalPlacesSelect ? decimalPlacesSelect.value : '2';
            let convertedAmount = data.rates[to];
            if (selectedDecimalPlaces !== '0') {
                convertedAmount = parseFloat(convertedAmount).toFixed(parseInt(selectedDecimalPlaces));
            }
            resultDiv.textContent = `${amount} ${from} on ${convertedAmount} ${to}`;
        } else {
            resultDiv.textContent = 'Muunnos epäonnistui.';
        }
    } catch (error) {
        if (resultDiv) resultDiv.textContent = 'Virhe haettaessa muunnostietoja.';
        console.error('Virhe muunnoksessa:', error);
    }
}

async function fetchHistoricalRates() {
    const historicalDateInput = document.getElementById('historicalDate'); // Haetaan tässä, koska se ei ole globaali
    if (!historicalDateInput || !fromSelect || !toSelect || !historicalResultDiv || !decimalPlacesSelect) return; // Turvatarkistus

    const date = historicalDateInput.value;
    const from = fromSelect.value;
    const to = toSelect.value;
    const selectedDecimalPlaces = decimalPlacesSelect.value;

    if (!date) {
        historicalResultDiv.textContent = 'Valitse päivämäärä.';
        return;
    }

    const url = `${apiUrl}/${date}?base=${from}&symbols=${to}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.rates && data.rates[to]) {
            let historicalRate = data.rates[to];
            if (selectedDecimalPlaces !== '0') {
                historicalRate = parseFloat(historicalRate).toFixed(parseInt(selectedDecimalPlaces));
            }
            historicalResultDiv.textContent = `Kurssi ${from}-${to} ${date}: ${historicalRate}`;
        } else {
            historicalResultDiv.textContent = 'Historiallista kurssia ei löytynyt.';
        }
    } catch (error) {
        if (historicalResultDiv) historicalResultDiv.textContent = 'Virhe haettaessa historiallista dataa.';
        console.error('Virhe historiallisen datan haussa:', error);
    }
}
// DOMContentLoaded-tapahtuma, joka käynnistää skriptin, kun DOM on ladattu.
document.addEventListener('DOMContentLoaded', () => {
    // Haetaan HTML-elementit.
    amountInput = document.getElementById('amount');
    fromSelect = document.getElementById('fromCurrency');
    toSelect = document.getElementById('toCurrency');
    resultDiv = document.getElementById('conversionResult');

    
    previousAmount = amountInput ? amountInput.value : '1';

    historicalChartCanvas = document.getElementById('historicalChart');
    chartTimeframeSelect = document.getElementById('chartTimeframe');
    historicalChartMessageDiv = document.getElementById('historicalChartMessage');

    swapButton = document.getElementById('swapCurrencies');
    decimalPlacesSelect = document.getElementById('decimalPlaces');
    historicalResultDiv = document.getElementById('historicalResult');
    
    
    resetDefaultsButton = document.getElementById('resetDefaultsButton');


    
    fillCurrencies().then(() => {
        convertCurrency();
        plotHistoricalRates();
    });

    
    if (swapButton) {
        swapButton.addEventListener('click', function() {
            const currentFrom = fromSelect.value;
            const currentTo = toSelect.value;
            fromSelect.value = currentTo;
            toSelect.value = currentFrom;
            convertCurrency();
            plotHistoricalRates();
        });
    }

    if (fromSelect) {
        fromSelect.addEventListener('change', function() {
            if (amountInput) amountInput.value = previousAmount;
            convertCurrency();
            plotHistoricalRates();
        });
    }

    if (toSelect) {
        toSelect.addEventListener('change', function() {
            if (amountInput) amountInput.value = previousAmount;
            convertCurrency();
            plotHistoricalRates();
        });
    }

    if (amountInput) {
        amountInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                convertCurrency();
                plotHistoricalRates();
            }
        });
    }

    if (chartTimeframeSelect) {
        chartTimeframeSelect.addEventListener('change', plotHistoricalRates);
    }

    const historicalDateInput = document.getElementById('historicalDate'); // Hakee tässä, koska sitä käytetään vain tässä
    const historicalFetchButton = document.querySelector('.historical-rates button');

    if (historicalDateInput && historicalFetchButton) {
        historicalDateInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                fetchHistoricalRates();
            }
        });
        historicalFetchButton.addEventListener('click', fetchHistoricalRates);
    }

    //"Palauta oletukset" -nappi
    if (resetDefaultsButton) {
        resetDefaultsButton.addEventListener('click', () => {
            // Palauta valuuttamuuntimen kentät
            amountInput.value = DEFAULT_AMOUNT;
            fromSelect.value = DEFAULT_FROM_CURRENCY;
            toSelect.value = DEFAULT_TO_CURRENCY;
            resultDiv.textContent = ''; 

            // Palauta historiallisten kurssien kentät
            if (historicalDateInput) { 
                historicalDateInput.value = DEFAULT_HISTORICAL_DATE;
            }
            if (historicalResultDiv) {
                historicalResultDiv.textContent = ''; // Tyhjennä historiallinen tulos
            }

            
            if (decimalPlacesSelect) {
                decimalPlacesSelect.value = '2'; 
            }

            
            if (chartTimeframeSelect) {
                chartTimeframeSelect.value = '7d';
            }

            // Tuhoa ja tyhjennä graafi
            if (historicalChartInstance) {
                historicalChartInstance.destroy();
                historicalChartInstance = null;
            }
            if (historicalChartMessageDiv) {
                historicalChartMessageDiv.textContent = ''; // Tyhjennä mahdolliset graafin virheviestit
            }
        });
    }
}); // DOMContentLoaded loppuu