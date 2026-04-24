"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, Lock, ShieldAlert, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'npc' | 'player';
  text: string;
  timestamp: number;
}

interface Choice {
  id: string;
  text: string;
  action?: () => void;
  nextMessageId?: string; // To trigger NPC response
}

interface Contact {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isUnlocked: boolean;
  unlockHint: string;
  color: string;
}

interface ConnectionsTabProps {
  balance: number;
  savingsBalance: number;
  loanAccountBalance: number;
  fico: number;
  playerPath: string | null;
  corporateLevel: number;
  criminalLevel: number;
  startupData: any;
  handlePathSelect: (path: string) => void;
  showAlert: (title: string, msg: string) => void;
}

export default function ConnectionsTab({
  balance,
  savingsBalance,
  loanAccountBalance,
  fico,
  playerPath,
  corporateLevel,
  criminalLevel,
  startupData,
  handlePathSelect,
  showAlert
}: ConnectionsTabProps) {
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [chats, setChats] = useState<Record<string, Message[]>>({});
  const [pendingChoices, setPendingChoices] = useState<Record<string, Choice[]>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedIntros = useRef<Record<string, boolean>>({});

  // Define contact unlock conditions based on game state
  const isEvelynUnlocked = balance >= 5000 && fico >= 600 && (!playerPath || playerPath === 'hustler' || playerPath === 'corporate');
  const isCipherUnlocked = balance >= 5000 && fico >= 600 && (!playerPath || playerPath === 'hustler' || playerPath === 'ghost');
  const isMarcusUnlocked = playerPath === 'corporate' && corporateLevel >= 4 && balance >= 50000;
  // TODO: Add criminal mechanics later
  const isArchitectUnlocked = playerPath === 'ghost' && balance >= 500000; 

  const contacts: Contact[] = [
    {
      id: 'jax',
      name: 'Jax (The Fixer)',
      role: 'Street Intel',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jax&backgroundColor=b6e3f4',
      isUnlocked: true,
      unlockHint: 'Always available',
      color: 'blue'
    },
    {
      id: 'evelyn',
      name: 'Evelyn Reed',
      role: 'HR Director @ Vanguard',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn&backgroundColor=c0aede',
      isUnlocked: isEvelynUnlocked,
      unlockHint: 'Requires $5,000 + 600 FICO',
      color: 'indigo'
    },
    {
      id: 'cipher',
      name: 'Cipher',
      role: '??? (Encrypted)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Cipher&backgroundColor=ffdfbf',
      isUnlocked: isCipherUnlocked,
      unlockHint: 'Requires $5,000 + 600 FICO',
      color: 'red'
    },
    {
      id: 'marcus',
      name: 'Marcus Vance',
      role: 'Venture Capitalist',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus&backgroundColor=d1d4f9',
      isUnlocked: isMarcusUnlocked,
      unlockHint: 'Requires Corporate Lv.4 + $50K',
      color: 'emerald'
    }
  ];

  // Initialize chats on first load if empty
  useEffect(() => {
    const saved = localStorage.getItem('pulse_secure_comm');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChats(parsed.chats || {});
        setPendingChoices(parsed.choices || {});
        return;
      } catch (e) {}
    }

    // Default starting state
    const initialChats: Record<string, Message[]> = {
      jax: [
        { id: 'j1', sender: 'npc', text: 'Hey kid. Heard you just hit the streets. Need to make some quick cash?', timestamp: Date.now() - 60000 }
      ]
    };
    
    const initialChoices: Record<string, Choice[]> = {
      jax: [
        { id: 'j_c1', text: 'Yeah, what do you have?', action: () => handleJaxResponse('interested') },
        { id: 'j_c2', text: 'I work alone.', action: () => handleJaxResponse('alone') }
      ]
    };

    setChats(initialChats);
    setPendingChoices(initialChoices);
  }, []);

  // Save to local storage whenever chats change
  useEffect(() => {
    if (Object.keys(chats).length > 0) {
      localStorage.setItem('pulse_secure_comm', JSON.stringify({ chats, choices: pendingChoices }));
    }
  }, [chats, pendingChoices]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeContact]);

  // Specific dialogue handlers
  const handleJaxResponse = (choice: string) => {
    addPlayerMessage('jax', choice === 'interested' ? 'Yeah, what do you have?' : 'I work alone.');
    setPendingChoices(prev => ({ ...prev, jax: [] }));
    
    setTimeout(() => {
      if (choice === 'interested') {
        addNPCMessage('jax', 'Good. Check the Job Board on your Overview tab. Stick to the basic deliveries until you build some rep.');
      } else {
        addNPCMessage('jax', 'Suit yourself. But you won\'t survive long out here without friends. The offer stands if you change your mind.');
      }
    }, 1500);
  };

  // Check for newly unlocked contacts and send intro messages
  useEffect(() => {
    if (isEvelynUnlocked && !chats.evelyn && !initializedIntros.current.evelyn) {
      initializedIntros.current.evelyn = true;
      setTimeout(() => {
        addNPCMessage('evelyn', 'Agent. I\'ve been reviewing your financial profile. Vanguard is looking for reliable assets. We offer stability, benefits, and a clear ladder. Interested?');
        setPendingChoices(prev => ({
          ...prev,
          evelyn: [
            { id: 'e_c1', text: 'Tell me more about Vanguard.', action: () => handleEvelynResponse('more') },
            { id: 'e_c2', text: 'I\'ll pass.', action: () => handleEvelynResponse('pass') }
          ]
        }));
      }, 2000);
    }

    if (isCipherUnlocked && !chats.cipher && !initializedIntros.current.cipher) {
      initializedIntros.current.cipher = true;
      setTimeout(() => {
        addNPCMessage('cipher', '...connection established... \n You\'re making noise. Good. The system is rigged, you know that. I can show you how to break it. You want real money?');
        setPendingChoices(prev => ({
          ...prev,
          cipher: [
            { id: 'c_c1', text: 'Who is this?', action: () => handleCipherResponse('who') },
            { id: 'c_c2', text: 'I\'m listening.', action: () => handleCipherResponse('listen') }
          ]
        }));
      }, 3000);
    }

    if (isMarcusUnlocked && !chats.marcus && !initializedIntros.current.marcus) {
      initializedIntros.current.marcus = true;
      setTimeout(() => {
        addNPCMessage('marcus', 'Word on the street is you\'ve gathered some serious capital. I\'m looking for ambitious founders to build something real. You interested in starting a tech company?');
        setPendingChoices(prev => ({
          ...prev,
          marcus: [
            { id: 'm_c1', text: 'Yes, let\'s talk business.', action: () => handleMarcusResponse('yes') },
            { id: 'm_c2', text: 'I\'m good where I am.', action: () => handleMarcusResponse('no') }
          ]
        }));
      }, 3000);
    }
  }, [isEvelynUnlocked, isCipherUnlocked, isMarcusUnlocked, chats]);

  // Level Up Congratulations
  useEffect(() => {
    if (playerPath === 'corporate' && corporateLevel > 1 && !initializedIntros.current[`corp_${corporateLevel}`]) {
      initializedIntros.current[`corp_${corporateLevel}`] = true;
      setTimeout(() => {
        addNPCMessage('evelyn', `Congratulations on your promotion to Level ${corporateLevel}. Your new clearance gives you access to higher-paying assignments. Keep it up.`);
      }, 1500);
    }
  }, [corporateLevel, playerPath]);

  useEffect(() => {
    if (playerPath === 'ghost' && criminalLevel > 1 && !initializedIntros.current[`ghost_${criminalLevel}`]) {
      initializedIntros.current[`ghost_${criminalLevel}`] = true;
      setTimeout(() => {
        addNPCMessage('cipher', `Rank ${criminalLevel} achieved. The network is taking notice. Don't let the heat burn you.`);
      }, 1500);
    }
  }, [criminalLevel, playerPath]);

  useEffect(() => {
    const sLevel = startupData?.level || 1;
    if (playerPath === 'founder' && sLevel > 1 && !initializedIntros.current[`founder_${sLevel}`]) {
      initializedIntros.current[`founder_${sLevel}`] = true;
      setTimeout(() => {
        addNPCMessage('marcus', `Expansion successful. A Level ${sLevel} operation is no joke. Keep scaling and maximizing your multipliers.`);
      }, 1500);
    }
  }, [startupData?.level, playerPath]);

  const handleEvelynResponse = (choice: string) => {
    addPlayerMessage('evelyn', choice === 'more' ? 'Tell me more about Vanguard.' : 'I\'ll pass.');
    setPendingChoices(prev => ({ ...prev, evelyn: [] }));
    
    setTimeout(() => {
      if (choice === 'more') {
        addNPCMessage('evelyn', 'We are a premier corporate entity. Sign with us, and you\'ll receive a steady salary. Prove yourself, and you\'ll climb to the executive suite. Ready to sign the contract?');
        setPendingChoices(prev => ({
          ...prev,
          evelyn: [
            { id: 'e_c3', text: 'Accept Corporate Path', action: () => {
                if (playerPath && playerPath !== 'hustler') {
                    addPlayerMessage('evelyn', 'Accept Corporate Path');
                    setPendingChoices(prev => ({ ...prev, evelyn: [] }));
                    setTimeout(() => addNPCMessage('evelyn', 'You are already committed elsewhere. We cannot hire you.'), 1000);
                } else {
                    handlePathSelect('corporate');
                    addPlayerMessage('evelyn', 'I accept the offer.');
                    setPendingChoices(prev => ({ ...prev, evelyn: [] }));
                    setTimeout(() => addNPCMessage('evelyn', 'Welcome to Vanguard. Check your Overview tab for your first assignment.'), 1500);
                }
            }},
            { id: 'e_c4', text: 'Let me think about it.', action: () => {
                addPlayerMessage('evelyn', 'Let me think about it.');
                setPendingChoices(prev => ({ ...prev, evelyn: [] }));
                setTimeout(() => addNPCMessage('evelyn', 'Don\'t take too long. Opportunities like this vanish quickly.'), 1000);
            }}
          ]
        }));
      } else {
        addNPCMessage('evelyn', 'A pity. Your loss.');
      }
    }, 1500);
  };

  const handleCipherResponse = (choice: string) => {
    addPlayerMessage('cipher', choice === 'who' ? 'Who is this?' : 'I\'m listening.');
    setPendingChoices(prev => ({ ...prev, cipher: [] }));
    
    setTimeout(() => {
      addNPCMessage('cipher', 'Names don\'t matter. What matters is the Ghost protocol. High risk, off-the-books work. The payouts are massive, but the heat is real. You ready to disappear?');
      setPendingChoices(prev => ({
        ...prev,
        cipher: [
          { id: 'c_c3', text: 'Accept Ghost Path', action: () => {
              if (playerPath && playerPath !== 'hustler') {
                  addPlayerMessage('cipher', 'Accept Ghost Path');
                  setPendingChoices(prev => ({ ...prev, cipher: [] }));
                  setTimeout(() => addNPCMessage('cipher', 'Too late. You\'re already in the system. Lose my number.'), 1000);
              } else {
                  handlePathSelect('ghost');
                  addPlayerMessage('cipher', 'I\'m in.');
                  setPendingChoices(prev => ({ ...prev, cipher: [] }));
                  setTimeout(() => addNPCMessage('cipher', 'Encryption locked. Check the Job Board. And watch your back.'), 1500);
              }
          }},
          { id: 'c_c4', text: 'Too risky for me.', action: () => {
              addPlayerMessage('cipher', 'Too risky for me.');
              setPendingChoices(prev => ({ ...prev, cipher: [] }));
              setTimeout(() => addNPCMessage('cipher', 'Coward. Stay broke.'), 1000);
          }}
        ]
      }));
    }, 2000);
  };

  const handleMarcusResponse = (choice: string) => {
    addPlayerMessage('marcus', choice === 'yes' ? 'Yes, let\'s talk business.' : 'I\'m good where I am.');
    setPendingChoices(prev => ({ ...prev, marcus: [] }));
    
    setTimeout(() => {
      if (choice === 'yes') {
        addNPCMessage('marcus', 'Excellent. The startup world is brutal but the upside is infinite. I can seed you with the initial infrastructure, but you need to front $50,000 for the operational license. Ready?');
        setPendingChoices(prev => ({
          ...prev,
          marcus: [
            { id: 'm_c3', text: 'Accept Founder Path ($50k)', action: () => {
                if (playerPath && playerPath !== 'corporate') {
                    addPlayerMessage('marcus', 'Accept Founder Path');
                    setPendingChoices(prev => ({ ...prev, marcus: [] }));
                    setTimeout(() => addNPCMessage('marcus', 'You\'re not corporate material. I can\'t work with you.'), 1000);
                } else if (balance < 50000 && savingsBalance < 50000 && loanAccountBalance < 50000) {
                    addPlayerMessage('marcus', 'Accept Founder Path');
                    setPendingChoices(prev => ({ ...prev, marcus: [] }));
                    setTimeout(() => addNPCMessage('marcus', 'You don\'t have the $50k required. Come back when your funds are up.'), 1000);
                } else {
                    handlePathSelect('founder');
                    addPlayerMessage('marcus', 'I accept. Let\'s build.');
                    setPendingChoices(prev => ({ ...prev, marcus: [] }));
                    setTimeout(() => addNPCMessage('marcus', 'Welcome to the big leagues. Check your Overview tab.'), 1500);
                }
            }},
            { id: 'm_c4', text: 'Let me think about it.', action: () => {
                addPlayerMessage('marcus', 'Let me think about it.');
                setPendingChoices(prev => ({ ...prev, marcus: [] }));
                setTimeout(() => addNPCMessage('marcus', 'Take your time. But the market waits for no one.'), 1000);
            }}
          ]
        }));
      } else {
        addNPCMessage('marcus', 'Your loss. Enjoy the rat race.');
      }
    }, 1500);
  };


  const addPlayerMessage = (contactId: string, text: string) => {
    const newMsg: Message = { id: Math.random().toString(), sender: 'player', text, timestamp: Date.now() };
    setChats(prev => ({ ...prev, [contactId]: [...(prev[contactId] || []), newMsg] }));
  };

  const addNPCMessage = (contactId: string, text: string) => {
    const newMsg: Message = { id: Math.random().toString(), sender: 'npc', text, timestamp: Date.now() };
    setChats(prev => ({ ...prev, [contactId]: [...(prev[contactId] || []), newMsg] }));
  };

  const currentChat = activeContact ? chats[activeContact] || [] : [];
  const currentChoices = activeContact ? pendingChoices[activeContact] || [] : [];
  const activeContactDetails = contacts.find(c => c.id === activeContact);

  return (
    <div className="flex flex-col md:flex-row h-[75vh] md:h-[600px] bg-[#0A0A0C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
      
      {/* ── SIDEBAR: CONTACT LIST ── */}
      <div className={`w-full md:w-1/3 flex flex-col border-r border-white/5 bg-[#121214]/50 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-white/5 bg-black/20">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            SecureComm<span className="text-emerald-400">_</span>
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">End-to-End Encrypted</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {contacts.map(contact => {
            const hasUnread = pendingChoices[contact.id]?.length > 0;
            const lastMsg = chats[contact.id]?.[chats[contact.id].length - 1];
            
            return (
              <button
                key={contact.id}
                disabled={!contact.isUnlocked}
                onClick={() => setActiveContact(contact.id)}
                className={`w-full text-left p-3 rounded-2xl flex items-center gap-4 transition-all duration-200 ${
                  activeContact === contact.id ? 'bg-white/10 shadow-md' : 'hover:bg-white/5'
                } ${!contact.isUnlocked ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="relative shrink-0">
                  <img src={contact.avatar} alt={contact.name} className={`w-12 h-12 rounded-full border-2 ${contact.isUnlocked ? `border-${contact.color}-500/50 bg-${contact.color}-500/10` : 'border-zinc-700 bg-zinc-800'}`} />
                  {hasUnread && contact.isUnlocked && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#121214] animate-pulse" />
                  )}
                  {!contact.isUnlocked && (
                     <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                        <Lock className="w-4 h-4 text-zinc-400" />
                     </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-bold text-sm truncate ${contact.isUnlocked ? 'text-white' : 'text-zinc-500'}`}>{contact.name}</h3>
                    {lastMsg && contact.isUnlocked && (
                      <span className="text-[9px] text-zinc-500 font-medium">
                        {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {contact.isUnlocked ? (
                    <p className={`text-xs truncate ${hasUnread ? 'text-white font-semibold' : 'text-zinc-500'}`}>
                      {lastMsg ? lastMsg.text : contact.role}
                    </p>
                  ) : (
                    <p className="text-[10px] text-zinc-600 font-mono tracking-wider">{contact.unlockHint}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN: CHAT WINDOW ── */}
      <div className={`w-full md:w-2/3 flex flex-col bg-black/40 ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
        {activeContact && activeContactDetails ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/5 bg-[#121214]/80 flex items-center gap-4 backdrop-blur-xl shrink-0">
              <button onClick={() => setActiveContact(null)} className="md:hidden p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img src={activeContactDetails.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-white/10 bg-white/5" />
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  {activeContactDetails.name}
                  <CheckCircle2 className={`w-3.5 h-3.5 text-${activeContactDetails.color}-400`} />
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{activeContactDetails.role}</p>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar flex flex-col">
              {currentChat.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                  <ShieldAlert className="w-12 h-12 text-zinc-500 mb-3" />
                  <p className="text-xs uppercase tracking-widest text-zinc-400">Connection Established</p>
                </div>
              ) : (
                currentChat.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`max-w-[85%] md:max-w-[75%] ${msg.sender === 'player' ? 'self-end' : 'self-start'}`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'player' 
                          ? 'bg-emerald-600 text-white rounded-tr-sm' 
                          : 'bg-[#1E1E22] text-zinc-200 border border-white/5 rounded-tl-sm'
                      }`}>
                        {msg.text.split('\\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {line}
                            {i !== msg.text.split('\\n').length - 1 && <br />}
                          </React.Fragment>
                        ))}
                      </div>
                      <span className={`text-[9px] text-zinc-600 font-medium px-1 ${msg.sender === 'player' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Choices Input Area */}
            <div className="p-4 border-t border-white/5 bg-[#121214]/80 backdrop-blur-xl shrink-0 min-h-[80px] flex items-center justify-center">
              <AnimatePresence mode="popLayout">
                {currentChoices.length > 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-wrap gap-2 justify-end w-full"
                  >
                    {currentChoices.map(choice => (
                      <button
                        key={choice.id}
                        onClick={choice.action}
                        className="px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.1)] flex items-center gap-2"
                      >
                        {choice.text}
                        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="w-full flex items-center px-4 py-3 bg-black/40 border border-white/5 rounded-xl"
                  >
                    <span className="text-xs text-zinc-600 italic">Awaiting response...</span>
                    <Send className="w-4 h-4 text-zinc-700 ml-auto" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-8 text-center hidden md:flex">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                <ShieldAlert className="w-8 h-8 text-zinc-600" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Secure Line Open</h3>
             <p className="text-sm max-w-xs">Select a contact from the directory to initiate an encrypted session.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
