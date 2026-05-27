"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function AuraClarityGlobal() {
  const [scriptText, setScriptText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        setScriptText(event.results[0][0].transcript);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setScriptText(""); 
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAnalyzeAndSpeak = async () => {
    if (!scriptText) return alert("Please speak or type something first!");
    setLoading(true);
    setResult(null);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/analyze`;

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scriptText }),
      });

      if (!response.ok) throw new Error("Backend Error");

      const data = await response.json();
      setResult(data);

      const utterance = new SpeechSynthesisUtterance(scriptText);
      const voice = voices.find((v) => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      alert("Check if Port 8000 is Public and the terminal is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#000', fontSize: '40px', fontWeight: 'bold' }}>Aura Clarity Global</h1>
        <p style={{ color: '#333', fontSize: '20px' }}>Voice Evaluation & Dialect Analysis</p>
      </header>
      
      <div style={{ marginBottom: '30px', padding: '20px', border: '3px solid #000', borderRadius: '15px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '22px', display: 'block', marginBottom: '10px' }}>SELECT YOUR TRIBE:</label>
        <select 
          value={selectedVoiceName} 
          onChange={(e) => setSelectedVoiceName(e.target.value)}
          style={{ width: '100%', padding: '15px', borderRadius: '10px', fontSize: '18px', border: '2px solid #000' }}
        >
          <optgroup label="Niger Delta & Edo">
            <option value="delta-urhobo">Urhobo</option>
            <option value="delta-isoko">Isoko</option>
            <option value="delta-itsekiri">Itsekiri</option>
            <option value="nigeria-pidgin">Waffi (Pidgin)</option>
          </optgroup>
          <optgroup label="Major Nigerian Languages">
            <option value="yoruba">Yoruba</option>
            <option value="igbo">Igbo</option>
            <option value="hausa">Hausa</option>
          </optgroup>
          <optgroup label="System Voices">
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
          </optgroup>
        </select>
      </div>

      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <textarea 
          style={{ width: '100%', height: '250px', padding: '25px', borderRadius: '20px', fontSize: '24px', fontWeight: 'bold', border: '4px solid #000', boxSizing: 'border-box' }}
          placeholder="Speak or Type here..."
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
        />
        <button onClick={toggleListening} style={{ position: 'absolute', bottom: '20px', right: '20px', backgroundColor: isListening ? '#f00' : '#0070f3', color: '#fff', border: '3px solid #000', borderRadius: '50%', width: '80px', height: '80px', fontSize: '35px' }}>
          {isListening ? "🛑" : "🎤"}
        </button>
      </div>

      <button onClick={handleAnalyzeAndSpeak} disabled={loading} style={{ padding: '25px', backgroundColor: '#000', color: '#fff', borderRadius: '15px', width: '100%', fontSize: '24px', fontWeight: '900' }}>
        {loading ? "PROCESSING..." : "ANALYZE & PLAYBACK"}
      </button>

      {result && (
        <div style={{ marginTop: '40px', padding: '30px', borderRadius: '20px', backgroundColor: '#e6f7ff', border: '4px solid #0070f3' }}>
          <h2 style={{ marginTop: 0, fontSize: '30px' }}>Aura Score: {result.score}</h2>
          <p style={{ fontSize: '22px' }}>{result.analysis}</p>
        </div>
      )}
    </div>
  );
}