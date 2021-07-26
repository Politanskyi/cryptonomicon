const API_KEY = 'ee1e53fc2815cd162cdaeb9a74038f574051e49a04b9733d24745bc8a9a49b77';

const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
const AGGREGATE_INDEX = '5';

socket.addEventListener('message', e => {
    const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(e.data);

    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return;
    }

    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(newPrice));
})

// const loadTickers = () => {
//     if (tickersHandlers.size === 0) {
//         return;
//     }
//
//     fetch(
//         `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD&api_key=${API_KEY}`)
//     .then(response => response.json())
//     .then(rawData => {
//         const updatedPrices = Object.fromEntries(
//             Object.entries(rawData).map(([key, value]) => [key, value.USD])
//         );
//
//         Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
//             const handlers = tickersHandlers.get(currency) ?? [];
//             handlers.forEach(fn => fn(newPrice));
//         });
//     });
// };

function sendToWebSocket (message) {
    const stringifiedMessage = JSON.stringify(message);

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage);
        return;
    }

    socket.addEventListener('open', () => {
        socket.send(stringifiedMessage);
    }, { once: true })
}

function subscribeToTickerOnWs (ticker) {
    sendToWebSocket({
        action: 'SubAdd',
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

function unsubscribeFromTickerOnWs (ticker) {
    sendToWebSocket({
        action: 'SubRemove',
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

export const subscribeToTicker = (ticker, cb) => {
    const refTicker = ticker.toUpperCase();
    const subscribers = tickersHandlers.get(refTicker) || [];
    tickersHandlers.set(refTicker, [...subscribers, cb]);

    subscribeToTickerOnWs(refTicker);
};

export const unsubscribeFromTicker = ticker => {
    const refTicker = ticker.toUpperCase();
    tickersHandlers.delete(refTicker);

    unsubscribeFromTickerOnWs(refTicker);
};

// setInterval(loadTickers, 5000);
