import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';
import { analyzeText, analyzeImage } from './api';

// Navbar with handlers for Sign In and Get Started
const Navbar = ({
  onSignIn,
  onGetStarted,
}: {
  onSignIn: () => void;
  onGetStarted: () => void;
}) => (
  <motion.nav
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
    className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-slate-700/50 shadow-xl"
  >
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-2xl"
          >
            🧑‍💻
          </motion.span>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Analyzer
            </h1>
            <span className="text-xs text-slate-400 -mt-1">Powered by AI</span>
          </div>
        </motion.div>
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <motion.a
            whileHover={{ scale: 1.05, color: "#60a5fa" }}
            whileTap={{ scale: 0.95 }}
            href="#"
            className="text-slate-300 hover:text-blue-400 transition-colors font-medium"
          >
            Home
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, color: "#a78bfa" }}
            whileTap={{ scale: 0.95 }}
            href="#features"
            className="text-slate-300 hover:text-purple-400 transition-colors font-medium"
          >
            Features
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, color: "#fb7185" }}
            whileTap={{ scale: 0.95 }}
            href="#about"
            className="text-slate-300 hover:text-pink-400 transition-colors font-medium"
          >
            About
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.05, color: "#34d399" }}
            whileTap={{ scale: 0.95 }}
            href="#contact"
            className="text-slate-300 hover:text-emerald-400 transition-colors font-medium"
          >
            Contact
          </motion.a>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:block px-4 py-2 text-slate-300 hover:text-white transition-colors font-medium"
            onClick={onSignIn}
          >
            Sign In
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={onGetStarted}
          >
            Get Started
          </motion.button>
          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 text-slate-300 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  </motion.nav>
);

