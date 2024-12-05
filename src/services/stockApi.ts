import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = 'LOX3CRL5YSVK0T3S';
const BASE_URL = 'https://www.alphavantage.co/query';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface ApiError {
  message: string;
  details: any;
}

export async function searchSymbols(query: string): Promise<SearchResult[] | ApiError> {
  try {
    if (!query || query.length < 1) return [];
    
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
      timeout: 5000,
    });

    if (response.data.Note) {
      return {
        message: 'API Rate Limit Exceeded',
        details: response.data.Note
      };
    }

    if (!response.data.bestMatches) {
      return {
        message: 'Invalid API Response',
        details: response.data
      };
    }

    return response.data.bestMatches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      currency: match['8. currency'],
    }));

  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        message: 'Network Error',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
    return {
      message: 'Unknown Error',
      details: error
    };
  }
}

export async function getStockQuote(symbol: string): Promise<StockQuote | ApiError> {
  try {
    console.log(`Fetching quote for ${symbol}...`);
    
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
      timeout: 5000,
    });

    console.log(`API Response for ${symbol}:`, response.data);

    if (response.data.Note) {
      return {
        message: 'API Rate Limit Exceeded',
        details: response.data.Note
      };
    }

    if (!response.data['Global Quote'] || !response.data['Global Quote']['05. price']) {
      return {
        message: 'Invalid API Response',
        details: response.data
      };
    }

    const data = response.data['Global Quote'];
    return {
      symbol: data['01. symbol'],
      price: parseFloat(data['05. price']),
      change: parseFloat(data['09. change']),
      changePercent: parseFloat(data['10. change percent'].replace('%', '')),
    };

  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        message: 'Network Error',
        details: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        }
      };
    }
    return {
      message: 'Unknown Error',
      details: error
    };
  }
}