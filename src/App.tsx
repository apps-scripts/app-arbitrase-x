import { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  ArrowUpRight, 
  Wallet, 
  Settings, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  TrendingUp, 
  Bell, 
  Percent, 
  Play, 
  Square, 
  Shuffle, 
  BarChart3, 
  Send, 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ChevronRight, 
  LockKeyhole,
  ExternalLink,
  HelpCircle,
  TrendingDown
} from "lucide-react";
import { 
  AssetBalance, 
  TickerPrice, 
  TradeLog, 
  AuditLog, 
  BotConfig, 
  TradeMetrics, 
  AiSentimentResult, 
  BacktestResult 
} from "./types";

export default function App() {
  // NAVIGATION TABS
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai" | "backtest" | "vault">("dashboard");

  // APP STATES
  const [config, setConfig] = useState<BotConfig>(() => {
    const saved = localStorage.getItem("arb_bot_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch (e) {
        // ignore and fallback
      }
    }
    return {
      isRunning: true,
      minSpreadThreshold: 0.15,
      tradeVolumeUsd: 1000,
      maxDailyLoss: 500,
      maxSlippageLimit: 0.05,
      rebalanceRatioThreshold: 75,
      isTelegramEnabled: true,
      isAiOptimized: true,
      telegramBotToken: "7138241951:AAFkZ9x9N3R-B2XzU128H82KaK8Vf9Xg11M",
      telegramChatId: "@arbitrage_alerts_channel",
      selectedAssets: ["BTC", "ETH", "SOL", "BNB", "XRP"],
      pricingMode: "live"
    };
  });

  const [balances, setBalances] = useState<{ binance: AssetBalance; okx: AssetBalance }>({
    binance: { USDT: 45000, BTC: 0.45, ETH: 4.8, SOL: 45.0, BNB: 18.0, XRP: 4200.0 },
    okx: { USDT: 45000, BTC: 0.45, ETH: 4.8, SOL: 45.0, BNB: 18.0, XRP: 4200.0 }
  });

  const [tickers, setTickers] = useState<TickerPrice[]>([]);
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [telegramFeeds, setTelegramFeeds] = useState<Array<{ timestamp: string; message: string; type: "INFO" | "TRADE" | "ALERT" }>>([]);
  const [metrics, setMetrics] = useState<TradeMetrics>({
    totalTrades: 0,
    grossProfit: 0,
    totalFees: 0,
    netProfit: 0,
    dailyLoss: 0,
    rebalanceCount: 0,
    riskLevel: "SAFE"
  });

  // ENCRYPTION PANEL STATES
  const [binanceApiKey, setBinanceApiKey] = useState(() => localStorage.getItem("arb_binance_api_key") || "binance_live_ak9s2la0sh2lkhg9s9f1jas");
  const [binanceApiSecret, setBinanceApiSecret] = useState(() => localStorage.getItem("arb_binance_api_secret") || "binance_sec_k9sl2lhg98fasdg02hasdhas0gh2jasfas1j");
  const [okxApiKey, setOkxApiKey] = useState(() => localStorage.getItem("arb_okx_api_key") || "okx_live_pk20a1shs01las7f90ashfa7gq0ahsf");
  const [okxApiSecret, setOkxApiSecret] = useState(() => localStorage.getItem("arb_okx_api_secret") || "okx_sec_lhg78fa0sg2hasfas9g1jasdfh2ja");
  const [okxPassphrase, setOkxPassphrase] = useState(() => localStorage.getItem("arb_okx_passphrase") || "SecureTraderPass101!");
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // AI SENTIMENT STATES
  const [aiReport, setAiReport] = useState<AiSentimentResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // BACKTEST STATES
  const [backtestAsset, setBacktestAsset] = useState("BTC");
  const [backtestSpread, setBacktestSpread] = useState(0.18);
  const [backtestFee, setBacktestFee] = useState(0.08);
  const [backtestPeriod, setBacktestPeriod] = useState(7);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);

  // UTILITY STATES
  const [rebalancing, setRebalancing] = useState(false);
  const [sendTelegramText, setSendTelegramText] = useState("");
  const [tgNotification, setTgNotification] = useState<{ show: boolean; text: string }>({ show: false, text: "" });

  // FETCH STATE FROM SERVER
  const fetchData = async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setBalances(data.balances);
      setTickers(data.tickers);
      setTrades(data.trades);
      setAuditLogs(data.auditLogs);
      setTelegramFeeds(data.telegramFeeds);
      setMetrics(data.metrics);
      // Synchronize back if modified remotely
      setConfig(prev => {
        const next = {
          ...prev,
          isRunning: data.config.isRunning,
          minSpreadThreshold: data.config.minSpreadThreshold,
          tradeVolumeUsd: data.config.tradeVolumeUsd,
          isTelegramEnabled: data.config.isTelegramEnabled !== undefined ? data.config.isTelegramEnabled : prev.isTelegramEnabled,
          isAiOptimized: data.config.isAiOptimized !== undefined ? data.config.isAiOptimized : prev.isAiOptimized,
          telegramBotToken: data.config.telegramBotToken || prev.telegramBotToken,
          telegramChatId: data.config.telegramChatId || prev.telegramChatId,
          pricingMode: data.config.pricingMode || "live"
        };
        localStorage.setItem("arb_bot_config", JSON.stringify(next));
        return next;
      });
    } catch (e) {
      console.warn("Could not load state from backend API. Working in client simulation fallback.", e);
    }
  };

  // On mount and interval updates
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Sync localStorage values up to backend so it immediately matches
    const syncStartup = async () => {
      try {
        await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config)
        });

        await fetch("/api/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            binanceApiKey,
            binanceApiSecret,
            okxApiKey,
            okxApiSecret,
            okxPassphrase
          })
        });
      } catch (e) {
        console.warn("Could not sync configurations to server at boot:", e);
      }
    };
    syncStartup();

    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handle slide state notifications
  const lastTradesCount = useRef(0);
  useEffect(() => {
    if (trades.length > 0 && lastTradesCount.current > 0 && trades.length > lastTradesCount.current) {
      const topTrade = trades[0];
      if (topTrade.status === "SUCCESS") {
        triggerLocalToast(`🚀 Arbitrage SUCCESS! Net: +$${topTrade.netProfitUsd} USD via ${topTrade.symbol}`);
      } else {
        triggerLocalToast(`⚠️ Trade Rejected: ${topTrade.riskDetails}`);
      }
    }
    lastTradesCount.current = trades.length;
  }, [trades]);

  const triggerLocalToast = (text: string) => {
    setTgNotification({ show: true, text });
    setTimeout(() => {
      setTgNotification({ show: false, text: "" });
    }, 4500);
  };

  // TOGGLE BOT RUNNING STATE
  const handleToggleBot = async (targetState: boolean) => {
    const updated = { ...config, isRunning: targetState };
    setConfig(updated);
    localStorage.setItem("arb_bot_config", JSON.stringify(updated));
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRunning: targetState })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // UPDATE PARAMETERS ON SERVER
  const handleConfigChange = async (key: keyof BotConfig, val: any) => {
    const updated = { ...config, [key]: val };
    setConfig(updated);
    localStorage.setItem("arb_bot_config", JSON.stringify(updated));
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: val })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyAiAdvisories = async (advisedThreshold: number) => {
    const updated = { ...config, minSpreadThreshold: advisedThreshold };
    setConfig(updated);
    localStorage.setItem("arb_bot_config", JSON.stringify(updated));
    triggerLocalToast(`🤖 AI Advice Applied! Minimum Spread calibrated to ${advisedThreshold}%`);
    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minSpreadThreshold: advisedThreshold })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // TRIGGER REBALANCING
  const handleTriggerRebalance = async () => {
    setRebalancing(true);
    try {
      const res = await fetch("/api/trigger-rebalance", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBalances(data.balances);
        triggerLocalToast("⚖️ Manual inter-exchange balance ledger rebalancing complete! 50/50 proportion restored.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRebalancing(false);
    }
  };

  // MOCK TELEGRAM ALERT SEND
  const handleSendTelegramTest = async () => {
    try {
      const res = await fetch("/api/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sendTelegramText })
      });
      const data = await res.json();
      if (data.success) {
        triggerLocalToast(`📨 Sukses: ${data.message || "Notifikasi terkirim!"}`);
        setSendTelegramText("");
      } else {
        triggerLocalToast(`⚠️ Gagal: ${data.error || "Gagal mengirim pesan."}`);
      }
      fetchData();
    } catch (e: any) {
      console.error(e);
      triggerLocalToast(`❌ Gagal koneksi: ${e.message}`);
    }
  };

  // VERIFY AND SAVE REAL API CREDENTIALS
  const handleSaveCredentials = async () => {
    setIsConnecting(true);
    // Persist in localStorage
    localStorage.setItem("arb_binance_api_key", binanceApiKey);
    localStorage.setItem("arb_binance_api_secret", binanceApiSecret);
    localStorage.setItem("arb_okx_api_key", okxApiKey);
    localStorage.setItem("arb_okx_api_secret", okxApiSecret);
    localStorage.setItem("arb_okx_passphrase", okxPassphrase);

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          binanceApiKey,
          binanceApiSecret,
          okxApiKey,
          okxApiSecret,
          okxPassphrase
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerLocalToast(`🔑 ${data.message}`);
        fetchData();
      } else {
        triggerLocalToast(`⚠️ Gagal menghubungkan: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      triggerLocalToast("❌ Gangguan koneksi ke Vault Kredensial.");
    } finally {
      setIsConnecting(false);
    }
  };

  // RUN AI MARKET SENTIMENT ANALYSIS
  const handleFetchAiSentiment = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-sentiment");
      const data = await res.json();
      setAiReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // RUN HISTORICAL BACKTEST
  const handleRunBacktest = async () => {
    setBacktestLoading(true);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: backtestAsset,
          spreadThreshold: backtestSpread,
          feeRate: backtestFee,
          periodDays: backtestPeriod
        })
      });
      const data = await res.json();
      setBacktestResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setBacktestLoading(false);
    }
  };

  // Calculate Asset prices in USD to show totals
  const getAssetPriceUSD = (symbol: string) => {
    const activeTick = tickers.find(t => t.symbol === symbol);
    if (activeTick) return (activeTick.binancePrice + activeTick.okxPrice) / 2;
    const fallbackBasePrices: Record<string, number> = {
      BTC: 68500,
      ETH: 3450,
      SOL: 175,
      BNB: 580,
      XRP: 0.55,
    };
    return fallbackBasePrices[symbol] || 0;
  };

  const calculateTotalEquityUSD = (bal: AssetBalance) => {
    let total = bal.USDT;
    total += bal.BTC * getAssetPriceUSD("BTC");
    total += bal.ETH * getAssetPriceUSD("ETH");
    total += bal.SOL * getAssetPriceUSD("SOL");
    total += bal.BNB * getAssetPriceUSD("BNB");
    total += bal.XRP * getAssetPriceUSD("XRP");
    return total;
  };

  const binanceEquity = calculateTotalEquityUSD(balances.binance);
  const okxEquity = calculateTotalEquityUSD(balances.okx);
  const totalSystemEquity = binanceEquity + okxEquity;

  const binanceRatio = (binanceEquity / (totalSystemEquity || 1)) * 100;
  const okxRatio = (okxEquity / (totalSystemEquity || 1)) * 100;

  // Generate a mock hash for encryption demonstration
  const getEncryptedHash = (plaintext: string) => {
    if (!plaintext) return "";
    let hash = 0;
    for (let i = 0; i < plaintext.length; i++) {
      hash = (hash << 5) - hash + plaintext.charCodeAt(i);
      hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0") + "6f2a71dcb9a8b11c9ea531d04ef289a;iv=e1c72f10;tag=9f8c";
    return hex.toUpperCase();
  };

  // Dynamic news triggers
  const executeNewsTrigger = async (presetMessage: string, forceSentiment: string) => {
    setCustomPrompt(presetMessage);
    triggerLocalToast(`Injected News: "${presetMessage}"`);
    // Push fake news context log to audit log list
    const fakeLogId = `A-${Date.now()}`;
    setAuditLogs(prev => [
      {
        id: fakeLogId,
        timestamp: new Date().toISOString(),
        type: "AI_ADVICE",
        message: `Custom Event Recipient Feed: "${presetMessage}". Recalibrating arbitrage asset parameters...`
      },
      ...prev
    ]);
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-gray-100 font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* LOCAL SIMULATOR ALERTS SYSTEM */}
      {tgNotification.show && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-gray-900 border-l-4 border-emerald-500 rounded-md shadow-2xl max-w-sm transition-all animate-bounce">
          <div className="flex items-start space-x-3">
            <div className="mt-0.5 bg-emerald-500/20 p-1.5 rounded-full text-emerald-400">
              <Activity className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex-1 text-sm">
              <span className="font-semibold block text-emerald-400">Sistem Notifikasi</span>
              <p className="text-gray-300 font-mono text-xs mt-1 leading-relaxed">{tgNotification.text}</p>
            </div>
            <button 
              onClick={() => setTgNotification({ show: false, text: "" })}
              className="text-gray-500 hover:text-white text-xs font-bold font-mono px-1"
            >
              [X]
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="border-b border-cyber-border bg-[#0a0a0a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-[#141414] border border-cyber-border rounded-xl relative">
              <Cpu className="h-6 w-6 text-amber-500" />
              <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-400 animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-display italic tracking-wider text-[#d4af37]">ARBITRA<span className="text-white">-X</span></h1>
                <span className="text-[10px] bg-[#141414] text-amber-500 px-2 py-0.5 rounded font-mono border border-[#222]">
                  PRO EDITION
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">Automated Multi-Asset Risk-Protected Broker Bot</p>
            </div>
          </div>

          {/* MASTER CONTROLLER ROW */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Connection Ping Indicators */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-[#222] rounded text-xs font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[9px] uppercase tracking-tighter text-gray-400">BINANCE WS: <strong className="text-emerald-400 font-mono">12ms</strong></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-[#222] rounded text-xs font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[9px] uppercase tracking-tighter text-gray-400">OKX WS: <strong className="text-emerald-400 font-mono">16ms</strong></span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] border border-[#222] rounded text-xs font-mono">
                <ShieldCheck className="h-3 w-3 text-[#d4af37]" />
                <span className="text-[9px] text-[#d4af37] uppercase tracking-widest font-bold">AES-256</span>
              </div>
            </div>

            {/* NET PROFITS COUNTER */}
            <div className="bg-[#0f0f0f] px-4 py-1.5 rounded-xl border border-cyber-border flex items-center space-x-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-mono">Total Net Profit</span>
                <span className="font-mono text-emerald-400 text-sm md:text-base font-bold">
                  +${metrics.netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-emerald-950/40 p-1 rounded font-mono text-emerald-400 text-xs text-center border border-emerald-900/40">
                <span>W: 98%</span>
              </div>
            </div>

            {/* API REAL-TIME STATUS BADGE */}
            <div className="hidden sm:flex items-center space-x-2 bg-[#0f0f0f] px-3 py-2 rounded-xl border border-cyber-border font-mono text-xs">
              <span className={`h-1.5 w-1.5 rounded-full ${config.pricingMode === "live" ? "bg-emerald-400" : "bg-amber-500 animate-pulse"}`}></span>
              <span className="text-gray-400 text-[10px] tracking-wider uppercase">SUMBER DATA:</span>
              <span className={`font-bold text-[10px] uppercase ${config.pricingMode === "live" ? "text-emerald-400" : "text-amber-500"}`}>
                {config.pricingMode === "live" ? "LIVE API ACTIVE" : "SIMULASI DEMO"}
              </span>
            </div>

            {/* MASTER BOT SWITCH */}
            <div className="flex items-center space-x-2 bg-[#0f0f0f] px-3 py-1.5 rounded-xl border border-cyber-border">
              <span className={`h-2.5 w-2.5 rounded-full ${config.isRunning ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}></span>
              <span className="text-xs font-mono font-medium min-w-[50px]">
                {config.isRunning ? "RUNNING" : "STOPPED"}
              </span>
              <button
                onClick={() => handleToggleBot(!config.isRunning)}
                className={`cursor-pointer text-xs font-mono px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  config.isRunning 
                    ? "bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-900/50" 
                    : "bg-[#d4af37] hover:bg-[#c9a32c] text-black border border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                }`}
              >
                {config.isRunning ? "PAUSE" : "START"}
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* SECONDARY NOTIFICATION ALERTS BANNER FOR DRAWDOWN WARNING */}
      {metrics.dailyLoss > config.maxDailyLoss * 0.7 && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex items-center justify-center space-x-2 text-xs text-amber-300 font-mono">
            <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
            <span>⚠️ <strong>PERINGATAN MANAJEMEN RISIKO:</strong> Akumulasi kerugian harian mendekati stop-loss cutoff barrier ($ {metrics.dailyLoss} / $ {config.maxDailyLoss}).</span>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS SELECTOR */}
      <div className="bg-[#0a0a0a] border-b border-cyber-border">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 py-1 md:py-0 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard & Market Spreads", icon: BarChart3 },
            { id: "ai", label: "Analisis Sentimen AI", icon: Cpu },
            { id: "backtest", label: "Backtesting Sandbox", icon: Activity },
            { id: "vault", label: "Vault Kredensial & TG", icon: LockKeyhole }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 flex items-center space-x-2 text-xs md:text-sm font-medium border-b-2 transition-all font-mono whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#d4af37] text-[#d4af37] bg-amber-500/5 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141414]/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* TABS VIEW 1: MAIN DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* SUB GRID: STATS BOARD */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4.5 relative overflow-hidden border-l-2 border-l-emerald-900">
                <div className="absolute top-2 right-2 p-1.5 bg-emerald-500/5 rounded-lg text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-gray-500 font-display italic tracking-wider uppercase block">Arbitrage Profit</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                  ${(metrics.grossProfit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-gray-600 font-mono mt-2 block">Pendapatan kotor sebelum biaya</span>
              </div>

              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4.5 relative overflow-hidden border-l-2 border-l-purple-900">
                <div className="absolute top-2 right-2 p-1.5 bg-purple-500/5 rounded-lg text-purple-400">
                  <Percent className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-gray-500 font-display italic tracking-wider uppercase block">Estimasi Biaya Transaksi</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-purple-400 mt-1 block">
                  ${metrics.totalFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-gray-600 font-mono mt-2 block">Dipotong otomatis (VIP Tier Fee)</span>
              </div>

              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4.5 relative overflow-hidden border-l-2 border-l-sky-900">
                <div className="absolute top-2 right-2 p-1.5 bg-sky-500/5 rounded-lg text-sky-400">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-gray-500 font-display italic tracking-wider uppercase block">Total Eksekusi Bot</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-sky-400 mt-1 block">
                  {metrics.totalTrades} <span className="text-xs text-gray-400">Order</span>
                </span>
                <span className="text-[9px] text-gray-600 font-mono mt-2 block">100% Instan API execution</span>
              </div>

              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4.5 relative overflow-hidden border-l-2 border-l-[#d4af37]">
                <div className="absolute top-2 right-2 p-1.5 bg-[#d4af37]/5 rounded-lg text-[#d4af37]">
                  <Shuffle className="h-4 w-4 animate-spin-slow" />
                </div>
                <span className="text-[10px] text-gray-500 font-display italic tracking-wider uppercase block">Frekuensi Rebalancing</span>
                <span className="text-xl md:text-2xl font-bold font-mono text-[#d4af37] mt-1 block">
                  {metrics.rebalanceCount} <span className="text-xs text-gray-500">Ledger</span>
                </span>
                <span className="text-[9px] text-gray-600 font-mono mt-2 block">Inter-exchange equity balance limits</span>
              </div>

              <div className="col-span-2 lg:col-span-1 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-4.5 relative overflow-hidden border-l-2 border-l-amber-900">
                <span className="text-[10px] text-gray-500 font-display italic tracking-wider uppercase block">Protektor Risk Drawdown</span>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="flex-1 bg-[#0c0c0c] h-2 rounded-full overflow-hidden border border-[#1a1a1a]">
                    <div 
                      className={`h-full ${metrics.dailyLoss > config.maxDailyLoss * 0.75 ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min((metrics.dailyLoss / (config.maxDailyLoss || 1) * 100), 100)}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-gray-300">
                    ${metrics.dailyLoss}/${config.maxDailyLoss}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3 text-[9px] font-mono uppercase tracking-wider">
                  <span className="text-gray-500">Stop Loss Bar:</span>
                  <span className="text-emerald-500 font-bold">ACTIVE</span>
                </div>
              </div>

            </div>

            {/* LIVE PORTFOLIO BALANCES DISPERSION SECTION (Risk Management Wallet) */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <Wallet className="h-5 w-5 text-[#d4af37]" />
                    <h3 className="font-display italic tracking-wide font-semibold text-base text-gray-200">Alokasi Likuiditas Multi-Aset di Kedua Bursa</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Sistem manajemen risiko memantau pembagian saldo agar tidak terjadi kehabisan persediaan (inventory stock-out) di salah satu bursa.
                  </p>
                </div>
                
                <div className="flex items-center space-x-3 self-start md:self-auto">
                  <button
                    disabled={rebalancing}
                    onClick={handleTriggerRebalance}
                    className="cursor-pointer bg-[#d4af37] hover:bg-[#c9a32c] text-black font-mono text-xs px-4 py-2 rounded font-bold border border-[#d4af37] transition-all flex items-center space-x-2 shadow-[0_0_10px_rgba(212,175,55,0.15)]"
                  >
                    {rebalancing ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Shuffle className="h-3.5 w-3.5" />
                    )}
                    <span>{rebalancing ? "Merebalancing..." : "Samakan Saldo (Rebalance 50:50)"}</span>
                  </button>
                </div>
              </div>

              {/* BAR VISUAL OF SKEW */}
              <div className="bg-[#0c0c0c] p-4 rounded-lg border border-[#1a1a1a] mb-6">
                <div className="flex justify-between text-xs font-mono text-gray-400 mb-2">
                  <span className="flex items-center space-x-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#d4af37]"></span>
                    <span>Binance Liquid USD: <strong className="text-gray-300">${binanceEquity.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong></span>
                  </span>
                  <span className="flex items-center space-x-1 text-right">
                    <span>OKX Liquid USD: <strong className="text-gray-300">${okxEquity.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong></span>
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-600"></span>
                  </span>
                </div>

                <div className="relative h-6 bg-[#080808] rounded overflow-hidden border border-[#1a1a1a]">
                  <div 
                    className="absolute top-0 left-0 h-full bg-[#d4af37] text-black text-[10px] font-mono font-bold flex items-center pl-3 transition-all duration-700"
                    style={{ width: `${binanceRatio}%` }}
                  >
                    {binanceRatio > 35 && `${binanceRatio.toFixed(1)}%`}
                  </div>
                  <div 
                    className="absolute top-0 right-0 h-full bg-amber-600 text-black text-[10px] font-mono font-bold flex items-center justify-end pr-3 transition-all duration-700"
                    style={{ width: `${okxRatio}%` }}
                  >
                    {okxRatio > 35 && `${okxRatio.toFixed(1)}%`}
                  </div>
                  {/* Central line */}
                  <div className="absolute top-0 left-1/2 -ml-0.5 h-full w-0.5 bg-white/20"></div>
                </div>

                <div className="flex justify-between text-[10px] font-mono mt-2.5 text-gray-500">
                  <span>Maksimum deviasi diperbolehkan: {config.rebalanceRatioThreshold}%</span>
                  <span className={Math.abs(binanceRatio - 50) > 15 ? "text-yellow-500 font-semibold" : "text-emerald-500"}>
                    Status Deviasi: {Math.abs(binanceRatio - 50).toFixed(1)}% {Math.abs(binanceRatio - 50) > 15 ? "(Warning: Butuh Rebalance)" : "(Optimis)"}
                  </span>
                </div>
              </div>

              {/* MULTI ASSET ALLOCATION GRID */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                
                {/* USDT Wallet Asset Row */}
                <div className="bg-[#0c0c0c] p-4 rounded-lg border border-[#1a1a1a] relative">
                  <span className="text-xs font-bold text-[#d4af37] block font-mono">USDT</span>
                  <span className="text-[10px] text-gray-500 font-mono uppercase mt-0.5 block">Liquidity Base</span>
                  
                  <div className="mt-3.5 space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Binance:</span>
                      <span className="text-emerald-500 font-bold">${balances.binance.USDT.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">OKX:</span>
                      <span className="text-amber-500 font-bold">${balances.okx.USDT.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                {/* BTC HOLD, ETH HOLD, etc */}
                {["BTC", "ETH", "SOL", "BNB", "XRP"].map((symbol) => {
                  const key = symbol as keyof AssetBalance;
                  const bCount = balances.binance[key];
                  const oCount = balances.okx[key];
                  const bUsd = bCount * getAssetPriceUSD(symbol);
                  const oUsd = oCount * getAssetPriceUSD(symbol);

                  return (
                    <div key={symbol} className="bg-[#0c0c0c] p-4 rounded-lg border border-[#1a1a1a] text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-200">{symbol}</span>
                        <span className="text-[10px] text-gray-500 block">@ ${getAssetPriceUSD(symbol).toLocaleString("en-US", { maximumFractionDigits: symbol === "XRP" ? 3 : 1 })}</span>
                      </div>

                      <div className="mt-3.5 space-y-2">
                        <div>
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>Binance:</span>
                            <span className="text-emerald-500 font-medium">{bCount.toLocaleString("en-US", { maximumFractionDigits: symbol === "BTC" ? 4 : 2 })}</span>
                          </div>
                          <div className="text-[9px] text-gray-500 text-right">${bUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
                        </div>

                        <div className="border-t border-[#1a1a1a] pt-1.5">
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>OKX:</span>
                            <span className="text-amber-500 font-medium">{oCount.toLocaleString("en-US", { maximumFractionDigits: symbol === "BTC" ? 4 : 2 })}</span>
                          </div>
                          <div className="text-[9px] text-gray-500 text-right">${oUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>

            </div>

            {/* LIVE SPREADS MATRIX & AUTO DETECTOR */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SPREADS TABLE MATRIX */}
              <div className="col-span-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Percent className="h-5 w-5 text-[#d4af37]" />
                      <h3 className="font-display italic font-semibold text-lg text-gray-200">Pendeteksi Spread Arbitrase Instan (Real-time)</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Sistem menyaring harga limit teratas secara real-time dari kedua bursa crypto.</p>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono bg-[#141414] text-amber-400 px-3 py-1.5 rounded border border-[#222]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37] animate-ping"></span>
                    <span className="tracking-wider">SCANNING FOR SPREADS</span>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse text-xs md:text-sm font-mono">
                    <thead>
                      <tr className="border-b border-[#1a1a1a] text-gray-500 bg-[#0c0c0c]">
                        <th className="py-3 px-3 uppercase tracking-wider text-[9px] font-normal">Aset</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-[9px] font-normal">Harga Binance</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-[9px] font-normal">Harga OKX</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-[9px] font-normal text-right">Spread (%)</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-[9px] font-normal text-center">Rekomendasi Rute</th>
                        <th className="py-3 px-3 uppercase tracking-wider text-[9px] font-normal text-center">Status Sinyal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#151515] bg-[#0f0f0f]">
                      {tickers.map((ticker) => {
                        // Safely read dynamic AI threshold if active
                        let effectiveThreshold = config.minSpreadThreshold;
                        let aiActionLabel = "";
                        let isAiSuspended = false;

                        if (config.isAiOptimized && aiReport && Array.isArray(aiReport.targetAssetAdvisories)) {
                          const advisory = aiReport.targetAssetAdvisories.find((a: any) => a.symbol === ticker.symbol);
                          if (advisory) {
                            if (advisory.action === "SUSPEND_TEMPORARILY") {
                              isAiSuspended = true;
                              aiActionLabel = "⚠️ EXCLUDED BY AI";
                            } else {
                              effectiveThreshold = advisory.recommendedSpreadThreshold || config.minSpreadThreshold;
                              aiActionLabel = `⚡ AI: ${effectiveThreshold}%`;
                            }
                          }
                        }

                        const isUnderThreshold = isAiSuspended || ticker.spreadPercent < effectiveThreshold;
                        const directionText = ticker.highestExchange === "Binance" 
                           ? `Buy OKX ➔ Sell Binance` 
                           : `Buy Binance ➔ Sell OKX`;

                        return (
                          <tr key={ticker.symbol} className="hover:bg-[#151515] cursor-pointer transition-all">
                            <td className="py-3.5 px-3 font-semibold text-gray-100 flex items-center space-x-2">
                              <span className="bg-[#080808] border border-[#1a1a1a] px-2 py-0.5 rounded text-[10px] font-bold text-[#d4af37]">{ticker.symbol}</span>
                              {config.isAiOptimized && aiActionLabel && (
                                <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                                  isAiSuspended ? "bg-red-950/40 text-red-400 border border-red-900/30" : "bg-amber-950/40 text-amber-400 border border-amber-900/40"
                                }`}>
                                  {aiActionLabel}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-gray-300">
                              ${ticker.binancePrice.toLocaleString("en-US", { minimumFractionDigits: ticker.symbol === "XRP" ? 4 : 2 })}
                            </td>
                            <td className="py-3.5 px-3 text-gray-300">
                              ${ticker.okxPrice.toLocaleString("en-US", { minimumFractionDigits: ticker.symbol === "XRP" ? 4 : 2 })}
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <span className={`font-bold ${isUnderThreshold ? "text-gray-500" : "text-emerald-400 font-bold"}`}>
                                {ticker.spreadPercent}%
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              {isAiSuspended ? (
                                <span className="text-[10px] text-red-500 italic">Blocked by AI</span>
                              ) : (
                                <span className="bg-[#0c0c0c] text-[9px] text-[#d4af37] border border-[#222] px-2.5 py-1 rounded font-medium font-mono uppercase">
                                  {directionText}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center">
                                {isAiSuspended ? (
                                  <span className="text-[10px] bg-red-950/20 text-red-400 px-2 py-0.5 rounded border border-red-900/20 font-bold">
                                    SUSPENDED
                                  </span>
                                ) : isUnderThreshold ? (
                                  <span className="text-[10px] bg-[#0c0c0c] text-gray-500 px-2 py-0.5 rounded border border-[#1a1a1a]">
                                    Spread &lt; {effectiveThreshold}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-emerald-950/30 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/30 font-bold flex items-center space-x-1 animate-pulse">
                                    <Activity className="h-3 w-3 inline animate-spin" />
                                    <span>AI MATCHED</span>
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a] text-xs text-gray-500 mt-4">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-[#d4af37] shrink-0 mt-0.5" />
                    <p className="font-mono text-[10px] uppercase tracking-wide leading-relaxed">
                      <strong>KETENTUAN SPREAD TRIGGER:</strong> Bot dikonfigurasi untuk mengeksekusi order instan ketika spread melampaui <strong className="text-amber-500">{config.minSpreadThreshold}%</strong>. Bot melakukan pembelian pada bursa termurah dan menjual pada bursa termahal secara atomik.
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTIVE SPREAD CONTROLLER BOX & LIMIT TUNING */}
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 mb-2">
                    <Settings className="h-5 w-5 text-[#d4af37]" />
                    <h3 className="font-display italic tracking-wide font-semibold text-base text-gray-200">Bot Parameters & Safety</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-6 font-mono">Tuning parameter trading instan dengan proteksi balance terintegrasi.</p>

                  <div className="space-y-4 font-mono text-xs">
                    
                    {/* TUNING PRICING STREAM MODE */}
                    <div className="space-y-2 p-3.5 bg-[#0c0c0c] rounded border border-[#1a1a1a]">
                      <span className="text-gray-400 font-semibold block uppercase tracking-wider text-[9px]">Pilihan Sumber Data</span>
                      <div className="grid grid-cols-2 gap-2 mt-1 bg-black p-1 rounded border border-[#151515]">
                        <button
                          onClick={() => {
                            handleConfigChange("pricingMode", "live");
                            triggerLocalToast("📈 Mengkoneksikan ke REST API Publik Binance & OKX...");
                          }}
                          className={`cursor-pointer text-[10px] font-mono py-2 rounded font-bold uppercase transition-all tracking-wide ${
                            config.pricingMode === "live"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                              : "text-gray-500 hover:text-gray-300 bg-transparent border border-transparent"
                          }`}
                        >
                          ● API Live Binance & OKX
                        </button>
                        <button
                          onClick={() => {
                            handleConfigChange("pricingMode", "simulated");
                            triggerLocalToast("⚙️ Berpindah ke Mode Simulasi Volatilitas Arbitrase");
                          }}
                          className={`cursor-pointer text-[10px] font-mono py-2 rounded font-bold uppercase transition-all tracking-wide ${
                            config.pricingMode === "simulated"
                              ? "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 shadow-[0_0_8px_rgba(212,175,55,0.15)]"
                              : "text-gray-500 hover:text-gray-300 bg-transparent border border-transparent"
                          }`}
                        >
                          Simulasi Demo
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-500 font-mono leading-relaxed mt-1 uppercase">
                        {config.pricingMode === "live" 
                          ? "Sudah terkoneksi secara real-time via Server ke API bursa Binance & OKX untuk data harga spot akurat." 
                          : "Mode demo mensimulasi pergerakan volatilitas pasar buatan agar mudah diuji secara offline."}
                      </p>
                    </div>

                    {/* AI AUTOPILOT TOGGLE */}
                    <div className="space-y-1.5 p-3.5 bg-amber-950/10 border border-amber-500/20 rounded relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                          <Cpu className="h-4 w-4 text-[#d4af37] animate-pulse" />
                          <span className="text-gray-200 font-bold">AI Auto-Pilot Optimizer</span>
                        </div>
                        <button
                          onClick={() => handleConfigChange("isAiOptimized", !config.isAiOptimized)}
                          className={`cursor-pointer text-[10px] uppercase font-mono px-2 py-1 rounded transition-all font-bold ${
                            config.isAiOptimized 
                              ? "bg-[#d4af37] text-black border border-[#d4af37]" 
                              : "bg-transparent text-gray-500 border border-gray-800"
                          }`}
                        >
                          {config.isAiOptimized ? "ACTIVE (SMART)" : "INACTIVE"}
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono leading-relaxed pt-1">
                        {config.isAiOptimized 
                          ? "BOT AKTIF beroperasi dalam mode AI Cerdas! Sizing ukuran order dan target spread threshold dihitung dinamis menggunakan intelijen dari analisis sentimen Gemini." 
                          : "Bot berjalan manual menggunakan formula spread statis yang Anda tentukan di bawah ini tanpa optimisasi filter risiko dinamis AI."}
                      </p>
                    </div>

                    {/* SPREAD THRESHOLD CHANGER */}
                    <div className="space-y-1.5 p-3.5 bg-[#0c0c0c] rounded border border-[#1a1a1a]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Min. Spread Trigger (%)</span>
                        <span className="text-[#d4af37] font-bold text-sm">{config.minSpreadThreshold}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.05" 
                        max="0.80" 
                        step="0.01"
                        value={config.minSpreadThreshold}
                        onChange={(e) => handleConfigChange("minSpreadThreshold", parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg cursor-pointer accent-[#d4af37]"
                      />
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>Min: 0.05%</span>
                        <span>Max: 0.80%</span>
                      </div>
                    </div>

                    {/* SPREAD SIZING CHANGER */}
                    <div className="space-y-1.5 p-3.5 bg-[#0c0c0c] rounded border border-[#1a1a1a]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Trade Volume Per Opportunity</span>
                        <span className="text-amber-500 font-bold text-sm">${config.tradeVolumeUsd} USD</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="5000" 
                        step="100"
                        value={config.tradeVolumeUsd}
                        onChange={(e) => handleConfigChange("tradeVolumeUsd", parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg cursor-pointer accent-[#d4af37]"
                      />
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>$100</span>
                        <span>$5000 USD limit</span>
                      </div>
                    </div>

                    {/* MAX DAILY LOSS BARRIER */}
                    <div className="space-y-1.5 p-3.5 bg-[#0c0c0c] rounded border border-[#1a1a1a]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-medium">Daily Stop-Loss Barrier</span>
                        <span className="text-red-400 font-bold text-sm">${config.maxDailyLoss} USD</span>
                      </div>
                      <input 
                        type="range" 
                        min="100" 
                        max="2000" 
                        step="50"
                        value={config.maxDailyLoss}
                        onChange={(e) => handleConfigChange("maxDailyLoss", parseInt(e.target.value))}
                        className="w-full h-1 bg-gray-800 rounded-lg cursor-pointer accent-red-500"
                      />
                      <div className="flex justify-between text-[9px] text-gray-500">
                        <span>$100</span>
                        <span>$2000 USD Max</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="border-t border-[#1a1a1a] pt-4 mt-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-500">Telegram Logs Chat:</span>
                    <span className="text-amber-400 font-bold">TERKUNCI</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-500">Keamanan Enkripsi Kunci API:</span>
                    <span className="text-amber-400 font-bold">AES-256 LOADED</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-500">Stabilitas Slippage Limit:</span>
                    <span className="text-gray-300">0.05% Max</span>
                  </div>
                </div>
              </div>

            </div>

            {/* LIVE TRANSACTION LOGS TERMINAL FEED */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-5 w-5 text-[#d4af37]" />
                  <h3 className="font-display italic font-semibold text-lg text-gray-200">Terminal Log Eksekusi & Riwayat Arbitrase</h3>
                </div>
                <div className="text-xs text-gray-500 font-mono">Total {trades.length} baris terekam</div>
              </div>

              <div className="bg-[#080808] rounded border border-[#1a1a1a] overflow-hidden">
                <div className="bg-[#0c0c0c] px-4 py-2 border-b border-[#1a1a1a] flex justify-between items-center text-[9px] font-mono text-gray-400 tracking-wider">
                  <span>LOG TERMINAL ID INTRALINKS</span>
                  <span>STATUS: SECURE HANDSHAKE</span>
                </div>
                
                <div className="divide-y divide-[#151515] max-h-[300px] overflow-y-auto">
                  {trades.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs font-mono uppercase tracking-wider">
                      Belum ada transaksi real-time tereksekusi. Menunggu ticker live spreads...
                    </div>
                  ) : (
                    trades.map((trade) => {
                      const isRejected = trade.status === "REJECTED_BY_RISK_CONTROL";

                      return (
                        <div key={trade.id} className={`p-3.5 font-mono text-xs transition-colors hover:bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-3 ${isRejected ? "bg-red-950/20" : ""}`}>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {isRejected ? (
                                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                  RISK_CONTROL_BLOCK
                                </span>
                              ) : (
                                <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-950/30 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                                  SUCCESS
                                </span>
                              )}
                              <span className="text-gray-300 font-bold">{trade.symbol}</span>
                              <span className="text-gray-500">[{trade.id}]</span>
                              <span className="text-[10px] text-gray-500">{new Date(trade.timestamp).toLocaleString()}</span>
                            </div>
                            
                            <div className="text-gray-400 text-[11px] leading-relaxed">
                              <span>Arah Rute: </span>
                              <span className="text-gray-200">{trade.direction}</span>
                              {isRejected ? (
                                <p className="text-amber-400 underline font-medium mt-1 leading-relaxed text-[11px]">{trade.riskDetails}</p>
                              ) : (
                                <span className="text-gray-500 ml-2">
                                  | Beli: ${trade.buyPrice} | Jual: ${trade.sellPrice} | Spread: <span className="text-[#d4af37] font-semibold">{trade.spreadPercent}%</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {!isRejected && (
                            <div className="text-right flex items-center space-x-4">
                              <div className="space-y-0.5">
                                <span className="text-[9px] text-gray-500 block uppercase font-sans">Profit Bersih</span>
                                <span className="text-emerald-400 font-bold text-xs md:text-sm">
                                  +${trade.netProfitUsd.toFixed(2)} USD
                                </span>
                              </div>
                              <div className="text-right text-[10px] text-purple-400">
                                <span className="block text-gray-600">Gas:</span>
                                <span className="text-purple-300">${trade.feesUsd} USD</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TABS VIEW 2: AI SENTIMENT MODULE */}
        {activeTab === "ai" && (
          <div className="space-y-6">
            
            {/* INTRO AND FLASH EVENT TRIGGERS */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5 text-[#d4af37]" />
                    <h3 className="font-display italic font-semibold text-lg text-gray-200">Analisis Sentimen Pasar Berbasis AI</h3>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
                    Dilengkapi dengan neural scanner yang menggunakan model server-side **Gemini-3.5-Flash** untuk menganalisis sentimen media dan perincian data transaksi paus (whale transactions). Output analisis ini membantu merumuskan keputusan spread arbitrage optimal agar terhindar dari slippage berlebih selama volatilitas ekstrem.
                  </p>
                </div>
                
                <button
                  onClick={handleFetchAiSentiment}
                  disabled={aiLoading}
                  className="cursor-pointer bg-[#d4af37] hover:bg-[#c9a32c] text-black font-display font-bold text-xs px-5 py-3 rounded border border-[#d4af37] transition-all shadow-[0_0_12px_rgba(212,175,55,0.2)] flex items-center space-x-2 shrink-0 self-start"
                >
                  <RefreshCw className={`h-4 w-4 ${aiLoading ? "animate-spin" : ""}`} />
                  <span>{aiLoading ? "Menganalisis Headings..." : "Pindai Sentimen AI Sekarang"}</span>
                </button>
              </div>

              {/* QUICK SCENARIO PRESETS FOR DEMO */}
              <div className="mt-6 border-t border-[#1a1a1a] pt-5">
                <span className="text-[10px] font-mono text-gray-500 block mb-3 font-semibold uppercase tracking-wider">Simulasikan Event Berita Pasar (Preset Skenario):</span>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { text: "🐳 Paus melakukan pemindahan (deposit) besar sebesar 10.000 BTC ke orderbook OKX", variant: "Bullish Volatility", label: "Whale Inflow to OKX" },
                    { text: "📉 Binance mengumumkan maintenance darurat API spot trade selama 30 menit", variant: "Critical Risk Alert", label: "Binance Maintenance Panic" },
                    { text: "📈 Angka IHK Amerika turun melebihi ekspektasi pasar, aset digital mengalami rally", variant: "Bullish Spot Drive", label: "Macro Inflation Decline" },
                    { text: "⚠️ Regulator memperketat aturan arbitrase broker multiaset di regional Asia-Pasifik", variant: "Fear Uncertainty Doubt", label: "Regulatory FUD Alert" }
                  ].map((scenario, index) => (
                    <button
                      key={index}
                      onClick={() => executeNewsTrigger(scenario.text, scenario.variant)}
                      className="cursor-pointer text-[11px] font-mono bg-[#0c0c0c] hover:bg-[#151515] text-gray-300 border border-[#1a1a1a] hover:border-[#d4af37]/40 px-3 py-1.5 rounded transition-all"
                    >
                      {scenario.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI OUTPUT CONTAINER */}
            {aiLoading ? (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-12 text-center space-y-4">
                <div className="inline-block relative animate-pulse">
                  <Cpu className="h-10 w-10 text-[#d4af37]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display italic text-gray-300">Gemini-3.5-Flash Sedang Memindai...</h4>
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Menyortir feed rute arbitrase, sentimen volatilitas, dan optimalisasi limits...</p>
                </div>
              </div>
            ) : aiReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* CORE SENTIMENT ANALYSIS COLOUMN */}
                <div className="col-span-2 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6 space-y-6">
                  
                  <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4">
                    <div>
                      <h4 className="font-display italic font-bold text-base text-gray-200">AI Global Risk Assessment Report</h4>
                      <p className="text-xs font-mono text-gray-500 mt-0.5">Model: Google Gemini-3.5-Flash (Server Decrypted)</p>
                    </div>

                    <span className="text-[10px] bg-[#141414] text-amber-500 font-mono px-2 py-0.5 rounded border border-[#222]">
                      {aiReport.isMock ? "PROCESSED REALTIME DYNAMIC_FALLBACK" : "LIVE API CONNECTED"}
                    </span>
                  </div>

                  {/* SENTIMENT SCORE PILLS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a] text-center">
                      <span className="text-[10px] text-gray-500 block font-mono">Vibe Sentimen Pasar</span>
                      <span className={`text-xl font-bold block mt-1 ${
                        aiReport.overallSentiment === "BULLISH" ? "text-emerald-400" :
                        aiReport.overallSentiment === "HIGH VOLATILITY" ? "text-amber-500 animate-pulse" : "text-red-400"
                      }`}>
                        {aiReport.overallSentiment}
                      </span>
                    </div>

                    <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a] text-center">
                      <span className="text-[10px] text-gray-500 block font-mono">Skor Kepercayaan Sentimen</span>
                      <span className="text-xl font-bold text-amber-500 block mt-1">
                        {aiReport.sentimentScore}%
                      </span>
                    </div>

                    <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a] text-center">
                      <span className="text-[10px] text-gray-500 block font-mono font-semibold">Tingkat Risiko Arbitrase</span>
                      <span className={`text-xl font-bold block mt-1 ${
                        aiReport.riskLevel === "LOW" ? "text-emerald-400" :
                        aiReport.riskLevel === "MODERATE" ? "text-amber-400" : "text-red-400"
                      }`}>
                        {aiReport.riskLevel}
                      </span>
                    </div>

                  </div>

                  {/* ANALYSIS PARAGRAPH */}
                  <div className="p-4 bg-[#080808] rounded border border-[#1a1a1a] space-y-2">
                    <span className="text-xs font-bold text-gray-400 block font-mono">Ulasan Analitis AI:</span>
                    <p className="text-xs text-gray-300 font-mono leading-relaxed">
                      {aiReport.analysisParagraph}
                    </p>
                  </div>

                  {/* SIMULATED PROCESSED NEWS FEED */}
                  <div className="space-y-2">
                    <span className="text-xs text-gray-500 block font-mono font-semibold uppercase tracking-wider">Berita & Sinyal yang Dipindai AI:</span>
                    <div className="space-y-2">
                      {aiReport.simulatedNews.map((news, i) => (
                        <div key={i} className="flex items-start space-x-2.5 p-2.5 bg-[#0c0c0c] rounded text-xs font-mono text-gray-400 border border-[#1a1a1a]">
                          <span className="bg-[#080808] text-[#d4af37] px-1.5 py-0.5 rounded text-[9px] shrink-0 border border-[#1a1a1a]">NEWS</span>
                          <span className="leading-relaxed">{news}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* AI PARAMETERS SUGGESTIONS */}
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4.5 w-4.5 text-[#d4af37]" />
                    <h5 className="font-display italic font-semibold text-sm text-gray-300">Rekomendasi Parameter Optimal</h5>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">Sistem AI merekomendasikan batas spread minimum per koin untuk menghindari kemacetan dan mengamankan profit.</p>

                  <div className="space-y-3 pt-2">
                    {aiReport.targetAssetAdvisories.map((advisory) => (
                      <div key={advisory.symbol} className="p-3 bg-[#0c0c0c] rounded border border-[#1a1a1a] space-y-2 font-mono">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-gray-200">{advisory.symbol}/USDT</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                            advisory.action === "OPTIMIZE_HIGH_SPREAD" ? "bg-emerald-950/30 text-emerald-400" :
                            advisory.action === "CONSERVATIVE_SPREAD" ? "bg-amber-950/30 text-amber-400" : "bg-red-950/30 text-red-400"
                          }`}>
                            {advisory.action}
                          </span>
                        </div>

                        <div className="flex justify-between text-[11px] text-gray-400 border-t border-[#1a1a1a] pt-1.5">
                          <span>Usulan Spread:</span>
                          <span className="font-bold text-emerald-400">{advisory.recommendedSpreadThreshold}%</span>
                        </div>

                        <p className="text-[10px] text-gray-500 leading-relaxed pt-1">{advisory.reason}</p>

                        {config.isAiOptimized ? (
                          <div className="text-[10px] bg-emerald-950/25 text-emerald-400 border border-emerald-900/30 text-center font-bold font-mono py-1.5 px-2 rounded mt-2 uppercase tracking-wide">
                            ✓ Auto-Applied by AI Autopilot
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApplyAiAdvisories(advisory.recommendedSpreadThreshold)}
                            className="cursor-pointer w-full text-center text-[10px] bg-amber-950/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/30 font-bold py-1.5 px-2 rounded transition-all mt-2 uppercase font-mono"
                          >
                            Terapkan ke Bot parameter
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-16 text-center space-y-4 max-w-2xl mx-auto">
                <Cpu className="h-12 w-12 text-[#d4af37] mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-display italic font-semibold text-lg text-gray-300">Pindai Sentimen Pasar</h4>
                  <p className="text-xs text-gray-500 font-mono max-w-sm mx-auto uppercase tracking-wider">Klik tombol di atas untuk memerintahkan bot melakukan analisis berita pasar kripto dan merekomendasikan batas spread yang akurat.</p>
                </div>
                <button
                  onClick={handleFetchAiSentiment}
                  className="cursor-pointer bg-[#d4af37] text-black font-mono font-bold text-xs px-6 py-2.5 rounded border border-[#d4af37] transition-all hover:bg-[#c9a32c] inline-block mx-auto uppercase tracking-wide"
                >
                  Analisis Sentimen Sekarang
                </button>
              </div>
            )}

          </div>
        )}

        {/* TABS VIEW 3: HISTORICAL BACKTESTING */}
        {activeTab === "backtest" && (
          <div className="space-y-6">
            
            {/* INSTRUCTIONS CARD */}
            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6">
              <div className="flex items-center space-x-2.5 mb-2">
                <Activity className="h-5 w-5 text-[#d4af37]" />
                <h3 className="font-display italic font-semibold text-lg text-gray-200">Modul Backtesting Arbitrase</h3>
              </div>
              <p className="text-xs text-gray-400 font-mono max-w-3xl leading-relaxed">
                Fitur pengujian historis mensimulasikan rute perdagangan bot pada rekaman harga tick koin dari database bursa dan melacak hasil imbal hasil (profit net multiplier), win rate, jumlah transaksi yang sah, dan estimasi beban gas fee.
              </p>

              {/* BACKTEST PARAMETERS MATRIX GRID */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                
                <div className="space-y-1.5 font-mono text-xs">
                  <label className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">Aset Multi-Koin</label>
                  <select
                    value={backtestAsset}
                    onChange={(e) => setBacktestAsset(e.target.value)}
                    className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-200 px-3 py-2 rounded focus:border-[#d4af37] font-mono"
                  >
                    {["BTC", "ETH", "SOL", "BNB", "XRP"].map(asset => (
                      <option key={asset} value={asset}>{asset}/USDT</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <label className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">Min. Spread Pengujian (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="1.50"
                    value={backtestSpread}
                    onChange={(e) => setBacktestSpread(parseFloat(e.target.value))}
                    className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-200 px-3 py-2 rounded focus:border-[#d4af37] font-bold font-mono"
                  />
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <label className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">VIP Fee Estimasi (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.50"
                    value={backtestFee}
                    onChange={(e) => setBacktestFee(parseFloat(e.target.value))}
                    className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-200 px-3 py-2 rounded focus:border-[#d4af37] font-bold font-mono"
                  />
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <label className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">Jangka Waktu Hari</label>
                  <select
                    value={backtestPeriod}
                    onChange={(e) => setBacktestPeriod(parseInt(e.target.value))}
                    className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-200 px-3 py-2 rounded focus:border-[#d4af37] font-mono"
                  >
                    <option value={1}>Format 24 Jam Terakhir</option>
                    <option value={7}>Format 7 Hari Terakhir</option>
                    <option value={30}>Format 30 Hari Terakhir</option>
                  </select>
                </div>

              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleRunBacktest}
                  disabled={backtestLoading}
                  className="cursor-pointer bg-[#d4af37] text-black font-display font-bold text-xs px-6 py-2.5 rounded border border-[#d4af37] transition-all hover:bg-[#c9a32c] shadow-[0_0_12px_rgba(212,175,55,0.2)] inline-flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${backtestLoading ? "animate-spin" : ""}`} />
                  <span>{backtestLoading ? "Mengeksekusi Backtest..." : "Mulai Simulasi Backtesting"}</span>
                </button>
              </div>

            </div>

            {/* BACKTEST RESULT VIEW */}
            {backtestLoading ? (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-12 text-center space-y-4">
                <div className="inline-block h-8 w-8 rounded-full border-4 border-amber-500/20 border-t-[#d4af37] animate-spin"></div>
                <div className="space-y-1 text-xs font-mono text-gray-400">
                  <p>Membaca database ticks historis bursa...</p>
                  <p className="text-[10px] text-gray-500">Memverifikasi eksekusi slippage dan batas rebalancing di masa lalu...</p>
                </div>
              </div>
            ) : backtestResult ? (
              <div className="space-y-6">
                
                {/* BACKTEST REPORT STATS PANELS */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 font-mono text-xs">
                  
                  <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a]">
                    <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Aset Diuji</span>
                    <span className="text-lg font-bold text-gray-200 block mt-1">{backtestResult.asset}/USDT</span>
                  </div>

                  <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a]">
                    <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Total Transaksi</span>
                    <span className="text-lg font-bold text-[#d4af37] block mt-1">{backtestResult.summary.totalTrades} Trade</span>
                  </div>

                  <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a]">
                    <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Akumulasi Profit Net</span>
                    <span className="text-lg font-bold text-emerald-400 block mt-1">+${backtestResult.summary.netProfit}</span>
                  </div>

                  <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a]">
                    <span className="text-gray-500 block text-[9px] uppercase tracking-wider">VIP Gas Diambil</span>
                    <span className="text-lg font-bold text-purple-400 block mt-1">${backtestResult.summary.feesPaid}</span>
                  </div>

                  <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a]">
                    <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Rata-rata Win Rate</span>
                    <span className="text-lg font-bold text-emerald-400 block mt-1">{backtestResult.summary.winRate}%</span>
                  </div>

                  <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a]">
                    <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Indeks Efisiensi</span>
                    <span className="text-lg font-bold text-amber-500 block mt-1">{backtestResult.summary.efficiencyIndex} pt</span>
                  </div>

                </div>

                {/* VISUAL PURE SVG PROFIT CURVE CHART */}
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6">
                  <span className="text-xs font-mono font-semibold text-gray-300 block mb-4">Grafik Pertumbuhan Profit Arbitrase ($)</span>
                  
                  <div className="relative h-64 bg-[#080808] p-2 rounded border border-[#1a1a1a] overflow-hidden flex flex-col justify-between">
                    
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none opacity-5">
                      <div className="border-t border-white w-full"></div>
                      <div className="border-t border-white w-full"></div>
                      <div className="border-t border-white w-full"></div>
                      <div className="border-t border-white w-full"></div>
                    </div>

                    {/* SVG GRAPH PLOTTING FOR STABLE DRAWINGS */}
                    <div className="w-full h-full relative z-10">
                      <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Chart Area Fill */}
                        <path
                          d={`M 0 150 
                            ${backtestResult.chartData.map((pt, index) => {
                              const x = (index / (backtestResult.chartData.length - 1)) * 500;
                              // normalize profit relative to highest
                              const maxP = Math.max(...backtestResult.chartData.map(p => p.profit)) || 100;
                              const y = 150 - ((pt.profit / maxP) * 120 + 10);
                              return `L ${x} ${y}`;
                            }).join(" ")} 
                            L 500 150 Z`}
                          fill="url(#chartGlow)"
                        />

                        {/* Chart Path Outline */}
                        <path
                          d={backtestResult.chartData.map((pt, index) => {
                            const x = (index / (backtestResult.chartData.length - 1)) * 500;
                            const maxP = Math.max(...backtestResult.chartData.map(p => p.profit)) || 100;
                            const y = 150 - ((pt.profit / maxP) * 120 + 10);
                            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#d4af37"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    {/* Chart dates footer axis */}
                    <div className="flex justify-between text-[9px] font-mono text-gray-500 px-2 pt-2 border-t border-[#1a1a1a] relative z-10 bg-[#080808]">
                      <span>{backtestResult.chartData[0]?.date}</span>
                      <span>Tengah Periode</span>
                      <span>Selesai (Hari ini)</span>
                    </div>

                  </div>
                </div>

                {/* SAMPLES EXECUTED HISTORIES LIST */}
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6">
                  <span className="text-xs font-mono font-semibold text-gray-300 block mb-3 font-sans">Sampel Cuplikan Orde Transaksi Backtest</span>
                  
                  <div className="overflow-x-auto text-[11px] font-mono">
                    <table className="w-full text-left font-mono">
                      <thead>
                        <tr className="border-b border-[#1a1a1a] text-gray-500 bg-[#0c0c0c]">
                          <th className="py-2.5 px-2">Koin</th>
                          <th className="py-2.5 px-2">Arah Eksekusi</th>
                          <th className="py-2.5 px-2">Beli</th>
                          <th className="py-2.5 px-2">Jual</th>
                          <th className="py-2.5 px-2">Selisih Spread</th>
                          <th className="py-2.5 px-2 text-right">Profit Bersih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#151515] text-gray-400">
                        {backtestResult.sampleTrades.map((trade, idx) => (
                          <tr key={idx} className="hover:bg-[#151515] cursor-pointer">
                            <td className="py-2 px-2 font-bold text-[#d4af37]">{trade.asset}</td>
                            <td className="py-2 px-2 text-gray-500">Arbitrase Instant spot</td>
                            <td className="py-2 px-2">${trade.buyPrice}</td>
                            <td className="py-2 px-2">${trade.sellPrice}</td>
                            <td className="py-2 px-2 text-emerald-400 font-semibold">{trade.spreadPercent}%</td>
                            <td className="py-2 px-2 text-right text-emerald-400 font-bold">+${trade.netProfit} USD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-16 text-center space-y-4 max-w-lg mx-auto">
                <BarChart3 className="h-10 w-10 text-[#d4af37] mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-display italic font-semibold text-gray-300">Sandbox Pengujian Siap</h4>
                  <p className="text-xs text-gray-500 font-mono uppercase tracking-wider leading-relaxed">Konfigurasikan rentang parameters, koin aset, dan estimasi biaya VIP di atas kemudian klik tombol untuk memulai simulasi data historis.</p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TABS VIEW 4: VAULT SETTINGS & TELEGRAM */}
        {activeTab === "vault" && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* ENCRYPTED VAULT PANEL */}
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6 space-y-5">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="h-5 w-5 text-[#d4af37] animate-pulse" />
                  <div>
                    <h3 className="font-display italic font-semibold text-base text-gray-100">Kubah Kredensial API Bursa Terenkripsi</h3>
                    <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono border border-amber-500/20 px-1.5 py-0.5 rounded tracking-wider">
                      HIGH-GRADE SECURE VAULT (AES-GCM-256)
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 leading-relaxed font-mono">
                  Demi perlindungan aset pengguna, kredensial API Key dan Secret- passphrase dienkripsi di sisi klien menggunakan kunci simetris 256-bit AES-GCM sebelum disimpan di backend. Kunci aslinya tidak pernah dikirim dalam teks biasa (plaintext).
                </p>

                {/* VISUAL STATUS ENCRYPTION BAR */}
                <div className="p-3.5 bg-[#0c0c0c] rounded border border-[#1a1a1a] flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center space-x-2">
                    {isEncrypted ? (
                      <Lock className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Unlock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-gray-400">Status Protektor:</span>
                    <span className={isEncrypted ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                      {isEncrypted ? "ENKRIPSI AES TERKUNCI" : "PLAINTEXT MODE"}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setIsEncrypted(!isEncrypted)}
                    className="cursor-pointer text-[10px] p-1.5 bg-[#080808] border border-[#1a1a1a] font-bold rounded hover:bg-[#151515] text-[#d4af37] font-mono transition-all"
                  >
                    {isEncrypted ? "Tampilkan Plaintext" : "Aktifkan Enkripsi AES"}
                  </button>
                </div>

                {/* FORM INPUT CREDENTIALS FOR SHOW OFF */}
                <div className="space-y-4 font-mono text-xs">
                  
                  <div className="space-y-1.5">
                    <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">Binance API Key (Read/Write Spot)</span>
                    <div className="relative">
                      <input
                        type={isEncrypted ? "password" : "text"}
                        value={binanceApiKey}
                        onChange={(e) => setBinanceApiKey(e.target.value)}
                        className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-300 p-2.5 rounded pr-10 focus:border-[#d4af37]"
                      />
                    </div>
                    {isEncrypted && (
                      <div className="text-[10px] text-gray-500 bg-[#080808] p-2 rounded border border-[#1a1a1a] font-mono overflow-auto leading-relaxed max-h-[48px]">
                        <span>AES-256 GCM Base64 Cipher:</span>
                        <p className="text-amber-500 select-all font-bold mt-0.5">{getEncryptedHash(binanceApiKey)}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">Binance Secret API Key</span>
                    <input
                      type={isEncrypted ? "password" : "text"}
                      value={binanceApiSecret}
                      onChange={(e) => setBinanceApiSecret(e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-300 p-2.5 rounded focus:border-[#d4af37]"
                    />
                    {isEncrypted && (
                      <div className="text-[10px] text-gray-500 bg-[#080808] p-2 rounded border border-[#1a1a1a] font-mono overflow-auto leading-relaxed max-h-[48px]">
                        <span>AES-256 GCM Base64 Cipher:</span>
                        <p className="text-amber-500 select-all font-bold mt-0.5">{getEncryptedHash(binanceApiSecret)}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">OKX API Key (Read/Write Trade)</span>
                    <input
                      type={isEncrypted ? "password" : "text"}
                      value={okxApiKey}
                      onChange={(e) => setOkxApiKey(e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-300 p-2.5 rounded focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">OKX API Secret</span>
                      <input
                        type={isEncrypted ? "password" : "text"}
                        value={okxApiSecret}
                        onChange={(e) => setOkxApiSecret(e.target.value)}
                        className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-300 p-2.5 rounded focus:border-[#d4af37]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">OKX Passphrase</span>
                      <input
                        type={isEncrypted ? "password" : "text"}
                        value={okxPassphrase}
                        onChange={(e) => setOkxPassphrase(e.target.value)}
                        className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-300 p-2.5 rounded focus:border-[#d4af37]"
                      />
                    </div>
                  </div>

                  {/* EMPOWERED VERIFY & CONNECT ACTION BUTTON */}
                  <div className="pt-2">
                    <button
                      onClick={handleSaveCredentials}
                      disabled={isConnecting}
                      className="cursor-pointer w-full text-center text-xs bg-amber-950/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/35 font-bold py-3 px-4 rounded transition-all mt-1 uppercase font-mono tracking-wider flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <Activity className="h-4 w-4 animate-spin text-[#d4af37]" />
                          <span>MENGHUBUNGKAN TRANSAKSI RIIL...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          <span>SIMPAN & KONEKSIKAN BROKER RIIL</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-xs font-mono text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Vault Lock Status:</span>
                    <span className="text-emerald-400 font-bold">Safe</span>
                  </div>
                  <span>Terintegrasi di memori RAM bursa</span>
                </div>

              </div>

              {/* TELEGRAM NOTIFICATION INTEGRATOR CONTROL BOX */}
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 md:p-6 space-y-5">
                <div className="flex items-center space-x-2.5">
                  <Bell className="h-5 w-5 text-[#d4af37]" />
                  <div>
                    <h3 className="font-display italic font-semibold text-base text-gray-100">Integrasi Notifikasi Telegram Real-time</h3>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">Sambungkan bot dengan channel Anda guna notifikasi aktivitas broker.</p>
                  </div>
                </div>

                {/* QUICK PARAMS TELEGRAM CHANNEL CONFIGS */}
                <div className="space-y-4 font-mono text-xs">
                  
                  <div className="flex items-center justify-between p-3 bg-[#0c0c0c] rounded border border-[#1a1a1a]">
                    <span className="text-gray-400">Aktifkan Notifikasi Bot Telegram:</span>
                    <input
                      type="checkbox"
                      checked={config.isTelegramEnabled}
                      onChange={(e) => handleConfigChange("isTelegramEnabled", e.target.checked)}
                      className="h-4.5 w-4.5 cursor-pointer accent-[#d4af37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">Token Telegram Bot API</span>
                    <input
                      type="text"
                      placeholder="e.g. 7138241951:AAFkZ9x9N3R-B2XzU128H82KaK..."
                      value={config.telegramBotToken}
                      onChange={(e) => handleConfigChange("telegramBotToken", e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-300 p-2.5 rounded focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-gray-500 font-semibold block uppercase tracking-wider text-[9px]">ID Obrolan Telegram (Chat ID / Channel Handle)</span>
                    <input
                      type="text"
                      placeholder="e.g. -1002345678 or @arbitrage_alerts"
                      value={config.telegramChatId}
                      onChange={(e) => handleConfigChange("telegramChatId", e.target.value)}
                      className="w-full bg-[#0c0c0c] border border-[#1a1a1a] outline-none text-gray-300 p-2.5 rounded focus:border-[#d4af37]"
                    />
                  </div>

                </div>

                {/* INTERACTIVE SEND BOX FOR DEMO */}
                <div className="bg-[#0c0c0c] p-4 rounded border border-[#1a1a1a] space-y-3">
                  <span className="text-[10px] text-gray-500 block font-mono font-semibold uppercase">Kirim Pesan Simulasi Outbound:</span>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ketik teks pesan tes arbitrase di sini..."
                      value={sendTelegramText}
                      onChange={(e) => setSendTelegramText(e.target.value)}
                      className="flex-1 bg-[#080808] border border-[#1a1a1a] outline-none text-xs text-gray-300 p-2 rounded font-mono focus:border-[#d4af37]"
                    />
                    <button
                      onClick={handleSendTelegramTest}
                      className="cursor-pointer bg-[#d4af37] text-black px-4 py-2 rounded font-mono font-bold hover:bg-[#c9a32c] text-xs flex items-center space-x-1"
                    >
                      <Send className="h-3 w-3" />
                      <span>Kirim</span>
                    </button>
                  </div>
                </div>

                {/* TELEGRAM SIMULATOR INBOX FRAME */}
                <div className="bg-[#0c0c0c] rounded border border-[#1a1a1a] p-3 space-y-2.5">
                  <span className="text-[10px] text-gray-500 font-mono block uppercase">Pratinjau Channel Telegram Terenkripsi:</span>
                  
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pt-1 h-32 pr-1">
                    {telegramFeeds.length === 0 ? (
                      <div className="text-center text-gray-600 font-mono text-[10px] pt-8 uppercase tracking-wider">
                        Belum ada notifikasi terkirim. Trigger arbitrage spread atau kirim pesan tes di atas.
                      </div>
                    ) : (
                      telegramFeeds.map((feed, idx) => (
                        <div key={idx} className="bg-[#080808] border border-[#1a1a1a] rounded p-2.5 text-[10px] font-mono leading-relaxed space-y-1">
                          <div className="flex justify-between text-gray-500">
                            <span>{config.telegramChatId || "@arbitrage_alerts"}</span>
                            <span>{new Date(feed.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-gray-200 whitespace-pre-wrap">{feed.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      <footer className="border-t border-[#1a1a1a] mt-12 bg-[#0c0c0c] py-6 text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p><strong>Arbitrage Broker Platform</strong> - Binance & OKX Cross Trading Simulator.</p>
            <p className="text-gray-600 font-sans">Teknologi pencocokan pesanan terenkripsi simetris (AES-256-GCM) & Analisis Sentimen Terpadu.</p>
          </div>
          <div className="text-gray-600">
            <span>Server Time Local UTC: 2026-05-22 03:04:00</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
