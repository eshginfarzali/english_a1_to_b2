import { ArrowUp, Bookmark, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const searchInputRef = useRef(null);

  // 🔐 Open AZ sentences: { "wordIndex-type": true }
  const [openAZ, setOpenAZ] = useState({});

  // 📌 Bookmarks from state (not localStorage)
  const [bookmarked, setBookmarked] = useState({});
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef(null);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show/hide scroll top button and search input
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowScrollTop(currentScrollY > 100);

      // Keep search visible when searching, hide only when scrolling down without search
      if (searchQuery.trim()) {
        setShowSearchInput(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowSearchInput(false);
      } else {
        setShowSearchInput(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, searchQuery]);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle bookmark
  const toggleBookmark = (word) => {
    setBookmarked((prev) => {
      const updated = { ...prev };
      if (updated[word]) {
        delete updated[word];
      } else {
        updated[word] = true;
      }
      return updated;
    });
  };

  const currentLevel = searchParams.get("level") || "All";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  // Helper function to check if word matches level (supports "A1/A2" format)
  const matchesLevel = (wordLevel, filterLevel) => {
    if (filterLevel === "All") return true;
    if (wordLevel === filterLevel) return true;
    // Check if word level contains the filter level (e.g., "A1/A2" contains "A1")
    if (wordLevel.includes("/")) {
      return wordLevel.split("/").includes(filterLevel);
    }
    return false;
  };

  // Enhanced search helper function with safe checks
  const searchMatches = (word, query) => {
    const lowerQuery = query.toLowerCase();

    // Search in word
    if (word.word?.toLowerCase().includes(lowerQuery)) return true;

    // Search in translation
    if (word.translation?.toLowerCase().includes(lowerQuery)) return true;

    // Search in examples
    if (
      word.examples?.simple?.toLowerCase().includes(lowerQuery) ||
      word.examples?.general?.toLowerCase().includes(lowerQuery) ||
      word.examples?.complex?.toLowerCase().includes(lowerQuery)
    ) {
      return true;
    }

    // Search in Azerbaijani examples
    if (
      word.examples_az?.simple?.toLowerCase().includes(lowerQuery) ||
      word.examples_az?.general?.toLowerCase().includes(lowerQuery) ||
      word.examples_az?.complex?.toLowerCase().includes(lowerQuery)
    ) {
      return true;
    }

    return false;
  };

  // Get categorized suggestions with better algorithm and safe checks
  const getSuggestions = () => {
    if (!searchQuery.trim())
      return { beginning: [], middle: [], end: [], consecutive: [] };

    const query = searchQuery.toLowerCase();
    const suggestions = {
      beginning: [],
      middle: [],
      end: [],
      consecutive: [],
    };

    // First pass: word matches
    wordsData.forEach((word) => {
      if (!word.word) return;

      const wordLower = word.word.toLowerCase();

      if (wordLower.includes(query)) {
        if (wordLower.startsWith(query)) {
          suggestions.beginning.push(word.word);
        } else if (wordLower.endsWith(query)) {
          suggestions.end.push(word.word);
        } else {
          suggestions.middle.push(word.word);
        }
      }
    });

    // Second pass: consecutive word sequences in examples
    wordsData.forEach((word) => {
      if (!word.word || !word.examples) return;

      const allExamples = [
        word.examples.simple || "",
        word.examples.general || "",
        word.examples.complex || "",
      ]
        .join(" ")
        .toLowerCase();

      if (
        allExamples.includes(query) &&
        !suggestions.beginning.includes(word.word) &&
        !suggestions.middle.includes(word.word) &&
        !suggestions.end.includes(word.word)
      ) {
        suggestions.consecutive.push(word.word);
      }
    });

    // Sort and limit
    Object.keys(suggestions).forEach((key) => {
      suggestions[key] = [...new Set(suggestions[key])]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 5);
    });

    return suggestions;
  };

  const suggestions = getSuggestions();
  const allSuggestions = [
    ...suggestions.beginning,
    ...suggestions.middle,
    ...suggestions.end,
    ...suggestions.consecutive,
  ];

  const filteredWords = useMemo(() => {
    let filtered =
      currentLevel === "All"
        ? wordsData
        : wordsData.filter((w) => matchesLevel(w.level, currentLevel));

    if (showBookmarksOnly) {
      filtered = filtered.filter((w) => bookmarked[w.word]);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((w) => searchMatches(w, searchQuery));
    }

    return filtered;
  }, [currentLevel, bookmarked, showBookmarksOnly, searchQuery]);

  // Scroll to top only on pagination changes (not during search)
  useEffect(() => {
    if (!searchQuery.trim()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage, searchQuery]);

  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);

  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  const updateParams = (level, page) => {
    const params = {};
    if (level !== "All") params.level = level;
    if (page > 1) params.page = page;
    if (searchQuery.trim()) params.search = searchQuery;
    setSearchParams(params);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);

    if (value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }

    const params = {};
    // When searching, automatically set level to "All" to show all results
    if (value.trim()) {
      // Search mode - don't set level (defaults to All)
      params.page = 1;
      params.search = value;
    } else {
      // No search - keep current level
      if (currentLevel !== "All") params.level = currentLevel;
      params.page = 1;
    }

    setSearchParams(params);
  };

  const handleSuggestionClick = (word) => {
    setSearchQuery(word);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    const params = {};
    // When selecting suggestion, also set level to "All"
    params.page = 1;
    params.search = word;
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    const params = {};
    if (currentLevel !== "All") params.level = currentLevel;
    setSearchParams(params);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < allSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(allSuggestions[selectedSuggestionIndex]);
    }
  };

  // Auto-scroll selected suggestion into view
  useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.querySelector(
        `[data-suggestion-index="${selectedSuggestionIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedSuggestionIndex]);

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
        {/* STICKY SEARCH INPUT - ENHANCED */}
        <div
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 transform ${
            showSearchInput ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="bg-gradient-to-r from-slate-950/98 to-slate-900/98 backdrop-blur-xl border-b border-indigo-800/40 shadow-2xl">
            <div className="flex justify-center p-4">
              <div className="w-full max-w-6xl relative">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none"
                    size={20}
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="🔍 Search words, translations, or examples..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() =>
                      searchQuery.trim() && setShowSuggestions(true)
                    }
                    className="w-full bg-zinc-900/90 border-2 border-zinc-700 rounded-2xl pl-12 pr-12 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-lg"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 transition-colors p-1 hover:bg-zinc-800 rounded-full"
                      title="Clear search"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* ENHANCED SUGGESTIONS DROPDOWN */}
                {showSuggestions && searchQuery.trim() && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-3 bg-zinc-900/98 border-2 border-indigo-500/60 rounded-2xl shadow-2xl z-50 max-h-[28rem] overflow-y-auto backdrop-blur-xl"
                  >
                    {Object.keys(suggestions).every(
                      (key) => suggestions[key].length === 0
                    ) ? (
                      <div className="p-8 text-center">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="text-zinc-400 font-medium">
                          Nəticə tapılmadı
                        </p>
                        <p className="text-zinc-600 text-sm mt-1">
                          Başqa açar söz cəhd edin
                        </p>
                      </div>
                    ) : (
                      <>
                        {suggestions.beginning.length > 0 && (
                          <div className="border-b border-zinc-800">
                            <div className="px-5 py-3 text-xs font-black text-indigo-400 uppercase tracking-widest bg-gradient-to-r from-indigo-950/50 to-transparent flex items-center gap-2">
                              <Sparkles size={14} />
                              Başlangıcdan uyğun
                            </div>
                            {suggestions.beginning.map((word, idx) => {
                              const globalIdx = idx;
                              return (
                                <div
                                  key={word}
                                  data-suggestion-index={globalIdx}
                                  onClick={() => handleSuggestionClick(word)}
                                  className={`px-5 py-3 cursor-pointer text-zinc-100 border-b border-zinc-800/30 last:border-b-0 transition-all font-medium ${
                                    selectedSuggestionIndex === globalIdx
                                      ? "bg-indigo-600/30 text-white"
                                      : "hover:bg-indigo-600/15"
                                  }`}
                                >
                                  {word}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {suggestions.middle.length > 0 && (
                          <div className="border-b border-zinc-800">
                            <div className="px-5 py-3 text-xs font-black text-yellow-400 uppercase tracking-widest bg-gradient-to-r from-yellow-950/50 to-transparent flex items-center gap-2">
                              <Sparkles size={14} />
                              Ortasında uyğun
                            </div>
                            {suggestions.middle.map((word, idx) => {
                              const globalIdx =
                                suggestions.beginning.length + idx;
                              return (
                                <div
                                  key={word}
                                  data-suggestion-index={globalIdx}
                                  onClick={() => handleSuggestionClick(word)}
                                  className={`px-5 py-3 cursor-pointer text-zinc-100 border-b border-zinc-800/30 last:border-b-0 transition-all font-medium ${
                                    selectedSuggestionIndex === globalIdx
                                      ? "bg-indigo-600/30 text-white"
                                      : "hover:bg-indigo-600/15"
                                  }`}
                                >
                                  {word}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {suggestions.end.length > 0 && (
                          <div className="border-b border-zinc-800">
                            <div className="px-5 py-3 text-xs font-black text-orange-400 uppercase tracking-widest bg-gradient-to-r from-orange-950/50 to-transparent flex items-center gap-2">
                              <Sparkles size={14} />
                              Sonunda uyğun
                            </div>
                            {suggestions.end.map((word, idx) => {
                              const globalIdx =
                                suggestions.beginning.length +
                                suggestions.middle.length +
                                idx;
                              return (
                                <div
                                  key={word}
                                  data-suggestion-index={globalIdx}
                                  onClick={() => handleSuggestionClick(word)}
                                  className={`px-5 py-3 cursor-pointer text-zinc-100 border-b border-zinc-800/30 last:border-b-0 transition-all font-medium ${
                                    selectedSuggestionIndex === globalIdx
                                      ? "bg-indigo-600/30 text-white"
                                      : "hover:bg-indigo-600/15"
                                  }`}
                                >
                                  {word}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {suggestions.consecutive.length > 0 && (
                          <div>
                            <div className="px-5 py-3 text-xs font-black text-cyan-400 uppercase tracking-widest bg-gradient-to-r from-cyan-950/50 to-transparent flex items-center gap-2">
                              <Sparkles size={14} />
                              Cümlədə uyğun
                            </div>
                            {suggestions.consecutive.map((word, idx) => {
                              const globalIdx =
                                suggestions.beginning.length +
                                suggestions.middle.length +
                                suggestions.end.length +
                                idx;
                              return (
                                <div
                                  key={word}
                                  data-suggestion-index={globalIdx}
                                  onClick={() => handleSuggestionClick(word)}
                                  className={`px-5 py-3 cursor-pointer text-zinc-100 border-b border-zinc-800/30 last:border-b-0 transition-all font-medium ${
                                    selectedSuggestionIndex === globalIdx
                                      ? "bg-indigo-600/30 text-white"
                                      : "hover:bg-indigo-600/15"
                                  }`}
                                >
                                  {word}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Helper text */}
                        <div className="px-5 py-3 text-xs text-zinc-500 bg-zinc-950/50 border-t border-zinc-800">
                          <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs mr-1">
                            ↑
                          </kbd>
                          <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs mr-1">
                            ↓
                          </kbd>
                          naviqasiya •
                          <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs mx-1">
                            Enter
                          </kbd>
                          seç •
                          <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs mx-1">
                            Esc
                          </kbd>
                          bağla
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between gap-6 mb-14 mt-20 bg-gradient-to-r from-indigo-950/40 to-purple-950/40 p-8 rounded-3xl border border-indigo-800/30 shadow-xl backdrop-blur">
          <div>
            <h1 className="text-4xl font-black text-white italic">
              📚A1 to B2 English Oxford
            </h1>
            <p className="text-zinc-400 text-xs uppercase tracking-widest mt-2">
              {showBookmarksOnly
                ? `📌 ${Object.keys(bookmarked).length} Bookmark`
                : `${filteredWords.length} Söz`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={currentLevel}
              onChange={(e) => updateParams(e.target.value, 1)}
              className="bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 hover:border-indigo-500 transition cursor-pointer"
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
                  ? "bg-indigo-600 text-white shadow-lg"
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
                        <div className="flex items-center gap-3 justify-between">
                          <p
                            className="text-zinc-100 text-base leading-relaxed flex-1"
                            dangerouslySetInnerHTML={{
                              __html: `"${highlightWord(
                                item.examples[type],
                                item.word
                              )}"`,
                            }}
                          />
                          <button
                            onClick={() => speakWord(item.examples[type])}
                            className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600/40 transition-all flex items-center justify-center text-sm flex-shrink-0"
                            title="Listen to English sentence"
                          >
                            🔊
                          </button>
                        </div>

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

        {/* NO RESULTS MESSAGE */}
        {filteredWords.length === 0 && searchQuery.trim() && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-zinc-300 mb-2">
              Nəticə tapılmadı
            </h2>
            <p className="text-zinc-400 mb-4">
              "<span className="font-semibold">{searchQuery}</span>" üçün heç
              bir söz tapılmadı
            </p>
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-lg"
            >
              Axtarışı təmizlə
            </button>
          </div>
        )}

        {/* SCROLL TO TOP BUTTON */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center z-50 hover:scale-110"
            title="Scroll to top"
          >
            <ArrowUp size={24} />
          </button>
        )}

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
