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
  Languages
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history' | 'rubric'>('evaluate');
  const [type, setType] = useState<'writing' | 'speaking'>('writing');
  const [taskType, setTaskType] = useState<string>('task2');
  const [promptText, setPromptText] = useState<string>('');
  const [submissionText, setSubmissionText] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Evaluation Result State
  const [currentResult, setCurrentResult] = useState<EvaluationResult | null>(null);
  
  // History state
  const [historyList, setHistoryList] = useState<EvaluationResult[]>([]);
  
  // UI and interactions
  const [activeCorrectionId, setActiveCorrectionId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('ielts_eval_history');
    if (stored) {
      try {
        setHistoryList(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Update localStorage when history changes
  const saveToHistory = (newResult: EvaluationResult) => {
    const updated = [newResult, ...historyList];
    setHistoryList(updated);
    localStorage.setItem('ielts_eval_history', JSON.stringify(updated));
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    localStorage.setItem('ielts_eval_history', JSON.stringify(updated));
    if (currentResult && currentResult.id === id) {
      setCurrentResult(null);
    }
  };

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
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          taskType,
          promptText,
          submissionText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server returned an error evaluating the submission.');
      }

      const data = await response.json();
      
      const newReport: EvaluationResult = {
        id: `UK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).toUpperCase() + ' / ' + new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        type,
        taskType,
        promptText: promptText || (type === 'writing' ? 'IELTS Writing Essay' : 'IELTS Speaking cue topic'),
        submissionText,
        ...data
      };

      setCurrentResult(newReport);
      saveToHistory(newReport);
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
    if (!currentResult) return <p className="text-sm leading-relaxed text-[#555]">{submissionText}</p>;
    
    const text = currentResult.submissionText;
    const corrections = currentResult.corrections;
    
    if (!corrections || corrections.length === 0) {
      return <p className="text-sm leading-relaxed text-[#555] whitespace-pre-wrap">{text}</p>;
    }

    // Sort corrections by index of appearance to avoid overlapping highlight ranges
    const sortedCorrections = [...corrections]
      .filter(c => c.originalText && text.includes(c.originalText))
      .sort((a, b) => text.indexOf(a.originalText) - text.indexOf(b.originalText));

    if (sortedCorrections.length === 0) {
      return <p className="text-sm leading-relaxed text-[#555] whitespace-pre-wrap">{text}</p>;
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
          ? 'bg-red-100 hover:bg-red-200 border-red-300 text-red-900' 
          : corr.severity === 'medium'
            ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
            : 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-900';

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

    return <p className="text-sm leading-relaxed text-[#555] whitespace-pre-wrap">{elements}</p>;
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
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] font-sans antialiased flex flex-col justify-between selection:bg-[#C5A059]/30 selection:text-black">
      {/* Platform Header */}
      <header className="h-24 border-b border-[#DEDCD7] flex items-center justify-between px-6 md:px-12 bg-white sticky top-0 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] font-bold text-[#8C8A84] uppercase">IELTS Assessment Framework</span>
          <h1 className="text-xl md:text-2xl font-serif italic font-medium tracking-tight">
            IELTS Feedback Engine <span className="text-[#C5A059] font-sans not-italic text-xs md:text-sm font-bold bg-[#F9F8F6] border border-[#DEDCD7] px-2 py-0.5 rounded-full ml-1">v2.4</span>
          </h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 md:gap-4">
          <button 
            id="tab-evaluate"
            onClick={() => setActiveTab('evaluate')}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'evaluate' 
                ? 'border-[#C5A059] text-[#1A1A1A] bg-[#F9F8F6]/50' 
                : 'border-transparent text-[#8C8A84] hover:text-[#1A1A1A]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Audit</span>
          </button>
          <button 
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'border-[#C5A059] text-[#1A1A1A] bg-[#F9F8F6]/50' 
                : 'border-transparent text-[#8C8A84] hover:text-[#1A1A1A]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portfolio ({historyList.length})</span>
          </button>
          <button 
            id="tab-rubric"
            onClick={() => setActiveTab('rubric')}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'rubric' 
                ? 'border-[#C5A059] text-[#1A1A1A] bg-[#F9F8F6]/50' 
                : 'border-transparent text-[#8C8A84] hover:text-[#1A1A1A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">IELTS Rubrics</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 py-8 grid grid-cols-12 gap-8">
        
        {/* ACTIVE AUDIT TAB */}
        {activeTab === 'evaluate' && (
          <>
            {/* LEFT INPUT COLUMN */}
            <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              
              {/* Submission Options Box */}
              <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-4">Practice Settings</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Evaluation Type */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] mb-2">Practice Modality</label>
                    <div className="flex bg-[#F0EFEC] p-0.5 rounded-sm">
                      <button
                        onClick={() => setType('writing')}
                        className={`flex-1 text-center py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          type === 'writing' ? 'bg-white shadow-sm text-black' : 'text-[#8C8A84] hover:text-[#1A1A1A]'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Writing
                      </button>
                      <button
                        onClick={() => setType('speaking')}
                        className={`flex-1 text-center py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          type === 'speaking' ? 'bg-white shadow-sm text-black' : 'text-[#8C8A84] hover:text-[#1A1A1A]'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5" />
                        Speaking
                      </button>
                    </div>
                  </div>

                  {/* Task Type */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] mb-2">Exam Section</label>
                    {type === 'writing' ? (
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className="w-full bg-[#F0EFEC] border border-[#DEDCD7] px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C5A059] rounded-sm"
                      >
                        <option value="task1">Academic/General Task 1</option>
                        <option value="task2">Academic/General Task 2</option>
                      </select>
                    ) : (
                      <select
                        value={taskType}
                        onChange={(e) => setTaskType(e.target.value)}
                        className="w-full bg-[#F0EFEC] border border-[#DEDCD7] px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#C5A059] rounded-sm"
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
                  <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] mb-2">Load Test Samples</label>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => loadSample('writing1')}
                      className={`px-2 py-1 text-[10px] bg-[#F0EFEC] hover:bg-[#C5A059]/15 border border-[#DEDCD7] rounded-sm font-semibold transition-all ${
                        type === 'writing' && taskType === 'task1' ? 'border-[#C5A059] bg-[#C5A059]/5' : ''
                      }`}
                    >
                      Writing Task 1
                    </button>
                    <button 
                      onClick={() => loadSample('writing2')}
                      className={`px-2 py-1 text-[10px] bg-[#F0EFEC] hover:bg-[#C5A059]/15 border border-[#DEDCD7] rounded-sm font-semibold transition-all ${
                        type === 'writing' && taskType === 'task2' ? 'border-[#C5A059] bg-[#C5A059]/5' : ''
                      }`}
                    >
                      Writing Task 2 (Essay)
                    </button>
                    <button 
                      onClick={() => loadSample('speaking2')}
                      className={`px-2 py-1 text-[10px] bg-[#F0EFEC] hover:bg-[#C5A059]/15 border border-[#DEDCD7] rounded-sm font-semibold transition-all ${
                        type === 'speaking' ? 'border-[#C5A059] bg-[#C5A059]/5' : ''
                      }`}
                    >
                      Speaking Part 2 Cue Card
                    </button>
                  </div>
                </div>
              </div>

              {/* Input Area (Topic Prompt & Essay text or voice) */}
              <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm flex-1 flex flex-col justify-between min-h-[400px]">
                <div className="flex flex-col gap-4 flex-1">
                  
                  {/* Topic / Question Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84] mb-1">
                      IELTS Prompt / Topic Question <span className="text-[#8C8A84]/60">(Optional)</span>
                    </label>
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="Paste the official exam question here to audit for Task Achievement accuracy..."
                      className="w-full bg-[#F9F8F6] border border-[#DEDCD7] p-3 text-xs focus:outline-none focus:border-[#C5A059] rounded-sm min-h-[60px] resize-none"
                    />
                  </div>

                  {/* Submission Text or Voice Recording UI */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] uppercase tracking-wider text-[#8C8A84]">
                        {type === 'writing' ? 'Write or Paste Essay Content' : 'Speak or Paste Speaking Transcript'}
                      </label>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-[#8C8A84]">
                        <span>Words: {wordCount}</span>
                        {type === 'writing' && <span>(Recommended: {taskType === 'task1' ? '150+' : '250+'})</span>}
                      </div>
                    </div>

                    {type === 'writing' ? (
                      <div className="relative flex-1 flex flex-col min-h-[220px]">
                        <textarea
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          placeholder="Write or paste your IELTS essay response here..."
                          className="w-full flex-1 bg-[#F9F8F6] border border-[#DEDCD7] p-4 text-xs font-sans leading-relaxed focus:outline-none focus:border-[#C5A059] rounded-sm resize-none"
                        />
                        
                        {/* Drag and Drop File Overlay Area */}
                        <div className="mt-3 p-3 border border-dashed border-[#DEDCD7] bg-[#F9F8F6]/50 hover:bg-[#F0EFEC] text-center rounded-sm transition-all cursor-pointer relative group">
                          <input 
                            type="file" 
                            accept=".txt,.doc,.docx"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center justify-center gap-2 text-xs text-[#555]">
                            <Upload className="w-4 h-4 text-[#C5A059]" />
                            <span>Drag and drop a <b>.txt</b> essay file, or <b>browse</b></span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Speaking Modality Input & Voice Recorder
                      <div className="flex-1 flex flex-col gap-3 min-h-[220px]">
                        <textarea
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                          placeholder="Transcribe your speech here, or use our real-time recorder below..."
                          className="w-full flex-1 bg-[#F9F8F6] border border-[#DEDCD7] p-4 text-xs font-sans leading-relaxed focus:outline-none focus:border-[#C5A059] rounded-sm resize-none"
                        />
                        
                        {/* Interactive Voice Recorder */}
                        <div className="p-4 border border-[#DEDCD7] bg-[#F0EFEC]/40 rounded-sm flex items-center justify-between gap-4">
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
                              <p className="text-xs font-bold text-black">{isRecording ? 'Recording active...' : 'In-App Voice Practice'}</p>
                              <p className="text-[10px] text-[#8C8A84]">
                                {isRecording ? 'Transcribing speech live...' : 'Click to speak and auto-transcribe'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Timer and visual feedback */}
                          <div className="text-right">
                            <span className="font-mono text-sm font-bold bg-[#EBE9E4] px-3 py-1.5 rounded-sm shadow-inner text-black">
                              {formatTime(recordingSeconds)}
                            </span>
                            <p className="text-[9px] text-[#8C8A84] uppercase tracking-wider mt-1">Suggested: 2:00 mins</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Errors display */}
                {errorMsg && (
                  <div className="my-4 p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-sm flex items-start gap-2">
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
                      ? 'bg-white/50 text-[#8C8A84] border-[#DEDCD7] cursor-wait' 
                      : 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white border-[#1A1A1A]'
                  }`}
                >
                  {isEvaluating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></span>
                      Auditing IELTS Submission Matrix...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      Run Diagnostic Evaluation
                    </>
                  )}
                </button>
              </div>

              {/* Candidate Info Card */}
              <div className="bg-white border border-[#DEDCD7] p-5 rounded-sm shadow-sm">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-3">Candidate Dossier</h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-[#8C8A84] uppercase block tracking-wider">Candidate</span>
                    <b className="text-[#1A1A1A] block truncate">{CANDIDATE_NAME}</b>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8A84] uppercase block tracking-wider">Target score</span>
                    <b className="text-[#1A1A1A] block">{CANDIDATE_TARGET} Overall</b>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8C8A84] uppercase block tracking-wider">Examiner mode</span>
                    <b className="text-[#C5A059] block flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Certified
                    </b>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT ANALYTICS & RESULTS LAYER */}
            <section className="col-span-12 lg:col-span-7 flex flex-col gap-6">
              
              {!currentResult && !isEvaluating && (
                <div className="bg-white border border-[#DEDCD7] p-12 rounded-sm text-center flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-white to-[#F9F8F6]">
                  <Layers className="w-16 h-16 text-[#C5A059] mb-4 opacity-70 stroke-[1.2]" />
                  <h3 className="text-2xl font-serif italic mb-2">No Audited Data Generated</h3>
                  <p className="text-[#8C8A84] text-xs max-w-md mx-auto leading-relaxed mb-6">
                    Enter your writing essay or speaking transcript, or load one of our official test presets on the left, and trigger the Diagnostic Auditor to compile detailed performance stats.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-lg">
                    <div className="p-3 bg-white border border-[#DEDCD7] rounded-sm text-center">
                      <b className="text-[#C5A059] block font-serif italic text-lg">9.0</b>
                      <span className="text-[9px] text-[#8C8A84] uppercase tracking-wider block">Strict Grading</span>
                    </div>
                    <div className="p-3 bg-white border border-[#DEDCD7] rounded-sm text-center">
                      <TrendingUp className="w-5 h-5 text-[#C5A059] mx-auto mb-1 stroke-[1.5]" />
                      <span className="text-[9px] text-[#8C8A84] uppercase tracking-wider block">Band Profiler</span>
                    </div>
                    <div className="p-3 bg-white border border-[#DEDCD7] rounded-sm text-center">
                      <FileCode className="w-5 h-5 text-[#C5A059] mx-auto mb-1 stroke-[1.5]" />
                      <span className="text-[9px] text-[#8C8A84] uppercase tracking-wider block">JSON matrix</span>
                    </div>
                    <div className="p-3 bg-white border border-[#DEDCD7] rounded-sm text-center">
                      <Languages className="w-5 h-5 text-[#C5A059] mx-auto mb-1 stroke-[1.5]" />
                      <span className="text-[9px] text-[#8C8A84] uppercase tracking-wider block">Expert Advice</span>
                    </div>
                  </div>
                </div>
              )}

              {isEvaluating && (
                <div className="bg-white border border-[#DEDCD7] p-12 rounded-sm text-center flex flex-col items-center justify-center min-h-[600px]">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 border-4 border-[#C5A059]/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-[#C5A059] rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-2xl font-serif italic mb-2">Auditing Submission Matrix</h3>
                  <p className="text-[#8C8A84] text-xs max-w-sm mx-auto leading-relaxed mb-4">
                    Programmatically parsing spelling patterns, lexical cohesion, grammatical complexity and task relevance against certified IELTS rubrics...
                  </p>
                  <div className="text-[10px] font-mono text-[#8C8A84] bg-[#F0EFEC] px-3 py-1.5 rounded-sm">
                    GEMINI-3.5-FLASH // SCORING_MODEL_ACTIVE
                  </div>
                </div>
              )}

              {currentResult && !isEvaluating && (
                <div className="flex flex-col gap-6 animate-fade-in">
                  
                  {/* Results Overview: Overall score & metadata */}
                  <div className="bg-white border border-[#DEDCD7] p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[#C5A059] flex flex-col items-center justify-center bg-white shadow-md shrink-0">
                        <span className="text-4xl md:text-5xl font-serif font-bold italic tracking-tighter text-black">
                          {currentResult.overallBand.toFixed(1)}
                        </span>
                        <span className="text-[8px] font-mono text-[#C5A059] uppercase font-bold tracking-widest mt-0.5">BAND SCORE</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-[#8C8A84] bg-[#F0EFEC] px-2 py-0.5 font-bold font-mono">
                          ID: {currentResult.id}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-serif tracking-tight mt-1">Overall Band Evaluation</h2>
                        <p className="text-[#8C8A84] text-xs mt-0.5">
                          {getBandDescriptor(currentResult.overallBand)} • {currentResult.timestamp}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 self-end md:self-auto">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2 border border-[#DEDCD7] hover:border-[#C5A059] text-[#1A1A1A] hover:bg-white text-xs font-semibold flex items-center gap-2 rounded-sm transition-all"
                        title="Copy machine JSON data"
                      >
                        {isCopied ? <ClipboardCheck className="w-4 h-4 text-[#C5A059]" /> : <Clipboard className="w-4 h-4" />}
                        <span className="hidden md:inline">JSON</span>
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="p-2 border border-[#DEDCD7] hover:border-[#C5A059] text-[#1A1A1A] hover:bg-white text-xs font-semibold flex items-center gap-2 rounded-sm transition-all"
                        title="Print official report"
                      >
                        <Printer className="w-4 h-4" />
                        <span className="hidden md:inline">Print Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Core Metrics Bento Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* TA */}
                    <div className="bg-white border border-[#DEDCD7] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold text-[#8C8A84] tracking-widest block">
                            {currentResult.type === 'writing' ? 'Task Achievement' : 'Task Response'}
                          </span>
                          <span className="text-xl font-mono font-bold text-black bg-[#F0EFEC] px-2 py-0.5 rounded-sm">
                            {currentResult.bandScores.taskAchievement.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#F0EFEC] mb-3">
                          <div 
                            className="h-full bg-[#C5A059] transition-all duration-1000"
                            style={{ width: `${(currentResult.bandScores.taskAchievement / 9) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#555] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.taskAchievement}
                        </p>
                      </div>
                    </div>

                    {/* CC */}
                    <div className="bg-white border border-[#DEDCD7] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold text-[#8C8A84] tracking-widest block">Coherence & Cohesion</span>
                          <span className="text-xl font-mono font-bold text-black bg-[#F0EFEC] px-2 py-0.5 rounded-sm">
                            {currentResult.bandScores.coherenceCohesion.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#F0EFEC] mb-3">
                          <div 
                            className="h-full bg-[#C5A059] transition-all duration-1000"
                            style={{ width: `${(currentResult.bandScores.coherenceCohesion / 9) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#555] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.coherenceCohesion}
                        </p>
                      </div>
                    </div>

                    {/* LR */}
                    <div className="bg-white border border-[#DEDCD7] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold text-[#8C8A84] tracking-widest block">Lexical Resource</span>
                          <span className="text-xl font-mono font-bold text-black bg-[#F0EFEC] px-2 py-0.5 rounded-sm">
                            {currentResult.bandScores.lexicalResource.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#F0EFEC] mb-3">
                          <div 
                            className="h-full bg-[#C5A059] transition-all duration-1000"
                            style={{ width: `${(currentResult.bandScores.lexicalResource / 9) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#555] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.lexicalResource}
                        </p>
                      </div>
                    </div>

                    {/* GRA */}
                    <div className="bg-white border border-[#DEDCD7] p-5 rounded-sm shadow-sm flex flex-col justify-between hover:border-[#C5A059] transition-colors group">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-bold text-[#8C8A84] tracking-widest block font-sans">Grammatical Range</span>
                          <span className="text-xl font-mono font-bold text-black bg-[#F0EFEC] px-2 py-0.5 rounded-sm">
                            {currentResult.bandScores.grammaticalRange.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#F0EFEC] mb-3">
                          <div 
                            className="h-full bg-[#C5A059] transition-all duration-1000"
                            style={{ width: `${(currentResult.bandScores.grammaticalRange / 9) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#555] leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                          {currentResult.metricsFeedback.grammaticalRange}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Submission Highlight Display & Corrections Panel (Side-by-Side on Desktop) */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    
                    {/* Left: Annotated Text Viewer */}
                    <div className="xl:col-span-7 bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm flex flex-col">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-4 border-b border-[#F0EFEC] pb-2">
                        Annotated Text Inspector
                      </h3>
                      <div className="bg-[#F9F8F6] p-4 rounded-sm border border-[#EBE9E4] flex-1 max-h-[450px] overflow-y-auto">
                        {renderHighlightedText()}
                      </div>
                      <div className="flex gap-4 mt-3 text-[10px] text-[#8C8A84]">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-100 border border-red-300 inline-block rounded-full"></span> High Severity</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-100 border border-amber-300 inline-block rounded-full"></span> Medium Correction</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-yellow-50 border border-yellow-200 inline-block rounded-full"></span> Minor/Suggestion</span>
                      </div>
                    </div>

                    {/* Right: Correction Matrix */}
                    <div className="xl:col-span-5 bg-[#1A1A1A] p-6 rounded-sm shadow-lg text-white flex flex-col justify-between max-h-[550px]">
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                          <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059]">Correction Matrix</h3>
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
                              No grammatical or spelling corrections required. Outstanding structural precision!
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 text-right">
                        <span className="text-[9px] font-mono text-white/30 uppercase">EXPORT MATRIX AS COMPLIANT JSON</span>
                      </div>
                    </div>

                  </div>

                  {/* Strengths, Weaknesses, and Actionable Steps (Bento Style Grid) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Strengths */}
                    <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-green-700 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Prominent Strengths
                      </h3>
                      <ul className="space-y-3">
                        {currentResult.strengths?.map((str, index) => (
                          <li key={index} className="text-xs text-[#444] leading-relaxed flex items-start gap-2.5">
                            <span className="font-mono text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-sm mt-0.5">+{index+1}</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-700 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Primary Impediments
                      </h3>
                      <ul className="space-y-3">
                        {currentResult.weaknesses?.map((weak, index) => (
                          <li key={index} className="text-xs text-[#444] leading-relaxed flex items-start gap-2.5">
                            <span className="font-mono text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-sm mt-0.5">-{index+1}</span>
                            <span>{weak}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actionable Steps */}
                    <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                      <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C5A059] mb-4 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-[#C5A059]" /> Remedial Action Plan
                      </h3>
                      <ol className="space-y-3">
                        {currentResult.actionableAdvice?.map((advice, index) => (
                          <li key={index} className="text-xs text-[#444] leading-relaxed flex items-start gap-2.5">
                            <span className="font-mono text-[10px] bg-[#F0EFEC] text-black font-bold px-1.5 py-0.5 rounded-sm mt-0.5">{index+1}</span>
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
            <div className="bg-white border border-[#DEDCD7] p-8 rounded-sm shadow-sm">
              <h2 className="text-2xl font-serif italic mb-2">Audit Dossier Portfolio</h2>
              <p className="text-[#8C8A84] text-xs">
                History of your diagnostic evaluations. All records are saved securely inside your browser's local cache.
              </p>
            </div>

            {historyList.length === 0 ? (
              <div className="bg-white border border-[#DEDCD7] p-16 text-center rounded-sm">
                <Layers className="w-12 h-12 text-[#C5A059]/40 mx-auto mb-4" />
                <h3 className="text-lg font-serif italic mb-1">Your Portfolio is Empty</h3>
                <p className="text-[#8C8A84] text-xs mb-6">
                  You haven't run any diagnostic checks yet. Complete your first practice response audit to begin tracking your band scores.
                </p>
                <button 
                  onClick={() => setActiveTab('evaluate')}
                  className="px-6 py-3 bg-[#1A1A1A] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#2A2A2A]"
                >
                  Create First Evaluation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyList.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => {
                      setCurrentResult(item);
                      setActiveTab('evaluate');
                    }}
                    className="bg-white border border-[#DEDCD7] hover:border-[#C5A059] p-6 rounded-sm shadow-sm transition-all cursor-pointer flex flex-col justify-between min-h-[240px]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-[#F0EFEC] pb-2">
                        <span className="text-[10px] font-mono text-[#8C8A84] uppercase tracking-wider">{item.timestamp}</span>
                        <span className="text-[10px] font-mono bg-[#F0EFEC] px-2 py-0.5 rounded-sm uppercase tracking-wider text-black font-bold">
                          {item.type} ({item.taskType})
                        </span>
                      </div>
                      <h4 className="font-serif italic text-lg leading-snug line-clamp-2 mb-2">&ldquo;{item.promptText}&rdquo;</h4>
                      <p className="text-xs text-[#555] line-clamp-3 mb-4 italic">&ldquo;{item.submissionText}&rdquo;</p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F0EFEC]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs uppercase tracking-wider text-[#8C8A84] font-bold">Score:</span>
                        <span className="font-serif font-bold text-[#C5A059] text-xl italic">{item.overallBand.toFixed(1)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => deleteFromHistory(item.id, e)}
                          className="px-2.5 py-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-sm border border-red-200"
                        >
                          Delete
                        </button>
                        <span className="px-2.5 py-1 text-[10px] uppercase font-bold bg-[#1A1A1A] text-white rounded-sm">View</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IELTS RUBRICS TAB */}
        {activeTab === 'rubric' && (
          <div className="col-span-12 flex flex-col gap-8">
            <div className="bg-white border border-[#DEDCD7] p-8 rounded-sm shadow-sm">
              <h2 className="text-2xl font-serif italic mb-2">Official IELTS Scoring Rubrics Reference</h2>
              <p className="text-[#8C8A84] text-xs">
                Detailed public descriptors of IELTS bands for task achievement, coherence, vocabulary, and grammar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Task Achievement */}
              <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] pb-2 mb-4 text-[#C5A059] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059]" /> Task Achievement (Task 1) / Response (Task 2)
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555]">
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 9.0</h4>
                    <p>Fully addresses all the requirements of the task. Presents a fully developed response to the question with detailed, fully substantiated ideas.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 8.0</h4>
                    <p>Sufficiently addresses all requirements. Presents a well-developed response to the question with relevant, extended and supported ideas.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 7.0</h4>
                    <p>Addresses all parts of the task. Presents a clear position throughout. Presents, extends and supports key ideas, but there may be a tendency to over-generalise.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 6.0</h4>
                    <p>Addresses all parts of the task, though some parts may be more fully covered than others. Presents a relevant position, though conclusions may be unclear or repetitive.</p>
                  </div>
                </div>
              </div>

              {/* Coherence & Cohesion */}
              <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] pb-2 mb-4 text-[#C5A059] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059]" /> Coherence and Cohesion
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555]">
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 9.0</h4>
                    <p>Uses cohesion in such a way that it attracts no attention. Skilfully manages paragraphing throughout the response.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 8.0</h4>
                    <p>Sequences information and ideas logically. Manages all aspects of cohesion well. Uses paragraphing sufficiently and appropriately.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 7.0</h4>
                    <p>Logically organises information and ideas; there is clear progression throughout. Uses a range of cohesive devices appropriately, though there may be some under-/over-use.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 6.0</h4>
                    <p>Coherently organises information and ideas; there is clear overall progression. Uses cohesive devices effectively, but cohesion within/between sentences may be faulty.</p>
                  </div>
                </div>
              </div>

              {/* Lexical Resource */}
              <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] pb-2 mb-4 text-[#C5A059] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059]" /> Lexical Resource (Vocabulary)
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555]">
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 9.0</h4>
                    <p>Uses a wide range of vocabulary with very natural and sophisticated control of lexical features; rare minor errors occur only as 'slips'.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 8.0</h4>
                    <p>Uses a wide range of vocabulary fluently and flexibly to convey precise meanings. Skilfully uses uncommon lexical items with rare inaccuracies in collocation/spelling.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 7.0</h4>
                    <p>Uses a sufficient range of vocabulary to allow some flexibility and precision. Uses less common lexical items with some awareness of style and collocation.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 6.0</h4>
                    <p>Uses an adequate range of vocabulary for the task. Attempts to use less common vocabulary but with some inaccuracy. Makes some spelling/word-formation errors.</p>
                  </div>
                </div>
              </div>

              {/* Grammatical Range */}
              <div className="bg-white border border-[#DEDCD7] p-6 rounded-sm shadow-sm">
                <h3 className="text-md font-serif italic border-b border-[#F0EFEC] pb-2 mb-4 text-[#C5A059] font-bold flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#C5A059]" /> Grammatical Range and Accuracy
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-[#555]">
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 9.0</h4>
                    <p>Uses a wide range of structures with full flexibility and accuracy; rare minor errors occur only as 'slips'.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 8.0</h4>
                    <p>Uses a wide range of structures. The majority of sentences are error-free. Makes only very occasional grammar or punctuation errors.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 7.0</h4>
                    <p>Uses a variety of complex structures. Produces frequent error-free sentences. Has good control of grammar and punctuation but may make a few errors.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-black font-mono">BAND 6.0</h4>
                    <p>Uses a mix of simple and complex structures. Makes some errors in grammar and punctuation but they rarely reduce communication overall.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Platform Footer */}
      <footer className="h-16 border-t border-[#DEDCD7] bg-white flex flex-col md:flex-row items-center px-6 md:px-12 justify-between gap-2 py-3">
        <p className="text-[9px] uppercase tracking-widest text-[#8C8A84] text-center md:text-left">
          © {new Date().getFullYear()} Global IELTS Analytics Engine. Certified scoring matrix algorithm v2.4.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] uppercase tracking-widest text-[#1A1A1A] font-bold font-mono">System: Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
