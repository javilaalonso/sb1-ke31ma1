import { create } from 'zustand';
import { Transaction } from '../types/transaction';
import { usePortfolioStore } from './portfolioStore';
import { getTransactions, saveTransaction, deleteTransaction } from '../services/supabase';

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => Promise<void>;
  addBulkTransactions: (transactions: Transaction[]) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  initializeTransactions: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  
  initializeTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await getTransactions();
      set({ transactions });
    } catch (error) {
      set({ error: 'Failed to load transactions' });
    } finally {
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    set({ isLoading: true, error: null });
    try {
      await saveTransaction(transaction);
      set((state) => ({
        transactions: [...state.transactions, transaction],
      }));
    } catch (error) {
      set({ error: 'Failed to add transaction' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addBulkTransactions: async (transactions) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all(transactions.map(transaction => saveTransaction(transaction)));
      set((state) => ({
        transactions: [...state.transactions, ...transactions],
      }));
    } catch (error) {
      set({ error: 'Failed to add bulk transactions' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  removeTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteTransaction(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (error) {
      set({ error: 'Failed to remove transaction' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));