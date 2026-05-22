export interface AssetBalance {
  USDT: number;
  BTC: number;
  ETH: number;
  SOL: number;
  BNB: number;
  XRP: number;
}

export interface TickerPrice {
  symbol: string;
  binancePrice: number;
  okxPrice: number;
  spreadPercent: number;
  highestExchange: "Binance" | "OKX";
  lowestExchange: "Binance" | "OKX";
}

export interface TradeLog {
  id: string;
  timestamp: string;
  symbol: string;
  direction: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
  volume: number;
  tradeSizeUsd: number;
  grossProfitUsd: number;
  feesUsd: number;
  netProfitUsd: number;
  status: "SUCCESS" | "FAILED" | "REJECTED_BY_RISK_CONTROL";
  riskDetails?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  type: "INFO" | "RISK_ALERT" | "TRADE" | "REBALANCE" | "AI_ADVICE";
  message: string;
}

export interface BotConfig {
  isRunning: boolean;
  minSpreadThreshold: number;
  tradeVolumeUsd: number;
  maxDailyLoss: number;
  maxSlippageLimit: number;
  rebalanceRatioThreshold: number;
  isTelegramEnabled: boolean;
  isAiOptimized: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  selectedAssets: string[];
  pricingMode: "live" | "simulated";
}

export interface TradeMetrics {
  totalTrades: number;
  grossProfit: number;
  totalFees: number;
  netProfit: number;
  dailyLoss: number;
  rebalanceCount: number;
  riskLevel: string;
}

export interface AiSentimentResult {
  isMock: boolean;
  overallSentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | "HIGH VOLATILITY";
  sentimentScore: number;
  confidence: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  analysisParagraph: string;
  targetAssetAdvisories: Array<{
    symbol: string;
    action: "OPTIMIZE_HIGH_SPREAD" | "CONSERVATIVE_SPREAD" | "SUSPEND_TEMPORARILY";
    recommendedSpreadThreshold: number;
    reason: string;
  }>;
  simulatedNews: string[];
  error?: string;
}

export interface BacktestSummary {
  totalTrades: number;
  netProfit: number;
  feesPaid: number;
  winRate: number;
  efficiencyIndex: number;
  maxDrawdownPercent: number;
}

export interface BacktestResult {
  asset: string;
  days: number;
  minSpread: number;
  feeRatePercent: number;
  summary: BacktestSummary;
  chartData: Array<{ date: string; profit: number; spread: number }>;
  sampleTrades: Array<{
    id: string;
    timestamp: string;
    asset: string;
    buyPrice: number;
    sellPrice: number;
    spreadPercent: number;
    volume: number;
    netProfit: number;
    feeUsed: number;
  }>;
}
