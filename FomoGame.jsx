import React, { useState, useEffect, useRef } from 'react';
import { 
  Ticket, 
  LayoutGrid, 
  Calendar, 
  Bell, 
  Gift, 
  Wallet, 
  BarChart2, 
  User, 
  LogOut, 
  Info,
  LifeBuoy,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const FomoGame = () => {
  // --- Состояние пользователя ---
  const [balance, setBalance] = useState(100);
  const [ticketsToBuy, setTicketsToBuy] = useState(10);
  
  // --- Состояние игры ---
  const [gameState, setGameState] = useState('IDLE'); 
  const [gameId, setGameId] = useState(7483);
  
  // Экономика
  const [ticketPrice, setTicketPrice] = useState(1.00);
  const [totalStartBank, setTotalStartBank] = useState(0); 
  const [currentBank, setCurrentBank] = useState(0); 
  const [stopLossLimit, setStopLossLimit] = useState(0); 
  
  // Билеты игрока
  const [myTicketsTotal, setMyTicketsTotal] = useState(0);
  const [myTicketsSold, setMyTicketsSold] = useState(0);
  
  // Данные для графика
  const [chartData, setChartData] = useState([]);

  // Рефы
  const gameLoopRef = useRef(null);
  const bankRef = useRef(0);
  const priceRef = useRef(1.00);

  // --- ЛОГИКА ИГРЫ ---

  const startGame = () => {
    if (ticketsToBuy * 1 > balance) {
      alert("Недостаточно средств!");
      return;
    }
    if (ticketsToBuy < 1) return;

    setBalance(prev => prev - ticketsToBuy);
    setMyTicketsTotal(ticketsToBuy);
    setMyTicketsSold(0);
    setTicketPrice(1.00);
    priceRef.current = 1.00;
    setChartData([{ time: 0, price: 1.00 }]);

    const botsTickets = Math.floor(Math.random() * 500) + 500; 
    const totalTickets = ticketsToBuy + botsTickets;
    const grossTotal = totalTickets * 1; 
    const houseFee = grossTotal * 0.10; 
    const initialPlayableBank = grossTotal - houseFee; 
    const crashLimit = grossTotal * 0.10; 

    setTotalStartBank(grossTotal);
    setCurrentBank(initialPlayableBank);
    bankRef.current = initialPlayableBank;
    setStopLossLimit(crashLimit);

    setGameState('RUNNING');

    gameLoopRef.current = setInterval(gameTick, 800); 
  };

  const gameTick = () => {
    if (bankRef.current <= stopLossLimit) {
      endGame();
      return;
    }

    const growth = (Math.random() * 0.05) + 0.02;
    const newPrice = priceRef.current + growth;
    priceRef.current = newPrice;
    setTicketPrice(newPrice);
    
    // Обновляем график
    setChartData(prev => [...prev, { time: prev.length, price: newPrice }]);

    const botsSelling = Math.floor(Math.random() * 15) + 5; 
    const drainedAmount = botsSelling * newPrice;
    const newBank = bankRef.current - drainedAmount;
    
    if (newBank <= stopLossLimit) {
      bankRef.current = stopLossLimit; 
      setCurrentBank(stopLossLimit);
      endGame(); 
    } else {
      bankRef.current = newBank;
      setCurrentBank(newBank);
    }
  };

  const sellTicket = (amount) => {
    if (gameState !== 'RUNNING') return;
    
    const available = myTicketsTotal - myTicketsSold;
    const toSell = Math.min(amount, available);
    if (toSell <= 0) return;

    const profit = toSell * priceRef.current;
    
    if (bankRef.current - profit < stopLossLimit) return;

    setMyTicketsSold(prev => prev + toSell);
    setBalance(prev => prev + profit);
    
    const newBank = bankRef.current - profit;
    bankRef.current = newBank;
    setCurrentBank(newBank);

    if (newBank <= stopLossLimit) {
      endGame();
    }
  };

  const endGame = () => {
    clearInterval(gameLoopRef.current);
    setGameState('DISTRIBUTING');
    
    const remainingBank = bankRef.current;
    const myUnsold = myTicketsTotal - myTicketsSold;
    
    setTimeout(() => {
        if (myUnsold > 0) {
            const estimatedSurvivors = Math.floor(totalStartBank * 0.3);
            const payoutPerTicket = remainingBank / (estimatedSurvivors > 0 ? estimatedSurvivors : 1);
            const finalPayoutRate = Math.max(payoutPerTicket, 0.33); 
            const compensation = myUnsold * finalPayoutRate;
            setBalance(prev => prev + compensation);
        }
        setGameState('CRASHED');
        setGameId(prev => prev + 1);
    }, 1500);
  };

  // Вычисления для UI
  const bankPercent = totalStartBank > 0 ? (currentBank / totalStartBank) * 100 : 100;
  const stopLossValue = stopLossLimit;
  
  // Current Time for Tooltip
  const now = new Date();
  const timeString = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

  // Svg Chart logic
  const maxPrice = Math.max(2, ...chartData.map(d => d.price)) * 1.1;
  const chartPoints = chartData.map((d, i) => {
    const x = (i / Math.max(20, chartData.length - 1)) * 100;
    const y = 100 - ((d.price / maxPrice) * 100);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-800">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#F5F5F0] border-r border-slate-200 flex flex-col p-6 fixed h-full z-20">
        
        {/* BUY TICKET BUTTON */}
        <button 
          onClick={gameState === 'IDLE' || gameState === 'CRASHED' ? startGame : undefined}
          disabled={gameState === 'RUNNING' || gameState === 'DISTRIBUTING'}
          className={`w-full bg-[#FF0000] hover:bg-red-600 text-white font-bold py-4 px-4 rounded shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-3 mb-10 ${gameState === 'RUNNING' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Ticket className="w-6 h-6" />
          <span className="tracking-wide">КУПИТЬ БИЛЕТЫ</span>
        </button>

        {/* NAVIGATION */}
        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutGrid />} label="ИГРА" active />
          <NavItem icon={<Calendar />} label="РАСПИСАНИЕ" />
          <NavItem icon={<Bell />} label="НОВОСТИ" badge="1" />
          <NavItem icon={<Gift />} label="АКЦИИ" />
          <NavItem icon={<Wallet />} label="КОШЕЛЕК" />
          <NavItem icon={<BarChart2 />} label="ТАБЛИЦА" />
          <NavItem icon={<User />} label="АККАУНТ" />
        </nav>

        {/* EXIT */}
        <div className="mt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-200/50 rounded-lg text-slate-600 font-bold hover:bg-slate-200 transition-colors">
            <LogOut className="w-5 h-5" />
            ВЫХОД
          </button>
        </div>

        {/* FOOTER LINKS */}
        <div className="mt-8 flex flex-col gap-2 text-[10px] text-slate-400 font-medium">
           <a href="#" className="underline hover:text-slate-600">Партнерская программа</a>
           <a href="#" className="underline hover:text-slate-600">Как играть?</a>
           <a href="#" className="underline hover:text-slate-600">Поддержка</a>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-64 p-8 flex flex-col h-screen overflow-hidden relative">
        
        {/* HEADER STATS */}
        <header className="grid grid-cols-4 gap-8 mb-8 pb-6 border-b border-slate-100">
          <StatBox title="Текущая цена билета:">
             {gameState === 'IDLE' ? <span className="text-slate-300">---</span> : <span className="text-cyan-600 animate-pulse">${ticketPrice.toFixed(2)}</span>}
          </StatBox>
          <StatBox title="Игровой банк:" valueClass="text-4xl font-bold tracking-tighter">
             ${currentBank > 0 ? currentBank.toFixed(2) : '100.00'}
          </StatBox>
          <StatBox title="Ваш баланс:">
             ${balance.toFixed(2)}
          </StatBox>
           <StatBox title="Ставка / В игре:">
             {gameState === 'IDLE' || gameState === 'CRASHED' ? (
                 <div className="flex items-center gap-2">
                     <input 
                        type="number" 
                        value={ticketsToBuy}
                        onChange={(e) => setTicketsToBuy(Number(e.target.value))}
                        className="w-16 border rounded px-1 py-0.5 text-lg font-bold text-center bg-slate-50"
                     />
                     <span className="text-xs text-slate-400">билетов</span>
                 </div>
             ) : (
                <span className="text-emerald-600">{myTicketsTotal - myTicketsSold} шт.</span>
             )}
          </StatBox>
        </header>

        {/* GRAPHIC AREA */}
        <div className="flex-1 flex gap-8 relative">
           
           {/* LEFT: RISK METER BAR */}
           <div className="w-16 rounded-2xl bg-gradient-to-b from-red-500 via-orange-400 to-emerald-400 p-1 relative shadow-inner flex flex-col justify-end overflow-hidden">
              {/* Mask to show 'drain' */}
              <div 
                className="absolute top-0 left-0 right-0 bg-[#F5F5F0]/90 transition-all duration-300 ease-linear"
                style={{ height: `${100 - bankPercent}%` }}
              ></div>
              
              <div className="relative z-10 text-center pb-4">
                 <div className="text-[10px] font-bold text-white drop-shadow-md mb-1">STOP</div>
                 <div className="text-xs font-black text-white bg-slate-900/20 rounded py-1">
                    ${stopLossValue.toFixed(0)}
                 </div>
              </div>
           </div>

           {/* CENTER: CHART */}
           <div className="flex-1 bg-white relative border-l border-b border-slate-100 rounded-bl-lg">
              {/* Grid Lines (Fake) */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                 {[...Array(6)].map((_, i) => <div key={i} className="h-px bg-slate-300 w-full"></div>)}
              </div>
              <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                 {[...Array(6)].map((_, i) => <div key={i} className="w-px bg-slate-300 h-full"></div>)}
              </div>

              {/* Y Axis Label */}
              <div className="absolute -left-8 top-1/2 -rotate-90 text-xs text-slate-400 font-bold tracking-widest whitespace-nowrap">
                  ПРИЗОВОЙ ФОНД
              </div>

              {/* Stop Line */}
              <div 
                className="absolute w-full border-b-2 border-dashed border-red-500/50 z-0 flex items-end justify-end px-2"
                style={{ bottom: '10%' }}
              >
                  <span className="text-[10px] text-red-500 font-bold bg-white px-1 mb-1">Остановка Игры при ${stopLossValue.toFixed(0)}</span>
              </div>

              {/* SVG Chart */}
              <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <defs>
                    <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                       <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4"/>
                       <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0"/>
                    </linearGradient>
                 </defs>
                 
                 {chartData.length > 1 && (
                    <>
                        <path 
                            d={`M 0 100 L ${chartPoints} L ${chartPoints.split(' ').pop().split(',')[0]} 100 Z`} 
                            fill="url(#chartFill)" 
                        />
                        <polyline 
                            points={chartPoints} 
                            fill="none" 
                            stroke="#06b6d4" 
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Cursor Dot */}
                        <circle 
                            cx={chartPoints.split(' ').pop().split(',')[0]} 
                            cy={chartPoints.split(' ').pop().split(',')[1]} 
                            r="1.5" 
                            fill="white" 
                            stroke="#FF0000" 
                            strokeWidth="0.5"
                        />
                    </>
                 )}
              </svg>

              {/* Tooltip (Simulated following cursor/last point) */}
              {gameState === 'RUNNING' && (
                  <div className="absolute top-1/4 right-1/4 bg-white border border-slate-200 shadow-xl rounded px-4 py-2 text-sm z-20 animate-bounce-slight">
                      <div className="text-[10px] text-slate-400 mb-1">{now.toLocaleDateString()} {timeString}</div>
                      <div className="font-bold text-slate-800">Призовой фонд: <span className="text-cyan-600">${currentBank.toFixed(0)}</span></div>
                      <div className="font-bold text-slate-800 mt-1">Цена: <span className="text-red-500">x{ticketPrice.toFixed(2)}</span></div>
                  </div>
              )}
              
              {gameState === 'CRASHED' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-30 backdrop-blur-sm">
                      <div className="text-center">
                          <h2 className="text-5xl font-black text-slate-900 tracking-tighter">GAME OVER</h2>
                          <p className="text-slate-500 mt-2 font-medium">Банк распределен</p>
                      </div>
                  </div>
              )}
           </div>
        </div>

        {/* IN-GAME CONTROLS (Floating or Bottom) */}
        {gameState === 'RUNNING' && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white shadow-2xl border border-slate-200 rounded-full px-8 py-4 flex gap-4 z-30 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <button 
                    onClick={() => sellTicket(1)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-full transition-colors border border-slate-300"
                >
                    Продать 1
                </button>
                <button 
                    onClick={() => sellTicket(myTicketsTotal - myTicketsSold)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-8 rounded-full transition-colors shadow-lg shadow-cyan-500/30"
                >
                    ПРОДАТЬ ВСЕ (+${((myTicketsTotal - myTicketsSold) * ticketPrice).toFixed(2)})
                </button>
            </div>
        )}

      </main>
    </div>
  );
};

// UI Components

const NavItem = ({ icon, label, active, badge }) => (
  <div className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer group transition-all ${active ? 'bg-white shadow-sm' : 'hover:bg-slate-200/50'}`}>
    <div className="flex items-center gap-3 text-slate-600">
      {React.cloneElement(icon, { size: 20, className: active ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-600' })}
      <span className={`font-bold text-sm tracking-tight ${active ? 'text-slate-800' : 'text-slate-500'}`}>{label}</span>
    </div>
    {badge && (
      <span className="flex items-center justify-center w-5 h-5 bg-[#FF0000] text-white text-[10px] font-bold rounded-full shadow-sm">
        {badge}
      </span>
    )}
  </div>
);

const StatBox = ({ title, children, valueClass }) => (
  <div className="flex flex-col">
    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{title}</span>
    <div className={`font-mono text-2xl text-slate-800 ${valueClass || 'font-medium'}`}>
      {children}
    </div>
  </div>
);

export default FomoGame;