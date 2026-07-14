/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  FileText, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Upload, 
  History, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RotateCcw, 
  Download, 
  Printer, 
  ChevronRight, 
  Check, 
  Layers, 
  ArrowRight,
  TrendingUp,
  FileCode,
  Sparkles,
  ExternalLink,
  Clipboard,
  ClipboardCheck,
  Languages,
  Sun,
  Moon
} from 'lucide-react';

interface BandScores {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
}

interface MetricsFeedback {
  taskAchievement: string;
  coherenceCohesion: string;
  lexicalResource: string;
  grammaticalRange: string;
}

interface Correction {
  id: string;
  metric: 'taskAchievement' | 'coherenceCohesion' | 'lexicalResource' | 'grammaticalRange';
  originalText: string;
  correctedText: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

interface EvaluationResult {
  id: string;
  timestamp: string;
  type: 'writing' | 'speaking';
  taskType: string;
  promptText: string;
  submissionText: string;
  candidateName?: string;
  targetScore?: string;
  bandScores: BandScores;
  overallBand: number;
  metricsFeedback: MetricsFeedback;
  corrections: Correction[];
  strengths: string[];
  weaknesses: string[];
  actionableAdvice: string[];
  wordCount: number;
  estimatedSpeakingTimeSeconds?: number;
}

// Default candidate mock details for aesthetics
const CANDIDATE_NAME = "Sofia G. Moretti";
const CANDIDATE_TARGET = "8.0";

// Sample data for quick trial
const SAMPLE_WRITING_T2 = {
  prompt: "The global crisis regarding environmental degradation requires a multi-national response rather than isolated efforts. To what extent do you agree or disagree?",
  text: `The global crisis regarding environmental degradation requires a multi-national response rather than isolated efforts. I completely agree with this statement. In my opinion, the range of problems require international coordination because pollution do not respect national borders.

Firstly, environmental issues like global warming and deforestation affects everyone, regardless of where they live. For instance, carbon emissions produced in one country can cause rising sea levels that threaten coastal cities thousands of miles away. Therefore, single governments acting alone cannot solve these massive issues. They must collaborate together to create binding agreements, like the Paris Accord, which set limits on carbon emissions for all nations.

Secondly, multinational corporations often exploit weaker regulations in developing nations, leading to severe ecological damage. If countries work in isolation, they might lower their environmental standards to attract businesses. However, if a united group of nations sets universal environmental standards, these corporations will have no choice but to follow them. This show that cooperative legislation is much more powerful than individual actions.

In conclusion, environmental degradation is a global challenge that demands a global solution. The range of problems require multi-national treaty and enforcement to ensure a healthy biosphere for future generations.`
};

const SAMPLE_WRITING_T1 = {
  prompt: "The chart below shows the number of households in the US by annual income in 2007, 2011, and 2015. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
  text: `The bar chart compares the number of US households across five different income categories in the years 2007, 2011, and 2015. Overall, there was a noticeable increase in the number of households in the highest and lowest income brackets, while middle-income categories experienced relatively stable or slightly declining numbers.

To begin with, the group of households earning $100,000 or more was the largest in 2007, standing at just under 30 million. This figure dropped slightly in 2011 to around 27 million, but then rose sharply in 2015 to reach a peak of approximately 33 million, making it the most common income bracket once again. A similar pattern was observed in the lowest income category (under $25,000), which started at 25 million in 2007, grew to 29 million in 2011, and remained high at 28 million in 2015.

Conversely, the middle-income brackets showed less fluctuation. Households earning between $50,000 and $74,999 remained steady at around 21 million across all three years. Similarly, the $75,000 to $99,999 bracket hover consistently between 14 and 15 million. The $25,000 to $49,999 income group saw a small increase from 27 million in 2007 to nearly 30 million in 2011, before falling back to around 28 million in 2015.

In conclusion, households earning the highest and lowest amounts grew over the period, whilst middle income households remained highly stable.`
};

const SAMPLE_SPEAKING_P2 = {
  prompt: "Describe a memorable journey you took. You should say: where you went, how you travelled, who you went with, and explain why this journey was so memorable.",
  text: `I would like to talk about a memorable journey I took last summer. I went to the Scottish Highlands with my two best friends, and we travelled there by taking a night sleeper train from London. 

The journey was extremely special right from the start because we boarded the train late in the evening, and as the train was moving, we could see the city lights fade away. We spent the night in a cozy sleeper cabin, sharing stories and laughing, which was really amazing. When we woke up in the morning, the scenery had completely changed. Instead of concrete buildings, we were greeted by rolling green hills, majestic misty mountains, and clear blue lochs. 

This journey was incredibly memorable because it was the first time I traveled to Scotland, and the contrast between the bustling city and the serene nature was absolutely breathtaking. Also, traveling by train gave us a sense of slow-paced adventure that you just can't get by flying. It felt like we were really experiencing the landscape change rather than just arriving at a destination. We hiked through beautiful glens and stayed in small villages, which created bonds between us that will last forever.`
};

const CircularScore = ({ score }: { score: number }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 9) * circumference;

