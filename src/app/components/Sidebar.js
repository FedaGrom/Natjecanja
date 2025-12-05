"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "../../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function Sidebar({ isOpen, onToggle, className = "" }) {
  const { id: currentId } = useParams() || {};
  const [natjecanja, setNatjecanja] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Firestore data loading - get all competitions and filter on client side
  useEffect(() => {
    const q = query(
      collection(db, 'natjecanja'), 
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status === 'published'); // Filter on client side
        setNatjecanja(items);
        setLoading(false);
      }, 
      (err) => {
        console.error('Sidebar: Firestore snapshot error:', err);
        setNatjecanja([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const getCategoryGradient = (kategorija) => {
    const categoryGradientMap = {
      SPORT: 'linear-gradient(135deg, #3B82F6, #10B981)',
      'DRUŠTVENE IGRE TURNIR': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      KVIZOVI: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      GLAZBA: 'linear-gradient(135deg, #EF4444, #F97316)',
      OSTALO: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
    };
    return categoryGradientMap[kategorija] || 'linear-gradient(135deg, #6B7280, #9CA3AF)';
  };

  // Parse datum string (expects formats like YYYY-MM-DD or DD.MM.YYYY.) to Date
  const parseDatum = (datumStr) => {
    if (!datumStr) return null;
    // Try ISO first
    const iso = new Date(datumStr);
    if (!isNaN(iso.getTime())) return iso;
    // Try DD.MM.YYYY or DD.MM.YYYY.
    const m = datumStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\.?$/);
    if (m) {
      const [_, dd, mm, yyyy] = m;
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
    return null;
  };

  // Map dates in current month to competitions
  const monthYearKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
  const competitionsByDay = (() => {
    const map = {};
    natjecanja.forEach(n => {
      const d = parseDatum(n.datum);
      if (!d) return;
      if (d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()) {
        const key = d.getDate();
        if (!map[key]) map[key] = [];
        map[key].push(n);
      }
    });
    return map;
  })();

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0=Sun
  const weekdayNames = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];

  const prevMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-20 left-4 z-50 bg-[#36b977] text-white p-2 rounded-lg shadow-lg hover:bg-green-600 transition-colors duration-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-20 h-[calc(100vh-80px)] w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-lg z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${className}
      `}>
        {/* Sticky header with calendar */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 z-10">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="px-2 py-1 text-sm rounded border hover:bg-gray-100">◀</button>
            <h3 className="text-base font-bold text-[#36b977]">
              {currentMonth.toLocaleDateString('hr-HR', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="px-2 py-1 text-sm rounded border hover:bg-gray-100">▶</button>
          </div>

          {/* Weekday names */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-[11px] text-gray-500">
            {weekdayNames.map((w) => (
              <div key={w} className="text-center">{w}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: (firstWeekday + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const comps = competitionsByDay[day] || [];
              const hasComps = comps.length > 0;
              return (
                <Link
                  key={`day-${day}-${monthYearKey}`}
                  href={hasComps ? `/natjecanja/${comps[0].id}` : '#'}
                  className={`h-8 rounded border flex items-center justify-center text-xs relative ${hasComps ? 'border-[#36b977] hover:bg-[#36b977]/10' : 'border-gray-200 text-gray-700'}`}
                >
                  <span>{day}</span>
                  {/* color dots for competitions on that day */}
                  {hasComps && (
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-1">
                      {comps.slice(0, 3).map((c) => (
                        <span
                          key={c.id}
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ background: getCategoryGradient(c.kategorija) }}
                          title={c.naziv}
                        />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Header under calendar */}
          <div className="flex items-center justify-between mt-4">
            <h4 className="text-lg font-bold text-[#36b977]">Natjecanja</h4>
            <Link
              href="/natjecanja"
              className="text-sm text-gray-600 hover:text-[#36b977] transition-colors duration-200"
            >
              Vidi sve
            </Link>
          </div>
        </div>
        
        {/* Scrollable content */}
        <div className="overflow-auto h-full p-4 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">Učitavanje...</div>
            </div>
          ) : natjecanja.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sm text-gray-500 mb-2">Nema dostupnih natjecanja</div>
            </div>
          ) : (
            <div className="space-y-3">
              {natjecanja.map((natjecanje) => (
                <Link
                  key={natjecanje.id}
                  href={`/natjecanja/${natjecanje.id}`}
                  onClick={() => {
                    // Close sidebar on mobile when selecting
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`
                    block p-3 rounded-lg border transition-all duration-200 hover:shadow-md
                    ${currentId === natjecanje.id 
                      ? 'border-[#36b977] bg-[#36b977]/10 shadow-md' 
                      : 'border-gray-200 hover:border-[#36b977]/50 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Category color indicator */}
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                      style={{ 
                        background: natjecanje.gradientStyle || getCategoryGradient(natjecanje.kategorija) 
                      }}
                    ></div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`
                        font-semibold text-sm mb-1 truncate
                        ${currentId === natjecanje.id ? 'text-[#36b977]' : 'text-gray-800'}
                      `}>
                        {natjecanje.naziv}
                      </h4>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        {natjecanje.datum && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{natjecanje.datum}</span>
                          </div>
                        )}
                        
                        {natjecanje.kategorija && (
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span className="truncate">{natjecanje.kategorija}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {currentId === natjecanje.id && (
                      <div className="flex-shrink-0">
                        <svg className="w-4 h-4 text-[#36b977]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300"
          onClick={onToggle}
        ></div>
      )}
    </>
  );
}
