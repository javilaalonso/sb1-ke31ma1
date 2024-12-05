import { create } from 'zustand';
import { Stock, StockPosition } from '../types/stock';
import { Transaction } from '../types/transaction';
import { getStockQuote, ApiError } from '../services/stockApi';
import { useTransactionStore } from './transactionStore';

interface PortfolioState {
  currentPrices: { [symbol: string]: number };
  apiErrors: { [symbol: string]: ApiError };
  getPositions: () => StockPosition[];
  updateStockPrices: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  currentPrices: {},
  apiErrors: {},
  isLoading: false,
  error: null,
  lastUpdated: null,

  updateStockPrices: async () => {
    set({ isLoading: true, error: null, apiErrors: {} });
    try {
      const positions = get().getPositions();
      const symbols = [...new Set(positions.map(p => p.symbol))];
      const updatedPrices: { [symbol: string]: number } = {};
      const newApiErrors: { [symbol: string]: ApiError } = {};

      await Promise.all(
        symbols.map(async (symbol) => {
          const result = await getStockQuote(symbol);
          if ('price' in result) {
            updatedPrices[symbol] = result.price;
          } else {
            newApiErrors[symbol] = result;
            // Keep existing price if available
            if (get().currentPrices[symbol]) {
              updatedPrices[symbol] = get().currentPrices[symbol];
            }
          }
        })
      );

      set({ 
        currentPrices: updatedPrices,
        apiErrors: newApiErrors,
        lastUpdated: new Date(),
        error: Object.keys(newApiErrors).length > 0 ? 'Some stock quotes failed to update' : null
      });
    } catch (error) {
      set({ error: 'Failed to update stock prices' });
    } finally {
      set({ isLoading: false });
    }
  },

  getPositions: () => {
    const transactions = useTransactionStore.getState().transactions;
    const currentPrices = get().currentPrices;
    const positionsMap: { [symbol: string]: StockPosition } = {};

    transactions.forEach(transaction => {
      const { symbol, shares, price, type, date } = transaction;
      
      if (!positionsMap[symbol]) {
        positionsMap[symbol] = {
          symbol,
          shares: 0,
          purchasePrice: 0,
          purchaseDate: date,
          currentPrice: currentPrices[symbol] || price,
          totalValue: 0,
          totalReturn: 0,
          totalReturnPercentage: 0
        };
      }

      const position = positionsMap[symbol];
      if (type === 'buy') {
        const newTotalShares = position.shares + shares;
        const newTotalCost = (position.shares * position.purchasePrice) + (shares * price);
        position.purchasePrice = newTotalCost / newTotalShares;
        position.shares = newTotalShares;
        if (!position.purchaseDate || date < position.purchaseDate) {
          position.purchaseDate = date;
        }
      } else {
        position.shares -= shares;
      }

      if (position.shares <= 0) {
        delete positionsMap[symbol];
      } else {
        position.currentPrice = currentPrices[symbol] || price;
        position.totalValue = position.shares * position.currentPrice;
        const totalCost = position.shares * position.purchasePrice;
        position.totalReturn = position.totalValue - totalCost;
        position.totalReturnPercentage = (position.totalReturn / totalCost) * 100;
      }
    });

    return Object.values(positionsMap);
  },
}));