  return (
    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle 
          cx="24" 
          cy="24" 
          r={radius} 
          className="text-[#F0EFEC] dark:text-[#3C3933]" 
          strokeWidth="3" 
          stroke="currentColor" 
          fill="transparent" 
        />
        <circle 
          cx="24" 
          cy="24" 
          r={radius} 
          className="text-[#C5A059] dark:text-[#D4B26F] transition-all duration-1000" 
          strokeWidth="3" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round" 
          stroke="currentColor" 
          fill="transparent" 
        />
      </svg>
      <span className="absolute text-xs font-mono font-bold text-black dark:text-white">
        {score.toFixed(1)}
      </span>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history' | 'rubric'>('evaluate');
  const [type, setType] = useState<'writing' | 'speaking'>('writing');
  const [taskType, setTaskType] = useState<string>('task2');
  const [promptText, setPromptText] = useState<string>('Should universities focus on vocational training or academic theory?');
  const [submissionText, setSubmissionText] = useState<string>('Universities play a vital role in society by shaping the minds of young professionals. It is argued that higher education should focus purely on vocational training, while others believe academic knowledge is more valuable. In this essay, I will explore both sides and support the view that a hybrid approach is essential.');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Evaluation Result State
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
  
  // History state
  const [historyList, setHistoryList] = useState<EvaluationResult[]>([]);
  
  // UI and interactions
  const [activeCorrectionId, setActiveCorrectionId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Candidate Customization State
  const [candidateName, setCandidateName] = useState<string>(() => localStorage.getItem('ielts_candidate_name') || 'Sofia G. Moretti');
  const [targetScore, setTargetScore] = useState<string>(() => localStorage.getItem('ielts_target_score') || '8.0');
  
  // Writing input mode & upload details
  const [writingInputMode, setWritingInputMode] = useState<'text' | 'upload'>('text');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  
  // Theme Dark Mode state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('ielts_eval_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Synchronize theme state with DOM
  useEffect(() => {
    localStorage.setItem('ielts_eval_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Synchronize candidate settings
  useEffect(() => {
    localStorage.setItem('ielts_candidate_name', candidateName);
  }, [candidateName]);

  useEffect(() => {
    localStorage.setItem('ielts_target_score', targetScore);
  }, [targetScore]);
  
  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // SQLite database history loader
  const loadHistory = async () => {
    try {
      const apiHost = (import.meta as any).env.VITE_API_URL || '';
      const response = await fetch(`${apiHost}/api/evaluations`);
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data);
      }
    } catch (e) {
      console.error('Failed to load history from database:', e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const apiHost = (import.meta as any).env.VITE_API_URL || '';
      const response = await fetch(`${apiHost}/api/evaluations/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setHistoryList(prev => prev.filter(item => item.id !== id));
        if (currentResult && currentResult.id === id) {
          setCurrentResult(null);
        }
      }
    } catch (e) {
      console.error('Failed to delete history record:', e);
    }
  };

  // Analytics Dashboard states
  const [analyticsCandidate, setAnalyticsCandidate] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [candidatesList, setCandidatesList] = useState<string[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState<boolean>(false);

  // Fetch analytics data
  const loadAnalytics = async (candidateFilter: string) => {
    setIsAnalyticsLoading(true);
    try {
      const apiHost = (import.meta as any).env.VITE_API_URL || '';
      const response = await fetch(`${apiHost}/api/analytics?candidate=${candidateFilter}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        if (data.candidates) {
          setCandidatesList(data.candidates);
        }
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  // Reload analytics when tab switches or candidate selection changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics(analyticsCandidate);
    }
  }, [activeTab, analyticsCandidate]);

  // Synchronize taskType options based on evaluation type
  useEffect(() => {
    if (type === 'writing') {
      setTaskType('task2');
    } else {
      setTaskType('part2');
    }
  }, [type]);

  // Audio Recording & Web Speech Recognition implementation
  const startRecording = () => {
    setErrorMsg(null);
    
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Your browser does not support voice transcription. We've enabled normal recording simulation, but for best results please use Chrome or Safari.");
      // Simulated recording
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';

      recognition.onstart = () => {
        setIsRecording(true);
        setRecordingSeconds(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setSubmissionText(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone permissions.');
          stopRecording();
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (e: any) {
      setErrorMsg('Could not initialize speech recognition: ' + e.message);
    }
  };

  const stopRecording = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
      setRecognitionInstance(null);
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // If browser didn't support recognition and we were simulating:
    if (!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && submissionText.length === 0) {
      // Put standard sample
      setSubmissionText(SAMPLE_SPEAKING_P2.text);
      setPromptText(SAMPLE_SPEAKING_P2.prompt);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger IELTS Evaluation via Server-Side API
  const handleEvaluate = async () => {
    if (!submissionText.trim() || submissionText.trim().length < 20) {
      setErrorMsg('Please enter or record a substantial response (at least 20 characters) for analysis.');
      return;
    }

    setIsEvaluating(true);
    setErrorMsg(null);
    setCurrentResult(null);

    try {
      const apiHost = (import.meta as any).env.VITE_API_URL || '';
      const response = await fetch(`${apiHost}/api/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          taskType,
          promptText,
          submissionText,
          candidateName,
          targetScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error evaluating the submission.');
      }

      const data = await response.json();
      setCurrentResult(data);
      setHistoryList(prev => [data, ...prev]);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'An error occurred during evaluation. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setWritingInputMode('upload');
    readFileContent(file);
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setSubmissionText(text);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Could not read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const loadSample = (sampleType: 'writing1' | 'writing2' | 'speaking2') => {
    setUploadedFileName(null);
    setWritingInputMode('text');
    if (sampleType === 'writing1') {
      setType('writing');
      setTaskType('task1');
      setPromptText(SAMPLE_WRITING_T1.prompt);
      setSubmissionText(SAMPLE_WRITING_T1.text);
    } else if (sampleType === 'writing2') {
      setType('writing');
      setTaskType('task2');
      setPromptText(SAMPLE_WRITING_T2.prompt);
      setSubmissionText(SAMPLE_WRITING_T2.text);
    } else {
      setType('speaking');
      setTaskType('part2');
      setPromptText(SAMPLE_SPEAKING_P2.prompt);
      setSubmissionText(SAMPLE_SPEAKING_P2.text);
    }
    setErrorMsg(null);
  };

  // Render highlights in submission text
  const renderHighlightedText = () => {
    if (!currentResult) return <p className="text-sm leading-relaxed text-[#555] dark:text-[#C8C6C2]">{submissionText}</p>;
    
    const text = currentResult.submissionText;
    const corrections = currentResult.corrections;
    
    if (!corrections || corrections.length === 0) {
      return <p className="text-sm leading-relaxed text-[#555] dark:text-[#C8C6C2] whitespace-pre-wrap">{text}</p>;
    }

    // Sort corrections by index of appearance to avoid overlapping highlight ranges
    const sortedCorrections = [...corrections]
      .filter(c => c.originalText && text.includes(c.originalText))
      .sort((a, b) => text.indexOf(a.originalText) - text.indexOf(b.originalText));

    if (sortedCorrections.length === 0) {
      return <p className="text-sm leading-relaxed text-[#555] dark:text-[#C8C6C2] whitespace-pre-wrap">{text}</p>;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    sortedCorrections.forEach((corr, index) => {
      const startIndex = text.indexOf(corr.originalText, lastIndex);
      if (startIndex === -1) return; // Not found

      // Add preceding plain text
      if (startIndex > lastIndex) {
        elements.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, startIndex)}</span>);
      }

      // Add highlighted text
      const isSelected = activeCorrectionId === corr.id;
      const severityColors = 
        corr.severity === 'high' 
          ? 'bg-red-100 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-900/50' 
          : corr.severity === 'medium'
            ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-[#C5A059]/30'
            : 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';

      const selectedStyles = isSelected ? 'ring-2 ring-offset-1 ring-[#C5A059] font-semibold' : '';

      elements.push(
        <span 
          key={`highlight-${corr.id}`}
          onClick={() => setActiveCorrectionId(corr.id)}
          className={`cursor-pointer border-b px-1 py-0.5 rounded-sm transition-all ${severityColors} ${selectedStyles}`}
          title={`Click to view correction: ${corr.correctedText}`}
        >
          {corr.originalText}
        </span>
      );

      lastIndex = startIndex + corr.originalText.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(<span key={`text-end`}>{text.substring(lastIndex)}</span>);
    }

    return <p className="text-sm leading-relaxed text-[#555] dark:text-[#C8C6C2] whitespace-pre-wrap">{elements}</p>;
  };

  const copyToClipboard = () => {
    if (!currentResult) return;
    navigator.clipboard.writeText(JSON.stringify(currentResult, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getBandDescriptor = (score: number) => {
    if (score >= 8.5) return 'Expert User (9.0)';
    if (score >= 8.0) return 'Very Good User (8.0)';
    if (score >= 7.0) return 'Good User (7.0)';
    if (score >= 6.0) return 'Competent User (6.0)';
    if (score >= 5.0) return 'Modest User (5.0)';
    if (score >= 4.0) return 'Limited User (4.0)';
    return 'Extremely Limited User';
  };

  const wordCount = submissionText.trim() === '' ? 0 : submissionText.trim().split(/\s+/).length;

  return (
    <div className="min-h-screen bg-[#F9F8F6] dark:bg-[#181715] text-[#1A1A1A] dark:text-[#E6E5E2] font-sans antialiased flex flex-col justify-between selection:bg-[#C5A059]/30 dark:selection:bg-[#C5A059]/50 selection:text-black dark:selection:text-white transition-colors duration-200">
      {/* Platform Header */}
      <header className="h-24 border-b border-[#DEDCD7] dark:border-[#3C3933] flex items-center justify-between px-6 md:px-12 bg-white dark:bg-[#201F1D] sticky top-0 z-50 transition-colors duration-200">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] font-bold text-[#8C8A84] dark:text-[#A6A49F] uppercase">IELTS AI Practice Advisor</span>
          <h1 className="text-xl md:text-2xl font-serif italic font-medium tracking-tight">
            IELTS Smart Practice AI <span className="text-[#C5A059] dark:text-[#D4B26F] font-sans not-italic text-xs md:text-sm font-bold bg-[#F9F8F6] dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] px-2 py-0.5 rounded-full ml-1">v2.4</span>
          </h1>
        </div>
        
        {/* Navigation Tabs & Theme Toggle */}
        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-center gap-1 md:gap-4">
            <button 
              id="tab-evaluate"
              onClick={() => setActiveTab('evaluate')}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'evaluate' 
                  ? 'border-[#C5A059] dark:border-[#D4B26F] text-[#1A1A1A] dark:text-white bg-[#F9F8F6]/50 dark:bg-[#181715]/50' 
                  : 'border-transparent text-[#8C8A84] dark:text-[#A6A49F] hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Evaluation</span>
            </button>
            <button 
              id="tab-history"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'history' 
                  ? 'border-[#C5A059] dark:border-[#D4B26F] text-[#1A1A1A] dark:text-white bg-[#F9F8F6]/50 dark:bg-[#181715]/50' 
                  : 'border-transparent text-[#8C8A84] dark:text-[#A6A49F] hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved Reports ({historyList.length})</span>
            </button>
            <button 
              id="tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'analytics' 
                  ? 'border-[#C5A059] dark:border-[#D4B26F] text-[#1A1A1A] dark:text-white bg-[#F9F8F6]/50 dark:bg-[#181715]/50' 
                  : 'border-transparent text-[#8C8A84] dark:text-[#A6A49F] hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
            <button 
              id="tab-rubric"
              onClick={() => setActiveTab('rubric')}
              className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'rubric' 
                  ? 'border-[#C5A059] dark:border-[#D4B26F] text-[#1A1A1A] dark:text-white bg-[#F9F8F6]/50 dark:bg-[#181715]/50' 
                  : 'border-transparent text-[#8C8A84] dark:text-[#A6A49F] hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Band Descriptors</span>
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            className="p-2 border border-[#DEDCD7] dark:border-[#3C3933] text-[#8C8A84] dark:text-[#A6A49F] hover:text-black dark:hover:text-white hover:border-[#C5A059] dark:hover:border-[#D4B26F] rounded-full transition-all bg-[#F9F8F6]/50 dark:bg-[#181715]/50"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 py-8 grid grid-cols-12 gap-8">
        
        {/* ACTIVE EVALUATION TAB */}
        {activeTab === 'evaluate' && (
          <>
            {/* LEFT INPUT COLUMN */}
            <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              
              {/* Submission Options Box */}
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-4">Practice Options</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] mb-1.5">Candidate Name</label>
                    <input 
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full bg-[#F0EFEC] dark:bg-[#2C2A26] border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] rounded-sm"
                      placeholder="Sofia G. Moretti"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] mb-1.5">Target Band Score</label>
                    <select
                      value={targetScore}
                      onChange={(e) => setTargetScore(e.target.value)}
                      className="w-full bg-[#F0EFEC] dark:bg-[#2C2A26] border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] rounded-sm"
                    >
                      <option value="5.0">5.0</option>
                      <option value="5.5">5.5</option>
                      <option value="6.0">6.0</option>
                      <option value="6.5">6.5</option>
                      <option value="7.0">7.0</option>
                      <option value="7.5">7.5</option>
                      <option value="8.0">8.0</option>
                      <option value="8.5">8.5</option>
                      <option value="9.0">9.0</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Evaluation Type */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] mb-2">Practice Mode</label>
                    <div className="flex bg-[#F0EFEC] dark:bg-[#2C2A26] p-0.5 rounded-sm">
                      <button
                        onClick={() => setType('writing')}
                        className={`flex-1 text-center py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          type === 'writing' ? 'bg-white dark:bg-[#181715] shadow-sm text-black dark:text-white' : 'text-[#8C8A84] dark:text-[#A6A49F] hover:text-[#1A1A1A] dark:hover:text-white'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Writing
                      </button>
                      <button
                        onClick={() => setType('speaking')}
                        className={`flex-1 text-center py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          type === 'speaking' ? 'bg-white dark:bg-[#181715] shadow-sm text-black dark:text-white' : 'text-[#8C8A84] dark:text-[#A6A49F] hover:text-[#1A1A1A] dark:hover:text-white'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        Speaking
                      </button>
                    </div>
                  </div>

                  {/* Task Type */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] mb-2">Test Part</label>
                    {type === 'writing' ? (
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className="w-full bg-[#F0EFEC] dark:bg-[#2C2A26] border border-[#DEDCD7] dark:border-[#3C3933] text-[#1A1A1A] dark:text-white px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] rounded-sm"
                      >
                        <option value="task1">Academic/General Task 1</option>
                        <option value="task2">Academic/General Task 2</option>
                      </select>
                    ) : (
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className="w-full bg-[#F0EFEC] dark:bg-[#2C2A26] border border-[#DEDCD7] dark:border-[#3C3933] text-[#1A1A1A] dark:text-white px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] rounded-sm"
                      >
                        <option value="part1">Part 1: Interview</option>
                        <option value="part2">Part 2: Cue Card (Long Turn)</option>
                        <option value="part3">Part 3: Discussion</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Sample essays presets */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] mb-2">Try a Sample Response</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => loadSample('writing1')}
                      className={`px-2 py-1 text-[10px] bg-[#F0EFEC] dark:bg-[#2C2A26] hover:bg-[#C5A059]/15 dark:hover:bg-[#D4B26F]/15 border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white rounded-sm font-semibold transition-all ${
                        type === 'writing' && taskType === 'task1' ? 'border-[#C5A059] dark:border-[#D4B26F] bg-[#C5A059]/5' : ''
                      }`}
                    >
                      Writing Task 1
                    </button>
                    <button 
                      onClick={() => loadSample('writing2')}
                      className={`px-2 py-1 text-[10px] bg-[#F0EFEC] dark:bg-[#2C2A26] hover:bg-[#C5A059]/15 dark:hover:bg-[#D4B26F]/15 border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white rounded-sm font-semibold transition-all ${
                        type === 'writing' && taskType === 'task2' ? 'border-[#C5A059] dark:border-[#D4B26F] bg-[#C5A059]/5' : ''
                      }`}
                    >
                      Writing Task 2 (Essay)
                    </button>
                    <button 
                      onClick={() => loadSample('speaking2')}
                      className={`px-2 py-1 text-[10px] bg-[#F0EFEC] dark:bg-[#2C2A26] hover:bg-[#C5A059]/15 dark:hover:bg-[#D4B26F]/15 border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white rounded-sm font-semibold transition-all ${
                        type === 'speaking' ? 'border-[#C5A059] dark:border-[#D4B26F] bg-[#C5A059]/5' : ''
                      }`}
                    >
                      Speaking Part 2 Cue Card
                    </button>
                  </div>
                </div>
              </div>

              {/* Input Area (Topic Prompt & Essay text or voice) */}
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm flex-1 flex flex-col justify-between min-h-[400px] transition-all duration-200">
                <div className="flex flex-col gap-4 flex-1">
                  
                  {/* Topic / Question Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] mb-1">
                      Test Question / Topic <span className="text-[#8C8A84]/60 dark:text-[#A6A49F]/60">(Optional)</span>
                    </label>
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="Paste the official exam question topic here..."
                      className="w-full bg-[#F9F8F6] dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white p-3 text-xs focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] rounded-sm min-h-[60px] resize-none"
                    />
                  </div>

                  {/* Submission Text or Voice Recording UI */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F]">
                        {type === 'writing' ? 'Your Response Input' : 'Paste or Type Speaking Transcript'}
                      </label>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-[#8C8A84] dark:text-[#A6A49F]">
                        <span>Words: {wordCount}</span>
                        {type === 'writing' && <span>(Recommended: {taskType === 'task1' ? '150+' : '250+'})</span>}
                      </div>
                    </div>

                    {type === 'writing' && (
                      <div className="flex border-b border-[#EBE9E4] dark:border-[#3C3933] mb-3">
                        <button
                          onClick={() => setWritingInputMode('text')}
                          className={`pb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                            writingInputMode === 'text'
                              ? 'border-[#C5A059] text-black dark:text-white'
                              : 'border-transparent text-[#8C8A84] dark:text-[#A6A49F] hover:text-black dark:hover:text-white'
                          }`}
                        >
                          Type Response
                        </button>
                        <button
                          onClick={() => setWritingInputMode('upload')}
                          className={`pb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                            writingInputMode === 'upload'
                              ? 'border-[#C5A059] text-black dark:text-white'
                              : 'border-transparent text-[#8C8A84] dark:text-[#A6A49F] hover:text-black dark:hover:text-white'
                          }`}
                        >
                          Upload Document
                        </button>
                      </div>
                    )}

                    {type === 'writing' ? (
                      writingInputMode === 'text' ? (
                        <div className="relative flex-1 flex flex-col min-h-[220px]">
                          <textarea
                            value={submissionText}
                            onChange={(e) => {
                              setSubmissionText(e.target.value);
                              setUploadedFileName(null);
                            }}
                            placeholder="Type or paste your response here..."
                            className="w-full flex-1 bg-[#F9F8F6] dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white p-4 text-xs font-sans leading-relaxed focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] rounded-sm resize-none"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col justify-center items-center min-h-[220px] border-2 border-dashed border-[#C5A059]/40 dark:border-[#D4B26F]/40 bg-[#F9F8F6]/50 dark:bg-[#181715]/50 hover:bg-[#F0EFEC] dark:hover:bg-[#2C2A26] text-center rounded-sm transition-all relative p-6 cursor-pointer group">
                          <input 
                            type="file" 
                            accept=".txt,.doc,.docx"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          />
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#C5A059]/10 dark:bg-[#D4B26F]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Upload className="w-6 h-6 text-[#C5A059] dark:text-[#D4B26F]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-black dark:text-white mb-1">
                                {uploadedFileName ? 'Document Loaded Successfully' : 'Drag & Drop Your Document Here'}
                              </p>
                              <p className="text-[10px] text-[#8C8A84] dark:text-[#A6A49F]">
                                {uploadedFileName ? (
                                  <span className="text-[#C5A059] dark:text-[#D4B26F] font-mono font-bold">{uploadedFileName}</span>
                                ) : (
                                  'Supports .txt, .doc, or .docx text files'
                                )}
                              </p>
                            </div>
                            {uploadedFileName && (
                              <div className="mt-2 bg-[#C5A059]/15 dark:bg-[#D4B26F]/10 text-[#C5A059] dark:text-[#D4B26F] text-[9px] font-mono font-bold px-2 py-1 rounded-sm">
                                {wordCount} Words Detected
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      // Speaking Modality Input & Voice Recorder
                      <div className="flex-1 flex flex-col gap-3 min-h-[220px]">
                        <textarea
                          value={submissionText}
                          onChange={(e) => {
                            setSubmissionText(e.target.value);
                            setUploadedFileName(null);
                          }}
                          placeholder="Type your speech transcript here, or use our voice recorder below..."
                          className="w-full flex-1 bg-[#F9F8F6] dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] text-black dark:text-white p-4 text-xs font-sans leading-relaxed focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] rounded-sm resize-none"
                        />
                        
                        {/* Interactive Voice Recorder */}
                        <div className="p-4 border border-[#DEDCD7] dark:border-[#3C3933] bg-[#F0EFEC]/40 dark:bg-[#2C2A26]/40 rounded-sm flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={isRecording ? stopRecording : startRecording}
                              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                isRecording 
                                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                                  : 'bg-[#C5A059] hover:bg-[#b08d4b] text-white shadow-md'
                              }`}
                              title={isRecording ? 'Stop Recording' : 'Start Recording Speech'}
                            >
                              {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <div>
                              <p className="text-xs font-bold text-black dark:text-white">{isRecording ? 'Recording voice...' : 'Voice Practice Recorder'}</p>
                              {isRecording ? (
                                <div className="flex items-center gap-0.5 mt-1.5 h-5">
                                  {[...Array(15)].map((_, i) => {
                                    const heights = [10, 18, 14, 8, 20, 12, 16, 6, 14, 10, 18, 8, 12, 16, 10];
                                    return (
                                      <div 
                                        key={i} 
                                        className="w-[2.5px] bg-red-500 dark:bg-red-400 rounded-full animate-sound-wave origin-bottom" 
                                        style={{ 
                                          height: `${heights[i % heights.length]}px`, 
                                          animationDelay: `${i * 0.08}s` 
                                        }} 
                                      />
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-[#8C8A84] dark:text-[#A6A49F]">
                                  Click to record your voice
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Timer and visual feedback */}
                          <div className="text-right">
                            <span className="font-mono text-sm font-bold bg-[#EBE9E4] dark:bg-[#3C3933] px-3 py-1.5 rounded-sm shadow-inner text-black dark:text-white">
                              {formatTime(recordingSeconds)}
                            </span>
                            <p className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase tracking-wider mt-1">Target: 2:00 mins</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Errors display */}
                {errorMsg && (
                  <div className="my-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200 text-xs rounded-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Audit Submission Button */}
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className={`mt-6 w-full py-4 text-xs uppercase tracking-[0.25em] font-bold border transition-all flex items-center justify-center gap-2 ${
                    isEvaluating 
                      ? 'bg-white/50 dark:bg-[#201F1D]/50 text-[#8C8A84] dark:text-[#A6A49F] border-[#DEDCD7] dark:border-[#3C3933] cursor-wait' 
                      : 'bg-[#1A1A1A] dark:bg-[#D4B26F] hover:bg-[#2A2A2A] dark:hover:bg-[#c3a160] text-white dark:text-[#181715] border-[#1A1A1A] dark:border-[#D4B26F]'
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></span>
                      Evaluating your response...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#C5A059] dark:text-[#181715]" />
                      Get AI Score & Feedback
                    </>
                  )}
                </button>
              </div>

              {/* Candidate Info Card */}
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-5 rounded-sm shadow-sm transition-all">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-3">Candidate Profile</h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase block tracking-wider">Candidate</span>
                    <b className="text-[#1A1A1A] dark:text-white block truncate">
                      {currentResult?.candidateName || candidateName}
                    </b>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase block tracking-wider">Target score</span>
                    <b className="text-[#1A1A1A] dark:text-white block">
                      {currentResult?.targetScore || targetScore} Overall
                    </b>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase block tracking-wider">Evaluation Mode</span>
                    <b className="text-[#C5A059] dark:text-[#D4B26F] block flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> AI Standard
                    </b>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT ANALYTICS & RESULTS LAYER */}
            <section className="col-span-12 lg:col-span-7 flex flex-col gap-6">
              
              {!currentResult && !isEvaluating && (
                <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-12 rounded-sm text-center flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-white dark:from-[#201F1D] to-[#F9F8F6] dark:to-[#181715]">
                  <Layers className="w-16 h-16 text-[#C5A059] dark:text-[#D4B26F] mb-4 opacity-70 stroke-[1.2]" />
                  <h3 className="text-2xl font-serif italic mb-2 text-black dark:text-white">Ready for AI Evaluation</h3>
                  <p className="text-[#8C8A84] dark:text-[#A6A49F] text-xs max-w-md mx-auto leading-relaxed mb-6">
                    Type or paste your response, select a practice preset, and click "Get AI Score & Feedback" to get started.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-lg">
                    <div className="p-3 bg-white dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] rounded-sm text-center">
                      <b className="text-[#C5A059] dark:text-[#D4B26F] block font-serif italic text-lg">9.0</b>
                      <span className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase tracking-wider block">Official Standards</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] rounded-sm text-center">
                      <TrendingUp className="w-5 h-5 text-[#C5A059] dark:text-[#D4B26F] mx-auto mb-1 stroke-[1.5]" />
                      <span className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase tracking-wider block">Score Estimator</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] rounded-sm text-center">
                      <FileCode className="w-5 h-5 text-[#C5A059] dark:text-[#D4B26F] mx-auto mb-1 stroke-[1.5]" />
                      <span className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase tracking-wider block">Report Data</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] rounded-sm text-center">
                      <Languages className="w-5 h-5 text-[#C5A059] dark:text-[#D4B26F] mx-auto mb-1 stroke-[1.5]" />
                      <span className="text-[9px] text-[#8C8A84] dark:text-[#A6A49F] uppercase tracking-wider block">Coaching Tips</span>
                    </div>
                  </div>
                </div>
              )}

              {isEvaluating && (
                <div className="flex flex-col gap-6 animate-pulse w-full">
                  {/* Status Banner */}
                  <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 p-4 rounded-sm flex items-center justify-between dark:bg-[#C5A059]/5 dark:border-[#C5A059]/20">
                    <div className="flex items-center gap-3">
                      <span className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider">AI is scoring your response...</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#C5A059] bg-white dark:bg-[#201F1D] px-2 py-0.5 border border-[#C5A059]/30 rounded-sm">POWERED BY GEMINI AI</span>
                  </div>

                  {/* Header Skeleton */}
                  <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-[#F0EFEC] dark:bg-[#2C2A26] shrink-0"></div>
                      <div className="flex flex-col gap-2">
                        <div className="h-3.5 w-16 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                        <div className="h-6 w-48 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                        <div className="h-3 w-36 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                      </div>
                    </div>
                    <div className="h-9 w-24 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm shrink-0"></div>
                  </div>

                  {/* Bento Grid Skeletons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-5 rounded-sm shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="h-3 w-28 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                              <div className="h-2.5 w-16 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#F0EFEC] dark:bg-[#2C2A26] shrink-0"></div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="h-2.5 w-full bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                            <div className="h-2.5 w-5/6 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                            <div className="h-2.5 w-4/5 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Inspector Skeletons */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-7 bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm min-h-[300px] flex flex-col gap-3">
                      <div className="h-3.5 w-32 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                      <div className="h-full bg-[#F9F8F6] dark:bg-[#181715] border border-[#EBE9E4] dark:border-[#2C2A26] p-4 flex flex-col gap-2 rounded-sm flex-1">
                        <div className="h-3 w-full bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                        <div className="h-3 w-11/12 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                        <div className="h-3 w-5/6 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                        <div className="h-3 w-full bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                      </div>
                    </div>
                    <div className="xl:col-span-5 bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm min-h-[300px] flex flex-col gap-3">
                      <div className="h-3.5 w-36 bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                      <div className="flex flex-col gap-2 flex-1 justify-between py-2">
                        <div className="h-12 w-full bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                        <div className="h-12 w-full bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                        <div className="h-12 w-full bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentResult && !isEvaluating && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  
                  {/* Results Overview: Overall score & metadata */}
                  <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-200">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[#C5A059] dark:border-[#D4B26F] flex flex-col items-center justify-center bg-white dark:bg-[#181715] shadow-md shrink-0">
                        <span className="text-4xl md:text-5xl font-serif font-bold italic tracking-tighter text-black dark:text-white">
                          {currentResult.overallBand.toFixed(1)}
                        </span>
                        <span className="text-[8px] font-mono text-[#C5A059] dark:text-[#D4B26F] uppercase font-bold tracking-widest mt-0.5">BAND SCORE</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#8C8A84] dark:text-[#A6A49F] bg-[#F0EFEC] dark:bg-[#2C2A26] px-2 py-0.5 font-bold font-mono">
                          ID: {currentResult.id}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-serif tracking-tight mt-1 text-black dark:text-white">Your Band Score Report</h2>
                        <p className="text-[#8C8A84] dark:text-[#A6A49F] text-xs mt-0.5">
                          {getBandDescriptor(currentResult.overallBand)} • {currentResult.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 self-end md:self-auto">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 border border-[#DEDCD7] dark:border-[#3C3933] hover:border-[#C5A059] dark:hover:border-[#D4B26F] text-[#1A1A1A] dark:text-white hover:bg-white dark:hover:bg-[#181715] text-xs font-semibold flex items-center gap-2 rounded-sm transition-all"
                        title="Copy machine JSON data"
                      >
                        {isCopied ? <ClipboardCheck className="w-4 h-4 text-[#C5A059]" /> : <Clipboard className="w-4 h-4 text-[#8C8A84] dark:text-[#A6A49F]" />}
                        <span className="hidden md:inline">JSON</span>
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="p-2 border border-[#DEDCD7] dark:border-[#3C3933] hover:border-[#C5A059] dark:hover:border-[#D4B26F] text-[#1A1A1A] dark:text-white hover:bg-white dark:hover:bg-[#181715] text-xs font-semibold flex items-center gap-2 rounded-sm transition-all"
                        title="Print official report"
                      >
                        <Printer className="w-4 h-4 text-[#8C8A84] dark:text-[#A6A49F]" />
                        <span className="hidden md:inline">Print Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Core Metrics Bento Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* TA */}
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-widest block">
                              {currentResult.type === 'writing' ? 'Task Achievement' : 'Task Response'}
                            </span>
                            <span className="text-[10px] text-[#8C8A84] dark:text-[#A6A49F] block mt-0.5">Official Score Criteria</span>
                          </div>
                          <CircularScore score={currentResult.bandScores.taskAchievement} />
                        </div>
                        <p className="text-xs text-[#555] dark:text-[#C8C6C2] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.taskAchievement}
                        </p>
                      </div>
                    </div>

                    {/* CC */}
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-widest block">Coherence & Cohesion</span>
                            <span className="text-[10px] text-[#8C8A84] dark:text-[#A6A49F] block mt-0.5">Official Score Criteria</span>
                          </div>
                          <CircularScore score={currentResult.bandScores.coherenceCohesion} />
                        </div>
                        <p className="text-xs text-[#555] dark:text-[#C8C6C2] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.coherenceCohesion}
                        </p>
                      </div>
                    </div>

                    {/* LR */}
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-widest block">Lexical Resource</span>
                            <span className="text-[10px] text-[#8C8A84] dark:text-[#A6A49F] block mt-0.5">Official Score Criteria</span>
                          </div>
                          <CircularScore score={currentResult.bandScores.lexicalResource} />
                        </div>
                        <p className="text-xs text-[#555] dark:text-[#C8C6C2] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.lexicalResource}
                        </p>
                      </div>
                    </div>

                    {/* GRA */}
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-widest block font-sans">Grammatical Range</span>
                            <span className="text-[10px] text-[#8C8A84] dark:text-[#A6A49F] block mt-0.5">Official Score Criteria</span>
                          </div>
                          <CircularScore score={currentResult.bandScores.grammaticalRange} />
                        </div>
                        <p className="text-xs text-[#555] dark:text-[#C8C6C2] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.grammaticalRange}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Submission Highlight Display & Corrections Panel (Side-by-Side on Desktop) */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    
                    {/* Left: Annotated Text Viewer */}
                    <div className="xl:col-span-7 bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm flex flex-col transition-all duration-200">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-4 border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2 text-black dark:text-white">
                        Correction Markup
                      </h3>
                      <div className="bg-[#F9F8F6] dark:bg-[#181715] p-4 rounded-sm border border-[#EBE9E4] dark:border-[#3C3933] flex-1 max-h-[450px] overflow-y-auto text-black dark:text-white">
                        {renderHighlightedText()}
                      </div>
                      <div className="flex gap-4 mt-3 text-[10px] text-[#8C8A84] dark:text-[#A6A49F]">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-900 inline-block rounded-full"></span> Critical Errors</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 inline-block rounded-full"></span> Grammar & Style Tips</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 inline-block rounded-full"></span> Word Choice Tips</span>
                      </div>
                    </div>

                    {/* Right: Correction Matrix */}
                    <div className="xl:col-span-5 bg-[#1A1A1A] p-6 rounded-sm shadow-lg text-white flex flex-col justify-between max-h-[550px]">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059]">Sentence Corrections</h3>
                          <span className="text-[9px] font-mono text-white/40 uppercase">Interactive Log</span>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[380px] pr-2">
                          {currentResult.corrections && currentResult.corrections.length > 0 ? (
                            currentResult.corrections.map((corr, index) => {
                              const isSelected = activeCorrectionId === corr.id;
                              const borderStyle = isSelected ? 'border-[#C5A059] bg-white/5' : 'border-white/5 hover:border-white/15';
                              const severityBadge = 
                                corr.severity === 'high' 
                                  ? 'text-red-400 font-mono text-[9px]' 
                                  : corr.severity === 'medium'
                                    ? 'text-amber-400 font-mono text-[9px]'
                                    : 'text-yellow-200 font-mono text-[9px]';

                              return (
                                <div 
                                  key={corr.id}
                                  onClick={() => setActiveCorrectionId(corr.id)}
                                  className={`p-3 border rounded-sm transition-all cursor-pointer ${borderStyle}`}
                                >
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[#C5A059] font-mono text-xs font-bold">{String(index + 1).padStart(2, '0')}</span>
                                      <span className="text-[9px] uppercase tracking-wider text-white/50">{corr.metric.replace(/([A-Z])/g, ' $1')}</span>
                                    </div>
                                    <span className={severityBadge}>{corr.severity.toUpperCase()}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-white/90">
                                    &ldquo;{corr.originalText}&rdquo; &rarr; <span className="text-green-400 font-medium">{corr.correctedText}</span>
                                  </p>
                                  {isSelected && (
                                    <p className="mt-2 text-[11px] text-white/60 leading-relaxed bg-black/30 p-2 rounded-sm border border-white/5 font-sans">
                                      {corr.explanation}
                                    </p>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-12 text-white/40 text-xs italic">
                              Great job! No spelling or grammar corrections needed.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 text-right">
                        <span className="text-[9px] font-mono text-white/30 uppercase">EXPORT REPORT DATA</span>
                      </div>
                    </div>

                  </div>

                  {/* Strengths, Weaknesses, and Actionable Steps (Bento Style Grid) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Strengths */}
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" /> Key Strengths
                      </h3>
                      <ul className="space-y-3">
                        {currentResult.strengths?.map((str, index) => (
                          <li key={index} className="text-xs text-[#444] dark:text-[#C8C6C2] leading-relaxed flex items-start gap-2.5">
                            <span className="font-mono text-[10px] text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded-sm mt-0.5">+{index+1}</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Areas for Improvement
                      </h3>
                      <ul className="space-y-3">
                        {currentResult.weaknesses?.map((weak, index) => (
                          <li key={index} className="text-xs text-[#444] dark:text-[#C8C6C2] leading-relaxed flex items-start gap-2.5">
                            <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded-sm mt-0.5">-{index+1}</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actionable Steps */}
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] dark:text-[#D4B26F] mb-4 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-[#C5A059] dark:text-[#D4B26F]" /> Step-by-Step Action Plan
                      </h3>
                      <ol className="space-y-3">
                        {currentResult.actionableAdvice?.map((advice, index) => (
                          <li key={index} className="text-xs text-[#444] dark:text-[#C8C6C2] leading-relaxed flex items-start gap-2.5">
                            <span className="font-mono text-[10px] bg-[#F0EFEC] dark:bg-[#2C2A26] text-black dark:text-white font-bold px-1.5 py-0.5 rounded-sm mt-0.5">{index+1}</span>
                            <span>{advice}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                </div>
              )}

            </section>
          </>
        )}

        {/* PORTFOLIO / HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="col-span-12 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-8 rounded-sm shadow-sm transition-all duration-200">
              <h2 className="text-2xl font-serif italic mb-2 text-black dark:text-white">Saved Practice Reports</h2>
              <p className="text-[#8C8A84] dark:text-[#A6A49F] text-xs">
                Your practice history. All reports are saved securely inside your browser's local storage.
              </p>
            </div>

            {historyList.length === 0 ? (
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-16 text-center rounded-sm transition-all duration-200">
                <Layers className="w-12 h-12 text-[#C5A059]/40 dark:text-[#D4B26F]/40 mx-auto mb-4" />
                <h3 className="text-lg font-serif italic mb-1 text-black dark:text-white">Your Portfolio is Empty</h3>
                <p className="text-[#8C8A84] dark:text-[#A6A49F] text-xs mb-6">
                  You haven't run any AI practice tests yet. Complete your first evaluation to start tracking your band scores.
                </p>
                <button 
                  onClick={() => setActiveTab('evaluate')}
                  className="px-6 py-3 bg-[#1A1A1A] dark:bg-[#D4B26F] hover:bg-[#2A2A2A] dark:hover:bg-[#c3a160] text-white dark:text-[#181715] text-xs uppercase tracking-widest font-bold transition-all"
                >
                  Start Practice Test
                </button>
              </div>
            ) : (
              <>
                {/* Stats Summary Bento Cards & Trajectory */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 animate-fade-in">
                  
                  {/* Stats Overview */}
                  <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-4 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-all">
                      <span className="text-[9px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-wider">Average Band</span>
                      <b className="text-3xl font-serif italic text-[#C5A059] dark:text-[#D4B26F] mt-2">
                        {(historyList.reduce((acc, item) => acc + item.overallBand, 0) / historyList.length).toFixed(1)}
                      </b>
                    </div>
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-4 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-all">
                      <span className="text-[9px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-wider">Tests Run</span>
                      <b className="text-3xl font-serif italic text-black dark:text-white mt-2">
                        {historyList.length}
                      </b>
                    </div>
                    <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-4 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-all col-span-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-wider">Activity Mix</span>
                        <span className="text-[9px] font-mono text-[#C5A059] dark:text-[#D4B26F]">Writing / Speaking</span>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <b className="text-xl font-serif italic text-black dark:text-white">
                          {historyList.filter(i => i.type === 'writing').length} essays / {historyList.filter(i => i.type === 'speaking').length} talks
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart */}
                  <div className="lg:col-span-8 bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-5 rounded-sm shadow-sm flex flex-col justify-between min-h-[160px] hover:border-[#C5A059] dark:hover:border-[#D4B26F] transition-all">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[9px] uppercase font-bold text-[#8C8A84] dark:text-[#A6A49F] tracking-widest">Score Progress Tracker</h3>
                        <span className="text-[9px] font-mono bg-[#F0EFEC] dark:bg-[#2C2A26] px-2 py-0.5 rounded-sm uppercase text-black dark:text-white font-bold">Band 4.0 - 9.0 Trajectory</span>
                      </div>
                      <div className="h-24 w-full relative">
                        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                          {/* Grid Lines */}
                          <line x1="0" y1="5" x2="100" y2="5" stroke="#EBE9E4" strokeWidth="0.2" className="dark:stroke-white/5" strokeDasharray="1 1" />
                          <line x1="0" y1="15" x2="100" y2="15" stroke="#EBE9E4" strokeWidth="0.2" className="dark:stroke-white/5" strokeDasharray="1 1" />
                          <line x1="0" y1="25" x2="100" y2="25" stroke="#EBE9E4" strokeWidth="0.2" className="dark:stroke-white/5" strokeDasharray="1 1" />
                          
                          {(() => {
                            const points = historyList
                              .map((item, idx) => {
                                const x = historyList.length === 1 ? 50 : (idx / (historyList.length - 1)) * 100;
                                // Project score range 4.0 (bottom, y=26) to 9.0 (top, y=4)
                                const scorePercentage = (item.overallBand - 4) / 5;
                                const y = 26 - (scorePercentage * 22);
                                return `${x},${y}`;
                              })
                              .join(' ');

                            return (
                              <>
                                <polyline
                                  fill="none"
                                  stroke="#C5A059"
                                  strokeWidth="1"
                                  points={points}
                                  className="dark:stroke-[#D4B26F] transition-all"
                                />
                                {historyList.map((item, idx) => {
                                  const x = historyList.length === 1 ? 50 : (idx / (historyList.length - 1)) * 100;
                                  const scorePercentage = (item.overallBand - 4) / 5;
                                  const y = 26 - (scorePercentage * 22);
                                  return (
                                    <g key={idx} className="group/dot">
                                      <circle
                                        cx={x}
                                        cy={y}
                                        r="1.5"
                                        className="fill-white dark:fill-[#201F1D] stroke-[#C5A059] dark:stroke-[#D4B26F] stroke-[1] cursor-pointer hover:r-2 transition-all"
                                      />
                                      <title>{`Test Date: ${item.timestamp} | Band Score: ${item.overallBand.toFixed(1)}`}</title>
                                    </g>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                        
                        {/* Timeline axis */}
                        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] font-mono text-[#8C8A84] dark:text-[#A6A49F] px-1 pt-1 border-t border-[#F0EFEC] dark:border-[#3C3933]">
                          <span>Earliest</span>
                          <span>Evaluation History Timeline</span>
                          <span>Latest</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card List Header */}
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-4">Detailed Practice Log</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyList.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setCurrentResult(item);
                      setActiveTab('evaluate');
                    }}
                    className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] hover:border-[#C5A059] dark:hover:border-[#D4B26F] p-6 rounded-sm shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[240px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2">
                        <span className="text-[10px] font-mono text-[#8C8A84] dark:text-[#A6A49F] uppercase tracking-wider">{item.timestamp}</span>
                        <span className="text-[10px] font-mono bg-[#F0EFEC] dark:bg-[#2C2A26] px-2 py-0.5 rounded-sm uppercase tracking-wider text-black dark:text-white font-bold">
                          {item.type} ({item.taskType})
                        </span>
                      </div>
                      <h4 className="font-serif italic text-lg leading-snug line-clamp-2 mb-2 text-black dark:text-white">&ldquo;{item.promptText}&rdquo;</h4>
                      <p className="text-xs text-[#555] dark:text-[#C8C6C2] line-clamp-3 mb-4 italic">&ldquo;{item.submissionText}&rdquo;</p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F0EFEC] dark:border-[#3C3933]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] font-bold">Score:</span>
                        <span className="font-serif font-bold text-[#C5A059] dark:text-[#D4B26F] text-xl italic">{item.overallBand.toFixed(1)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => deleteFromHistory(item.id, e)}
                          className="px-2.5 py-1 text-[10px] uppercase font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-sm border border-red-200 dark:border-red-900/50"
                        >
                          Delete
                        </button>
                        <span className="px-2.5 py-1 text-[10px] uppercase font-bold bg-[#1A1A1A] dark:bg-[#3C3933] text-white dark:text-[#C8C6C2] rounded-sm">View</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="col-span-12 flex flex-col gap-6">
            {/* Header Toolbar */}
            <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
              <div>
                <h2 className="text-xl md:text-2xl font-serif italic mb-1 text-black dark:text-white">Practice Analytics Dashboard</h2>
                <p className="text-[#8C8A84] dark:text-[#A6A49F] text-xs">
                  Review aggregate statistics and student progress benchmarking from the SQLite database.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-wider text-[#8C8A84] dark:text-[#A6A49F] font-bold">Filter Student:</label>
                <select 
                  value={analyticsCandidate}
                  onChange={(e) => setAnalyticsCandidate(e.target.value)}
                  className="bg-[#F9F8F6] dark:bg-[#181715] border border-[#DEDCD7] dark:border-[#3C3933] text-xs font-mono px-3 py-1.5 focus:outline-none focus:border-[#C5A059] dark:focus:border-[#D4B26F] text-black dark:text-white"
                >
                  <option value="all">All Candidates (Global)</option>
                  {candidatesList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const headers = ['Report ID', 'Candidate Name', 'Target Score', 'Type', 'Task Type', 'Overall Band', 'Task Achievement', 'Coherence', 'Lexical', 'Grammar', 'Word Count', 'Date'];
                    const rows = historyList
                      .filter(h => analyticsCandidate === 'all' || h.candidateName === analyticsCandidate)
                      .map(h => [
                        h.id,
                        h.candidateName,
                        h.targetScore,
                        h.type,
                        h.taskType,
                        h.overallBand,
                        h.bandScores.taskAchievement,
                        h.bandScores.coherenceCohesion,
                        h.bandScores.lexicalResource,
                        h.bandScores.grammaticalRange,
                        h.wordCount,
                        h.timestamp
                      ]);
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `ielts_analytics_${analyticsCandidate === 'all' ? 'all_students' : analyticsCandidate.toLowerCase().replace(/\s+/g, '_')}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3.5 py-1.5 bg-[#1A1A1A] dark:bg-[#3C3933] text-white dark:text-[#C8C6C2] hover:bg-[#C5A059] dark:hover:bg-[#D4B26F] text-xs uppercase tracking-wider font-bold transition-all rounded-sm flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {isAnalyticsLoading || !analyticsData ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] rounded-sm animate-pulse">
                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
                <span className="text-xs text-[#8C8A84] uppercase tracking-widest font-mono">Compiling Statistics...</span>
              </div>
            ) : (
              <>
                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all">
                    <span className="text-[10px] tracking-[0.15em] font-bold text-[#8C8A84] dark:text-[#A6A49F] uppercase block mb-1">Average Band Score</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-serif italic font-bold text-[#C5A059] dark:text-[#D4B26F]">{analyticsData.kpis.avgOverall}</span>
                      <span className="text-xs text-[#8C8A84] font-mono">/ 9.0 Rating</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all">
                    <span className="text-[10px] tracking-[0.15em] font-bold text-[#8C8A84] dark:text-[#A6A49F] uppercase block mb-1">Evaluations Audited</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-black dark:text-white">{analyticsData.kpis.totalTests}</span>
                      <span className="text-xs text-[#8C8A84] uppercase font-bold font-sans">Sessions</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all">
                    <span className="text-[10px] tracking-[0.15em] font-bold text-[#8C8A84] dark:text-[#A6A49F] uppercase block mb-1">Mean Response Length</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-black dark:text-white">{analyticsData.kpis.avgWords}</span>
                      <span className="text-xs text-[#8C8A84] font-sans">Words / practice</span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all">
                    <span className="text-[10px] tracking-[0.15em] font-bold text-[#8C8A84] dark:text-[#A6A49F] uppercase block mb-1">Mean Error Density</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-red-600 dark:text-red-400">{analyticsData.kpis.avgTotalErrors}</span>
                      <span className="text-xs text-[#8C8A84] font-sans">Mistakes ({analyticsData.kpis.avgCriticalErrors} High severity)</span>
                    </div>
                  </div>
                </div>

                {/* Charts Bento Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Band Score Histogram */}
                  <div className="lg:col-span-8 bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-serif italic border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2 mb-4 text-[#C5A059] dark:text-[#D4B26F] font-bold">
                        Score distribution histogram (All evaluation events)
                      </h3>
                      {analyticsData.distribution.length === 0 ? (
                        <div className="text-center py-10 text-xs text-[#8C8A84]">No distribution data available. Add more evaluations.</div>
                      ) : (
                        <div className="h-64 flex items-end justify-between gap-2 pt-6 pb-2 px-4 border-b border-[#DEDCD7] dark:border-[#3C3933] border-l">
                          {(() => {
                            const maxVal = Math.max(...analyticsData.distribution.map((d: any) => d.count), 1);
                            const targetBands = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];
                            return targetBands.map(bandScore => {
                              const match = analyticsData.distribution.find((d: any) => Math.abs(d.band - bandScore) < 0.1);
                              const val = match ? match.count : 0;
                              const heightPct = (val / maxVal) * 80;
                              return (
                                <div key={bandScore} className="flex-1 flex flex-col items-center group relative">
                                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-[#3C3933] text-white dark:text-[#C8C6C2] text-[10px] px-2 py-0.5 rounded-sm font-mono whitespace-nowrap z-10">
                                    {val} Test{val !== 1 ? 's' : ''}
                                  </div>
                                  <div className="w-full bg-[#F0EFEC] dark:bg-[#2C2A26] rounded-t-sm overflow-hidden flex items-end h-48">
                                    <div 
                                      style={{ height: `${heightPct}%` }}
                                      className="w-full bg-[#C5A059] dark:bg-[#D4B26F] hover:bg-black dark:hover:bg-white transition-all duration-300"
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono mt-2 font-bold text-[#8C8A84] dark:text-[#A6A49F]">
                                    {bandScore.toFixed(1)}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-[#8C8A84] dark:text-[#A6A49F] mt-2 px-4">
                      <span>Lower bands</span>
                      <span>IELTS overall band score</span>
                      <span>Higher bands</span>
                    </div>
                  </div>

                  {/* Skills breakdown comparison */}
                  <div className="lg:col-span-4 bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-serif italic border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2 mb-4 text-[#C5A059] dark:text-[#D4B26F] font-bold">
                        Skills profiles: Essay vs talk modalities
                      </h3>
                      {analyticsData.skills.length === 0 ? (
                        <div className="text-center py-10 text-xs text-[#8C8A84]">No skill breakdown logs available.</div>
                      ) : (
                        <div className="space-y-6 pt-2">
                          {analyticsData.skills.map((s: any) => (
                            <div key={s.type} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-widest font-bold text-black dark:text-white">
                                  {s.type === 'writing' ? 'Writing tasks' : 'Speaking talks'}
                                </span>
                                <span className="text-xs font-serif italic font-bold text-[#C5A059] dark:text-[#D4B26F]">
                                  Band Avg: {s.avgOverall}
                                </span>
                              </div>

                              <div className="space-y-2.5 bg-[#F9F8F6] dark:bg-[#181715] p-3 border border-[#F0EFEC] dark:border-[#3C3933] rounded-sm">
                                {[
                                  { label: 'Task Achievement', score: s.avgTA },
                                  { label: 'Coherence & Cohesion', score: s.avgCC },
                                  { label: 'Lexical Resource', score: s.avgLR },
                                  { label: 'Grammar Accuracy', score: s.avgGRA }
                                ].map(skill => {
                                  const widthPct = (Number(skill.score) / 9.0) * 100;
                                  return (
                                    <div key={skill.label} className="space-y-1">
                                      <div className="flex justify-between text-[10px] text-[#8C8A84] dark:text-[#A6A49F]">
                                        <span>{skill.label}</span>
                                        <span className="font-mono font-bold text-black dark:text-white">{skill.score}</span>
                                      </div>
                                      <div className="h-1.5 bg-[#EAE8E3] dark:bg-[#2C2A26] rounded-full overflow-hidden">
                                        <div 
                                          style={{ width: `${widthPct}%` }}
                                          className="h-full bg-[#1A1A1A] dark:bg-[#C8C6C2] rounded-full"
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* IELTS RUBRICS TAB */}
        {activeTab === 'rubric' && (
          <div className="col-span-12 flex flex-col gap-8">
            <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-8 rounded-sm shadow-sm transition-all duration-200">
              <h2 className="text-2xl font-serif italic mb-2 text-black dark:text-white">Official IELTS Band Descriptors Guide</h2>
              <p className="text-[#8C8A84] dark:text-[#A6A49F] text-xs">
                Official public descriptors for IELTS bands: Task Achievement, Coherence & Cohesion, Vocabulary, and Grammar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Task Achievement */}
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2 mb-4 text-[#C5A059] dark:text-[#D4B26F] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059] dark:text-[#D4B26F]" /> Task Achievement (Task 1) / Response (Task 2)
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555] dark:text-[#C8C6C2]">
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 9.0</h4>
                    <p>Fully addresses all the requirements of the task. Presents a fully developed response to the question with detailed, fully substantiated ideas.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 8.0</h4>
                    <p>Sufficiently addresses all requirements. Presents a well-developed response to the question with relevant, extended and supported ideas.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 7.0</h4>
                    <p>Addresses all parts of the task. Presents a clear position throughout. Presents, extends and supports key ideas, but there may be a tendency to over-generalise.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 6.0</h4>
                    <p>Addresses all parts of the task, though some parts may be more fully covered than others. Presents a relevant position, though conclusions may be unclear or repetitive.</p>
                  </div>
                </div>
              </div>

              {/* Coherence & Cohesion */}
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2 mb-4 text-[#C5A059] dark:text-[#D4B26F] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059] dark:text-[#D4B26F]" /> Coherence and Cohesion
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555] dark:text-[#C8C6C2]">
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 9.0</h4>
                    <p>Uses cohesion in such a way that it attracts no attention. Skilfully manages paragraphing throughout the response.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 8.0</h4>
                    <p>Sequences information and ideas logically. Manages all aspects of cohesion well. Uses paragraphing sufficiently and appropriately.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 7.0</h4>
                    <p>Logically organises information and ideas; there is clear progression throughout. Uses a range of cohesive devices appropriately, though there may be some under-/over-use.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 6.0</h4>
                    <p>Coherently organises information and ideas; there is clear overall progression. Uses cohesive devices effectively, but cohesion within/between sentences may be faulty.</p>
                  </div>
                </div>
              </div>

              {/* Lexical Resource */}
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2 mb-4 text-[#C5A059] dark:text-[#D4B26F] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059] dark:text-[#D4B26F]" /> Lexical Resource (Vocabulary)
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555] dark:text-[#C8C6C2]">
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 9.0</h4>
                    <p>Uses a wide range of vocabulary with very natural and sophisticated control of lexical features; rare minor errors occur only as 'slips'.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 8.0</h4>
                    <p>Uses a wide range of vocabulary fluently and flexibly to convey precise meanings. Skilfully uses uncommon lexical items with rare inaccuracies in collocation/spelling.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 7.0</h4>
                    <p>Uses a sufficient range of vocabulary to allow some flexibility and precision. Uses less common lexical items with some awareness of style and collocation.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 6.0</h4>
                    <p>Uses an adequate range of vocabulary for the task. Attempts to use less common vocabulary but with some inaccuracy. Makes some spelling/word-formation errors.</p>
                  </div>
                </div>
              </div>

              {/* Grammatical Range */}
              <div className="bg-white dark:bg-[#201F1D] border border-[#DEDCD7] dark:border-[#3C3933] p-6 rounded-sm shadow-sm transition-all duration-200">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] dark:border-[#3C3933] pb-2 mb-4 text-[#C5A059] dark:text-[#D4B26F] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059] dark:text-[#D4B26F]" /> Grammatical Range and Accuracy
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555] dark:text-[#C8C6C2]">
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 9.0</h4>
                    <p>Uses a wide range of structures with full flexibility and accuracy; rare minor errors occur only as 'slips'.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 8.0</h4>
                    <p>Uses a wide range of structures. The majority of sentences are error-free. Makes only very occasional grammar or punctuation errors.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 7.0</h4>
                    <p>Uses a variety of complex structures. Produces frequent error-free sentences. Has good control of grammar and punctuation but may make a few errors.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black dark:text-white font-mono">BAND 6.0</h4>
                    <p>Uses a mix of simple and complex structures. Makes some errors in grammar and punctuation but they rarely reduce communication overall.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Platform Footer */}
      <footer className="h-16 border-t border-[#DEDCD7] dark:border-[#3C3933] bg-white dark:bg-[#201F1D] flex flex-col md:flex-row items-center px-6 md:px-12 justify-between gap-2 py-3 transition-all duration-200">
        <p className="text-[9px] uppercase tracking-widest text-[#8C8A84] dark:text-[#A6A49F] text-center md:text-left">
          © {new Date().getFullYear()} IELTS Smart Practice AI v2.4. Learn smarter, score higher.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] uppercase tracking-widest text-[#1A1A1A] dark:text-white font-bold font-mono">All Systems Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
