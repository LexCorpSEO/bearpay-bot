import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Person, Bill, PromptPayConfig } from '../types';
import { Send, Copy, Check, X, Bot, Sparkles, Image as ImageIcon, Camera, Loader2, CheckCircle } from 'lucide-react';
import { formatTHB } from '../utils/thaiFormatters';
import { getPromptPayQRImageUrl } from '../utils/promptpay';

interface LineGroupBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  bills: Bill[];
  promptPayConfig: PromptPayConfig;
  onLogNotification?: (recipientName: string, billTitle: string) => void;
  onConfirmSettlePersonDebt?: (personId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  type: 'text' | 'image' | 'flex';
  content: string;
  flexData?: any;
  timestamp: Date;
  isProcessing?: boolean;
}

export const LineGroupBotModal: React.FC<LineGroupBotModalProps> = ({
  isOpen,
  onClose,
  people,
  bills,
  promptPayConfig,
  onLogNotification,
  onConfirmSettlePersonDebt
}) => {
  if (!isOpen) return null;

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate balances dynamically
  const { balances, totalOwedToMe } = useMemo(() => {
    let totalMe = 0;
    const bals: Record<string, number> = {};
    const me = people.find(p => p.isMe);
    
    people.forEach(p => bals[p.id] = 0);

    bills.forEach(bill => {
      if (bill.isCompleted) return;
      const isMyBill = me && bill.creatorId === me.id;
      
      bill.participants.forEach(participant => {
        if (participant.status === 'UNPAID') {
          if (isMyBill && participant.personId !== me.id) {
            bals[participant.personId] = (bals[participant.personId] || 0) + participant.amount;
            totalMe += participant.amount;
          } else if (!isMyBill && participant.personId === me?.id) {
            bals[bill.creatorId] = (bals[bill.creatorId] || 0) + participant.amount;
          }
        }
      });
    });

    return { balances: bals, totalOwedToMe: totalMe };
  }, [people, bills]);

  const debtorPeople = people.filter(p => !p.isMe && balances[p.id] > 0);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          id: Date.now().toString(),
          sender: 'bot',
          type: 'text',
          content: '🐻 สวัสดีครับ! แอด BearPay เข้ากลุ่มแล้ว\nพิมพ์ @BearPay สรุปยอด หรือ อัปโหลดสลิปมาในแชทให้ผมช่วยตรวจได้เลยครับ ✨',
          timestamp: new Date()
        }]);
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (text: string = inputMessage) => {
    if (!text.trim()) return;
    
    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      type: 'text',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    
    // Process command
    setTimeout(() => {
      const query = text.toLowerCase();
      
      let botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        type: 'text',
        content: 'ผมไม่เข้าใจคำสั่งครับ ลองพิมพ์ "@BearPay สรุปยอด" ดูสิครับ',
        timestamp: new Date()
      };

      if (query.includes('สรุปยอด') || query.includes('ยอดรวม')) {
        let groupText = `🐻 [สรุปยอดหนี้กลุ่ม]\n\n`;
        if (debtorPeople.length > 0) {
          debtorPeople.forEach((p, index) => {
            groupText += `${index + 1}️⃣ ${p.name} : ${formatTHB(balances[p.id])}\n`;
          });
          groupText += `\n👑 ยอดรวม: ${formatTHB(totalOwedToMe)}\n\n💳 โอนเข้า: ${promptPayConfig.target || '-'} (${promptPayConfig.name || 'ฉัน'})\nโอนแล้วแปะสลิปได้เลยครับ 📸`;
          
          botResponse = {
            ...botResponse,
            type: 'flex',
            content: groupText,
            flexData: { showQr: true, amountToPay: totalOwedToMe }
          };
        } else {
          botResponse.content = `🎉 เย้! ตอนนี้ไม่มีใครติดหนี้ค้างชำระเลย ทุกอย่างเคลียร์เรียบร้อย!`;
        }
      } else {
        // specific person
        const targetPerson = debtorPeople.find(p => query.includes(p.name.toLowerCase()));
        if (targetPerson) {
          const amount = balances[targetPerson.id] || 0;
          botResponse = {
            ...botResponse,
            type: 'flex',
            content: `🐻 สรุปยอดของคุณ ${targetPerson.name}\n\n📌 ค้างชำระ: ${formatTHB(amount)}\n💳 โอนที่: ${promptPayConfig.target || '-'}\nโอนแล้วอย่าลืมส่งสลิปมาให้ผมตรวจนะครับ!`,
            flexData: { showQr: true, amountToPay: amount }
          };
        }
      }
      
      setMessages(prev => [...prev, botResponse]);
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        sender: 'user',
        type: 'image',
        content: base64Data,
        timestamp: new Date()
      }]);

      // Add processing bot message
      const botMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botMsgId,
        sender: 'bot',
        type: 'text',
        content: '🔍 กำลังตรวจสอบสลิปโอนเงิน...',
        timestamp: new Date(),
        isProcessing: true
      }]);

      try {
        const res = await fetch('/api/gemini/scan-slip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg'
          })
        });
        const json = await res.json();

        if (json.success && json.data) {
          const data = json.data;
          
          let flexText = `✅ **ตรวจสอบสลิปสำเร็จ!**\n\nผู้โอน: ${data.payerName || 'ไม่ทราบชื่อ'}\nยอดเงิน: ${formatTHB(data.amount)}\nวันที่: ${data.transactionDate || 'ไม่ระบุ'}`;
          
          let matchedPerson = null;
          if (data.payerName) {
            matchedPerson = debtorPeople.find(p => 
              data.payerName.toLowerCase().includes(p.name.toLowerCase()) || 
              p.name.toLowerCase().includes(data.payerName.toLowerCase())
            );
          }

          if (matchedPerson) {
            flexText += `\n\n🎉 ยืนยันว่าคุณ ${matchedPerson.name} จ่ายแล้ว! ระบบอัปเดตยอดให้แล้วครับ`;
            if (onConfirmSettlePersonDebt) {
              onConfirmSettlePersonDebt(matchedPerson.id);
            }
          } else {
            flexText += `\n\n⚠️ ไม่สามารถจับคู่ชื่อผู้โอนกับสมาชิกในกลุ่มได้ กรุณาตรวจสอบอีกครั้ง`;
          }

          setMessages(prev => prev.map(m => m.id === botMsgId ? {
            ...m,
            type: 'flex',
            content: flexText,
            isProcessing: false,
            flexData: { success: true }
          } : m));

        } else {
          throw new Error('Verification failed');
        }
      } catch (err) {
        setMessages(prev => prev.map(m => m.id === botMsgId ? {
          ...m,
          content: '❌ ขออภัยครับ พี่หมีตรวจสลิปนี้ไม่ผ่าน หรือรูปอาจจะไม่ชัดเจน รบกวนส่งใหม่อีกครั้งนะครับ',
          isProcessing: false
        } : m));
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#8BA1BD] border border-slate-800 rounded-3xl w-full max-w-lg my-auto overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-[800px]">
        
        {/* Header - LINE Style */}
        <div className="flex items-center justify-between p-4 bg-[#212429] border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-extrabold text-xl shadow-lg border-2 border-white">
              🐻
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>กลุ่มทวงหนี้ BearPay</span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Bot Active
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative scroll-smooth">
          <div className="text-center text-[10px] text-slate-600 font-bold my-4 bg-black/5 rounded-full py-1 px-3 w-max mx-auto">
            วันนี้
          </div>
          
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start space-x-2'}`}>
              
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold text-sm shadow-sm shrink-0 mt-1">
                  🐻
                </div>
              )}

              <div className={`max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {msg.sender === 'bot' && <span className="text-[10px] text-slate-600 font-bold ml-1 mb-0.5">BearPay</span>}
                
                {msg.type === 'image' ? (
                  <div className="rounded-2xl overflow-hidden shadow-sm border-2 border-white bg-slate-200">
                    <img src={msg.content} alt="Uploaded Slip" className="w-48 h-auto object-cover" />
                  </div>
                ) : msg.type === 'flex' ? (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 w-64">
                    <div className={`h-2 ${msg.flexData?.success ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                    <div className="p-3.5 space-y-3">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">
                        {msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                      </pre>
                      
                      {msg.flexData?.showQr && promptPayConfig.target && (
                        <div className="mt-2 pt-2 border-t border-slate-100 text-center bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">สแกนจ่ายผ่านแอปธนาคาร:</span>
                          <div className="bg-white p-1 rounded-lg w-32 h-32 mx-auto shadow-inner border border-slate-200">
                            <img src={getPromptPayQRImageUrl(promptPayConfig.target, msg.flexData.amountToPay)} alt="QR" className="w-full h-full object-contain" />
                          </div>
                        </div>
                      )}
                      
                      {msg.flexData?.success && (
                        <div className="flex items-center justify-center space-x-1.5 text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-[11px] font-bold">ยอดหนี้ถูกบันทึกแล้ว</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`px-3.5 py-2.5 rounded-2xl shadow-sm text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#85e249] text-slate-900 rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.isProcessing ? (
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-bold">{msg.content}</span>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                    )}
                  </div>
                )}
                <span className="text-[9px] text-slate-600 mt-1 opacity-70 px-1">
                  {msg.timestamp.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex flex-wrap gap-2 mb-3">
             <button onClick={() => handleSendMessage('@BearPay สรุปยอด')} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors border border-slate-200">
               🐻 สรุปยอดหนี้
             </button>
             {debtorPeople.map(p => (
               <button key={p.id} onClick={() => handleSendMessage(`@BearPay ทวงหนี้ ${p.name}`)} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors border border-slate-200">
                 🗣 ทวง {p.name}
               </button>
             ))}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors shrink-0">
              <ImageIcon className="w-6 h-6" />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="p-2 bg-[#212429] text-white rounded-full hover:bg-slate-800 disabled:opacity-50 transition-all shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
