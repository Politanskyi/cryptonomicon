const API_KEY = 'ee1e53fc2815cd162cdaeb9a74038f574051e49a04b9733d24745bc8a9a49b77';

const tickersHandlers = new Map();

const loadTickers = () => {
    if (tickersHandlers.size === 0) {
        return;
    }

    fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
            ...tickersHandlers.keys()
        ].join(',')}&tsyms=USD&api_key=${API_KEY}`)
    .then(response => response.json())
    .then(rawData => {
        const updatedPrices =  Object.fromEntries(
            Object.entries(rawData).map(([key, value]) => [key, value.USD])
        );

        Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
            const handlers = tickersHandlers.get(currency) ?? [];
            handlers.forEach(fn => fn(newPrice));
        });
    });
};

export const subscribeToTicker = (ticker, cb) => {
    const refTicker = ticker.toUpperCase();
    const subscribers = tickersHandlers.get(refTicker) || [];
    tickersHandlers.set(refTicker, [...subscribers, cb]);
};

export const unsubscribeFromTicker = ticker => {
    const refTicker = ticker.toUpperCase();
    tickersHandlers.delete(refTicker);
};

setInterval(loadTickers, 5000);

window.tickers = tickersHandlers;

