import { ArrowUp, Bookmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import wordsData from "../word.json";

const LEVELS = ["All", "A1", "A2", "B1", "B2"];
const ITEMS_PER_PAGE = 10;

const cardGradients = [
  "from-indigo-500/20 to-purple-500/10",
  "from-emerald-500/20 to-cyan-500/10",
  "from-pink-500/20 to-rose-500/10",
];

/* 🔊 Text to Speech */
const speakWord = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
};

/* ✨ Highlight word inside example */
const highlightWord = (text, word) => {
  const regex = new RegExp(`(${word})`, "gi");
  return text.replace(
    regex,
    `<mark class="bg-indigo-500/30 text-white px-1 rounded font-bold">$1</mark>`
  );
};

export default function Lexicon() {
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔐 Open AZ sentences: { "wordIndex-type": true }
  const [openAZ, setOpenAZ] = useState({});

  // 📌 Bookmarks from localStorage
  const [bookmarked, setBookmarked] = useState({});
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lexicon_bookmarks");
    if (saved) {
      setBookmarked(JSON.parse(saved));
    }
  }, []);

  // Show/hide scroll top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Save bookmarks to localStorage
  const toggleBookmark = (word) => {
    setBookmarked((prev) => {
      const updated = { ...prev };
      if (updated[word]) {
        delete updated[word];
      } else {
        updated[word] = true;
      }
      localStorage.setItem("lexicon_bookmarks", JSON.stringify(updated));
      return updated;
    });
  };

  const currentLevel = searchParams.get("level") || "All";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  const filteredWords = useMemo(() => {
    let filtered =
      currentLevel === "All"
        ? wordsData
        : wordsData.filter((w) => w.level === currentLevel);

    if (showBookmarksOnly) {
      filtered = filtered.filter((w) => bookmarked[w.word]);
    }
    // Scroll to top when pagination changes
    window.scrollTo({ top: 0, behavior: "smooth" });

    return filtered;
  }, [currentLevel, bookmarked, showBookmarksOnly]);

  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);

  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  const updateParams = (level, page) => {
    const params = {};
    if (level !== "All") params.level = level;
    if (page > 1) params.page = page;
    setSearchParams(params);
  };

  const toggleAZ = (key) => {
    setOpenAZ((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-zinc-300 p-4 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between gap-6 mb-14 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 p-8 rounded-3xl border border-indigo-800/30 shadow-xl backdrop-blur">
          <div>
            <h1 className="text-4xl font-black text-white italic">
              📚A1 to B2 English Oxford
            </h1>
            <p className="text-zinc-400 text-xs uppercase tracking-widest mt-2">
              {showBookmarksOnly
                ? `📌 ${Object.keys(bookmarked).length} Bookmarked`
                : `${filteredWords.length} Words`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={currentLevel}
              onChange={(e) => updateParams(e.target.value, 1)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 hover:border-indigo-500 transition"
            >
              {LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl} Level
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                showBookmarksOnly
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-indigo-500"
              }`}
            >
              <Bookmark size={18} />
              Bookmarks
            </button>
          </div>
        </header>

        {/* CARDS */}
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 xl:grid-cols-2 justify-center">
          {paginatedWords.map((item, index) => {
            const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
            const isBookmarked = bookmarked[item.word];

            return (
              <div
                key={index}
                className={`relative rounded-2xl p-8 border transition-all duration-300
                bg-gradient-to-br ${cardGradients[index % 3]}
                backdrop-blur-xl shadow-lg hover:shadow-2xl
                ${
                  isBookmarked
                    ? "border-amber-500/50 ring-1 ring-amber-500/20"
                    : "border-zinc-700/50"
                }`}
              >
                {/* INDEX & BOOKMARK BUTTON */}
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-black text-zinc-500">
                    #{globalIndex}
                  </span>

                  <button
                    onClick={() => toggleBookmark(item.word)}
                    className={`p-2 rounded-full transition-all ${
                      isBookmarked
                        ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                        : "bg-zinc-900/50 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
                    }`}
                    title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                  >
                    <Bookmark
                      size={20}
                      fill={isBookmarked ? "currentColor" : "none"}
                    />
                  </button>
                </div>

                {/* WORD */}
                <div className="flex justify-between items-start gap-6 mb-6">
                  <div>
                    <h2 className="text-4xl font-black text-white mb-2">
                      {item.word}
                    </h2>
                    <p className="text-zinc-300 italic text-sm mb-1">
                      {item.translation}
                    </p>
                    <p className="text-indigo-300 italic text-xs font-mono">
                      /{item.pronunciation}/
                    </p>
                  </div>

                  <button
                    onClick={() => speakWord(item.word)}
                    className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600/40 transition-all flex items-center justify-center text-lg flex-shrink-0"
                    title="Listen pronunciation"
                  >
                    🔊
                  </button>
                </div>

                {/* EXAMPLES */}
                <div className="space-y-5 border-t border-white/10 pt-6">
                  {["simple", "general", "complex"].map((type) => {
                    const azKey = `${globalIndex}-${type}`;
                    const isOpen = openAZ[azKey];

                    return (
                      <div key={type} className="space-y-2">
                        <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">
                          {type === "simple" && "🟢 Simple"}
                          {type === "general" && "🟡 General"}
                          {type === "complex" && "🔴 Complex"}
                        </p>

                        {/* EN */}
                        <p
                          className="text-zinc-100 text-base leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: `"${highlightWord(
                              item.examples[type],
                              item.word
                            )}"`,
                          }}
                        />

                        {/* AZ – CLICK TO OPEN */}
                        <p
                          onClick={() => toggleAZ(azKey)}
                          className={`cursor-pointer text-zinc-300 text-sm transition-all duration-300 p-2 rounded hover:bg-white/5 ${
                            isOpen
                              ? "blur-0 opacity-100"
                              : "blur-sm opacity-60 hover:opacity-85"
                          }`}
                        >
                          {item.examples_az[type]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center z-50 animate-pulse hover:animate-none"
            title="Scroll to top"
          >
            <ArrowUp size={24} />
          </button>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-16">
            {getPaginationRange().map((page, i) => (
              <button
                key={i}
                disabled={page === "..."}
                onClick={() => {
                  if (page !== "...") {
                    updateParams(currentLevel, page);
                    scrollToTop();
                  }
                }}
                className={`w-10 h-10 rounded-xl text-xs font-black border
                  ${
                    currentPage === page
                      ? "bg-indigo-600 text-white scale-110 shadow-lg border border-amber-500/50 ring-1 ring-amber-500/20"
                      : "text-zinc-400 hover:bg-zinc-800"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
