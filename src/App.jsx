import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import wordsData from "../word.json";

const LEVELS = ["All", "A1", "A2", "B1", "B2"];
const ITEMS_PER_PAGE = 10;

export default function Lexicon() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedWord, setSelectedWord] = useState(null);
  const [showAZ, setShowAZ] = useState(false);
  const currentLevel = searchParams.get("level") || "All";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  const filteredWords = useMemo(() => {
    return currentLevel === "All"
      ? wordsData
      : wordsData.filter((w) => w.level === currentLevel);
  }, [currentLevel]);

  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);

  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  const updateParams = (newLevel, newPage) => {
    const params = {};
    if (newLevel !== "All") params.level = newLevel;
    if (newPage > 1) params.page = newPage;
    setSearchParams(params);
  };

  const handleLevelChange = (e) => updateParams(e.target.value, 1);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateParams(currentLevel, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPaginationRange = () => {
    const delta = 1;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-zinc-300 p-4 md:p-10 font-sans selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 shadow-lg">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic">
              LEXICON PRO
            </h1>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">
              {filteredWords.length} Words | Dark Edition
            </p>
          </div>

          <div className="relative">
            <select
              value={currentLevel}
              onChange={handleLevelChange}
              className="appearance-none bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-3 pr-10 focus:border-indigo-500 outline-none cursor-pointer hover:bg-black transition-all"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl} Level
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">
              ▼
            </div>
          </div>
        </header>

        {/* Word Cards Grid */}
        <div className="flex flex-col gap-6">
          {paginatedWords.map((item, index) => {
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

            return (
              <div
                key={index}
                className="relative bg-zinc-900/20 border border-zinc-800 rounded-3xl p-6 shadow-lg hover:shadow-indigo-500/40 transition-all cursor-pointer"
                onClick={() => setShowAZ(!showAZ)}
              >
                {/* Index */}
                <span className="absolute top-3 left-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  #{globalIndex.toString().padStart(2, "0")}
                </span>

                {/* Word & Pronunciation */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      {item.word}
                    </h2>
                    <p className="text-indigo-400 italic text-sm md:text-base mt-1">
                      {item.pronunciation}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-black text-zinc-400 uppercase tracking-widest">
                    {item.level}
                  </div>
                </div>

                {/* Flashcard Azərbaycan dili cümlələr (blur overlay) */}
                <div className="mb-4 space-y-4">
                  {["simple", "complex", "general"].map((type) => (
                    <div key={type} className="relative">
                      <p className="font-bold text-zinc-100 text-sm uppercase mb-1">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Example
                        (AZ):
                      </p>
                      <p
                        className={`text-zinc-300 text-base md:text-lg leading-relaxed transition-all duration-300 ${
                          !showAZ ? "blur-sm select-none" : "blur-0"
                        }`}
                      >
                        {item.examples_az[type]}
                      </p>
                    </div>
                  ))}
                </div>

                {/* English Examples */}
                <div className="space-y-3 border-t border-zinc-800 pt-4">
                  {["simple", "complex", "general"].map((type) => (
                    <div key={type}>
                      <p className="font-bold text-zinc-100 text-sm uppercase mb-1">
                        {type.charAt(0).toUpperCase() + type.slice(1)} Example:
                      </p>
                      <p className="italic text-indigo-300 text-base md:text-lg leading-relaxed">
                        "{item.examples[type]}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <footer className="mt-16 mb-16 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 disabled:opacity-20 hover:bg-zinc-800 transition-all text-indigo-400"
            >
              «
            </button>

            <div className="flex gap-2 bg-zinc-900/30 p-1 rounded-2xl border border-zinc-800/50">
              {getPaginationRange().map((page, i) => (
                <button
                  key={i}
                  disabled={page === "..."}
                  onClick={() => page !== "..." && handlePageChange(page)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    currentPage === page
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                      : page === "..."
                      ? "text-zinc-700 cursor-default"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 disabled:opacity-20 hover:bg-zinc-800 transition-all text-indigo-400"
            >
              »
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
