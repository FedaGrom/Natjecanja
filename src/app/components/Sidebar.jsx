import React from 'react';

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <div className={`fixed inset-0 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'} z-40`}> 
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'} `}
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Panel positioned below fixed header (64px) */}
      <aside
        className={`absolute top-16 left-0 h-[calc(100%-64px)] w-80 max-w-[85vw] bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close button inside the panel */}
        <button
          onClick={onToggle}
          className="absolute top-2 right-2 p-2 rounded-lg bg-white shadow hover:bg-gray-100 text-gray-700"
          aria-label="Zatvori izbornik"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ...existing sidebar content... */}
      </aside>
    </div>
  );
}