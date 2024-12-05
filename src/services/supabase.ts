import { createClient } from '@supabase/supabase-js';
import type { Transaction } from '../types/transaction';

const supabaseUrl = 'https://sqenqiyakvalpzvuwrly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZW5xaXlha3ZhbHB6dnV3cmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwOTIxNjIsImV4cCI6MjA0ODY2ODE2Mn0.xgHqMiAiHgR2ecS_c5YhKmoGSfGH6hRyODsACvhKiwU';

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return (data || []).map(transaction => ({
      id: transaction.id,
      type: transaction.type as 'buy' | 'sell',
      symbol: transaction.symbol,
      shares: Number(transaction.shares),
      price: Number(transaction.price),
      date: new Date(transaction.date)
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        id: transaction.id,
        type: transaction.type,
        symbol: transaction.symbol,
        shares: transaction.shares,
        price: transaction.price,
        date: transaction.date.toISOString()
      });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save transaction:', error);
    throw new Error('Failed to save transaction');
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw new Error('Failed to delete transaction');
  }
}