// Modal component
const Modal = ({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-red-400 text-xl"
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {title}
          </h2>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

function App() {
  const [inputText, setInputText] = useState('');
  const [analysisType, setAnalysisType] = useState<'text' | 'code' | 'screenshot'>('text');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  // Vanta NET background effect
  useEffect(() => {
    if (!vantaEffect.current && vantaRef.current) {
      vantaEffect.current = NET({
        el: vantaRef.current,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xca006b,
        backgroundColor: 0x2a144e,
        spacing: 25,
        showdots: false,
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  const handleAnalyze = async () => {
    if (!inputText.trim() && !uploadedImage) return;
    setLoading(true);
    setResult(null);

    try {
      if (analysisType === 'screenshot' && uploadedImage) {
        const res = await analyzeImage(uploadedImage);
        setResult(res);
      } else if (analysisType === 'code') {
        const res = await analyzeText(inputText, { criteria: 'code', analysisType: 'all', language: 'javascript' });
        setResult(res);
      } else {
        const res = await analyzeText(inputText, { criteria: 'writing' });
        setResult(res);
      }
    } catch (error) {
      setResult({ feedback: 'Error analyzing content. Please try again.' });
    }
    setLoading(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setUploadedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resultVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 + i * 0.15, duration: 0.5 }
    }),
  };

  return (
    <>
      {/* Vanta background */}
      <div ref={vantaRef} className="fixed inset-0 w-full h-full z-0" />

      {/* Navbar */}
      <Navbar
        onSignIn={() => setShowSignIn(true)}
        onGetStarted={() => setShowGetStarted(true)}
      />

      {/* Sign In Modal */}
      <Modal open={showSignIn} onClose={() => setShowSignIn(false)} title="Sign In">
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            setShowSignIn(false);
            alert('Signed in! (Demo only)');
          }}
        >
          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            Sign In
          </motion.button>
        </form>
      </Modal>

      {/* Get Started Modal */}
      <Modal open={showGetStarted} onClose={() => setShowGetStarted(false)} title="Get Started">
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            setShowGetStarted(false);
            alert('Account created! (Demo only)');
          }}
        >
          <input
            type="text"
            placeholder="Full Name"
            className="p-3 rounded bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="p-3 rounded bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="p-3 rounded bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            Create Account
          </motion.button>
        </form>
      </Modal>

      {/* Content overlay - adjusted for navbar */}
      <div className="relative min-h-screen w-full flex flex-col items-center pt-24 pb-10 px-4 z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mb-8 flex flex-col items-center z-10"
        >
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.6 }}
              className="text-5xl"
            >
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              AI-Powered Task and Code Analyzer
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="mt-5 text-extra-large text-slate-300 font-large text-center max-w-2xl"
          >
            Instantly review, correct, and optimize your code, text, or screenshots using AI. Select your mode, paste your content, and get actionable feedback!
          </motion.p>
        </motion.div>

        {/* Mode Switch */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mb-6 flex gap-4 z-10 flex-wrap justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 border-2 ${
              analysisType === 'text'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-blue-400 shadow-lg'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            onClick={() => setAnalysisType('text')}
          >
            Task Name
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 border-2 ${
              analysisType === 'code'
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white border-green-400 shadow-lg'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            onClick={() => setAnalysisType('code')}
          >
            Code
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 border-2 ${
              analysisType === 'screenshot'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 shadow-lg'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            onClick={() => setAnalysisType('screenshot')}
          >
            📷 Screenshot
          </motion.button>
        </motion.div>

        {/* Input Area - Text/Code */}
        {analysisType !== 'screenshot' && (
          <motion.textarea
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1.2 }}
            className="w-full max-w-3xl p-5 border-2 border-slate-800 rounded-xl shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 mb-6 bg-slate-900 text-slate-100 text-lg resize-none transition-all duration-300 z-10"
            rows={10}
            placeholder={analysisType === 'code' ? "Paste your code here..." : "Paste your text here..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        )}

        {/* Screenshot Upload Section */}
        {analysisType === 'screenshot' && (
          !imagePreview ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                dragActive
                  ? 'border-orange-400 bg-orange-900/20'
                  : 'border-slate-700 bg-slate-900 hover:border-slate-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="text-6xl">📷</div>
                <div className="text-xl font-semibold text-slate-300">
                  Upload Screenshot for Analysis
                </div>
                <div className="text-slate-400">
                  Drag & drop your screenshot here, or click to browse
                </div>
                <div className="text-sm text-slate-500">
                  Supports: PNG, JPG, JPEG, GIF
                </div>
              </motion.div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-slate-900 rounded-xl p-6 border-2 border-slate-800">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <img
                    src={imagePreview}
                    alt="Uploaded screenshot"
                    className="w-full max-h-64 object-contain rounded-lg border border-slate-700"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={removeImage}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                >
                  ✕
                </motion.button>
              </div>
              <div className="mt-4 text-center">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Choose different image
                </motion.button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>
          )
        )}

        {/* Analyze Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAnalyze}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed z-10"
          disabled={loading || (analysisType === 'screenshot' ? !uploadedImage : !inputText.trim())}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              Analyzing...
            </span>
          ) : (
            "Analyze"
          )}
        </motion.button>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.12 } }
              }}
              className="mt-10 w-full max-w-3xl bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 z-10"
            >
              {result.score !== undefined && (
                <motion.h2
                  custom={0}
                  variants={resultVariants}
                  className="text-3xl font-bold mb-4 text-blue-300"
                >
                  Score: <span className="text-white">{result.score}</span>
                </motion.h2>
              )}
              {result.feedback && (
                <motion.div custom={1} variants={resultVariants}>
                  <h3 className="text-xl font-semibold mb-2 text-purple-300">Feedback:</h3>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed mb-4">{result.feedback}</p>
                </motion.div>
              )}
              {result.extractedText && (
                <motion.div custom={2} variants={resultVariants}>
                  <h4 className="font-semibold mt-4 text-orange-300">Extracted Text:</h4>
                  <pre className="bg-slate-800 p-4 rounded text-orange-200 overflow-x-auto mb-4">{result.extractedText}</pre>
                </motion.div>
              )}
              {result.detectedElements && result.detectedElements.length > 0 && (
                <motion.div custom={3} variants={resultVariants}>
                  <h4 className="font-semibold mt-4 text-orange-300">Detected Elements:</h4>
                  <ul className="text-orange-200 list-disc ml-6">
                    {result.detectedElements.map((element: string, i: number) => <li key={i}>{element}</li>)}
                  </ul>
                </motion.div>
              )}
              {result.suggestions && result.suggestions.length > 0 && (
                <motion.div custom={4} variants={resultVariants}>
                  <h4 className="font-semibold mt-4 text-cyan-300">Suggestions:</h4>
                  <ul className="text-cyan-200 list-disc ml-6">
                    {result.suggestions.map((suggestion: string, i: number) => <li key={i}>{suggestion}</li>)}
                  </ul>
                </motion.div>
              )}
              {result.strengths && result.strengths.length > 0 && (
                <motion.div custom={5} variants={resultVariants}>
                  <h4 className="font-semibold mt-4 text-green-300">Strengths:</h4>
                  <ul className="text-green-200 list-disc ml-6">
                    {result.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </motion.div>
              )}
              {result.improvements && result.improvements.length > 0 && (
                <motion.div custom={6} variants={resultVariants}>
                  <h4 className="font-semibold mt-4 text-yellow-300">Improvements:</h4>
                  <ul className="text-yellow-200 list-disc ml-6">
                    {result.improvements.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </motion.div>
              )}
              {result.correctedCode && (
                <motion.div custom={7} variants={resultVariants}>
                  <h4 className="font-semibold mt-6 text-blue-400">Corrected Code:</h4>
                  <pre className="bg-slate-800 p-4 rounded text-green-200 overflow-x-auto mb-4">{result.correctedCode}</pre>
                </motion.div>
              )}
              {result.optimizedCode && (
                <motion.div custom={8} variants={resultVariants}>
                  <h4 className="font-semibold mt-6 text-blue-400">Optimized Code:</h4>
                  <pre className="bg-slate-800 p-4 rounded text-blue-200 overflow-x-auto mb-4">{result.optimizedCode}</pre>
                </motion.div>
              )}
              {result.codeIssues && result.codeIssues.length > 0 && (
                <motion.div custom={9} variants={resultVariants}>
                  <h4 className="font-semibold mt-6 text-red-400">Code Issues:</h4>
                  <ul className="text-red-200 list-disc ml-6">
                    {result.codeIssues.map((issue: any, i: number) => (
                      <li key={i} className="mb-2">
                        <strong>{issue.type}</strong> (Severity: {issue.severity}){issue.line ? ` [Line ${issue.line}]` : ''}: {issue.description}
                        <br />
                        <span className="text-yellow-300">Suggestion: {issue.suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section */}
        <section
          id="features"
          className="w-full max-w-5xl mx-auto mt-24 mb-16 px-4 py-12 rounded-3xl bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-blue-900/80 shadow-2xl border border-slate-800 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gradient-to-br from-pink-500/20 via-purple-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
          </div>
          <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <div className="bg-slate-800/80 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col items-center">
              <span className="text-5xl mb-4">🤖</span>
              <h3 className="text-xl font-semibold text-blue-300 mb-2">AI-Powered Analysis</h3>
              <p className="text-slate-300 text-center">Get instant, smart feedback on your code, tasks, or screenshots using advanced AI models.</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col items-center">
              <span className="text-5xl mb-4">📝</span>
              <h3 className="text-xl font-semibold text-purple-300 mb-2">Multi-Mode Input</h3>
              <p className="text-slate-300 text-center">Analyze plain text, code snippets, or even screenshots with seamless drag-and-drop or paste support.</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col items-center">
              <span className="text-5xl mb-4">⚡</span>
              <h3 className="text-xl font-semibold text-pink-300 mb-2">Actionable Suggestions</h3>
              <p className="text-slate-300 text-center">Receive clear, actionable suggestions and improvements to boost your productivity and code quality.</p>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="w-full max-w-4xl mx-auto mb-16 px-4 py-12 rounded-3xl bg-gradient-to-br from-blue-900/90 via-slate-900/80 to-purple-900/80 shadow-2xl border border-slate-800 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -right-32 w-80 h-80 bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          </div>
          <h2 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            About
          </h2>
          <p className="text-lg text-slate-300 text-center max-w-2xl mx-auto relative z-10">
            <span className="font-semibold text-blue-300">AI Analyzer</span> is a modern tool designed to help developers and writers improve their work instantly. Whether you’re coding, writing documentation, or capturing ideas as screenshots, our platform leverages AI to provide meaningful feedback, corrections, and suggestions. Built with a focus on usability, speed, and clarity, it’s your smart companion for everyday productivity.
          </p>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="w-full max-w-3xl mx-auto mb-24 px-4 py-12 rounded-3xl bg-gradient-to-br from-purple-900/90 via-blue-900/80 to-slate-900/80 shadow-2xl border border-slate-800 relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -bottom-20 -left-32 w-80 h-80 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          </div>
          <h2 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Contact
          </h2>
          <form
            className="flex flex-col gap-6 max-w-xl mx-auto relative z-10"
            onSubmit={e => { e.preventDefault(); alert('Thank you for reaching out!'); }}
          >
            <input
              type="text"
              placeholder="Your Name"
              className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <textarea
              placeholder="Your Message"
              rows={5}
              className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              Send Message
            </motion.button>
          </form>
        </section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.5 }}
          className="mt-16 text-slate-500 text-sm text-center z-10"
        >
          &copy; {new Date().getFullYear()} Code Analyzer &mdash; Powered by AI
        </motion.footer>
      </div>
    </>
  );
}

export default App;