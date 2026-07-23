import React, { useState } from 'react';
import { Person } from '../types';
import { Users, UserPlus, X, Trash2, Edit3, Check, Phone, CreditCard, MessageSquare } from 'lucide-react';

interface FriendManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onSavePeople: (people: Person[]) => void;
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-pink-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
];

export const FriendManagerModal: React.FC<FriendManagerModalProps> = ({
  isOpen,
  onClose,
  people,
  onSavePeople,
}) => {
  if (!isOpen) return null;

  const [friends, setFriends] = useState<Person[]>(people);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);

  // New friend form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [promptPay, setPromptPay] = useState('');
  const [lineId, setLineId] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-blue-500');

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPersonId) {
      // Update existing
      const updated = friends.map(p => {
        if (p.id === editingPersonId) {
          return {
            ...p,
            name: name.trim(),
            phone: phone.trim() || undefined,
            promptPay: promptPay.trim() || undefined,
            lineId: lineId.trim() || undefined,
            avatarColor,
          };
        }
        return p;
      });
      setFriends(updated);
      onSavePeople(updated);
      setEditingPersonId(null);
    } else {
      // Add new
      const newPerson: Person = {
        id: 'p_' + Date.now(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        promptPay: promptPay.trim() || undefined,
        lineId: lineId.trim() || undefined,
        avatarColor,
      };
      const updated = [...friends, newPerson];
      setFriends(updated);
      onSavePeople(updated);
    }

    // Reset inputs
    setName('');
    setPhone('');
    setPromptPay('');
    setLineId('');
  };

  const startEdit = (person: Person) => {
    setEditingPersonId(person.id);
    setName(person.name);
    setPhone(person.phone || '');
    setPromptPay(person.promptPay || '');
    setLineId(person.lineId || '');
    setAvatarColor(person.avatarColor || 'bg-blue-500');
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบรายชื่อเพื่อนคนนี้ใช่หรือไม่?')) {
      const updated = friends.filter(p => p.id !== id);
      setFriends(updated);
      onSavePeople(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">จัดการรายชื่อเพื่อนในกลุ่ม</h2>
              <p className="text-xs text-slate-400">เพิ่มหรือแก้ไขข้อมูลเบอร์โทร พร้อมเพย์ และ LINE ID ของเพื่อน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4  space-y-5 overflow-y-auto flex-1 min-h-0">
          
          {/* Add / Edit Form */}
          <form onSubmit={handleAddOrUpdate} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-sky-300 block">
              {editingPersonId ? '✏️ แก้ไขข้อมูลเพื่อน' : '➕ เพิ่มเพื่อนคนใหม่'}
            </span>

            <div className="grid grid-cols-1  gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">ชื่อเพื่อน *</label>
                <input
                  type="text"
                  placeholder="เช่น สมชาย, สมหญิง"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">พร้อมเพย์เพื่อน</label>
                <input
                  type="text"
                  placeholder="เช่น 0812345678"
                  value={promptPay}
                  onChange={e => setPromptPay(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300">LINE ID</label>
                <input
                  type="text"
                  placeholder="เช่น @somchai_line"
                  value={lineId}
                  onChange={e => setLineId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Avatar Color selector */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] text-slate-400">สีประจำตัวเพื่อน:</label>
              <div className="flex space-x-2">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-6 h-6 rounded-lg ${color} transition-all ${
                      avatarColor === color ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              {editingPersonId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPersonId(null);
                    setName('');
                    setPhone('');
                    setPromptPay('');
                    setLineId('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  ยกเลิก
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                {editingPersonId ? 'บันทึกการแก้ไข' : 'เพิ่มรายชื่อ'}
              </button>
            </div>
          </form>

          {/* Friends List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              รายชื่อเพื่อนทั้งหมด ({friends.length} คน)
            </span>

            <div className="space-y-2">
              {friends.map(p => (
                <div
                  key={p.id}
                  className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl ${p.avatarColor || 'bg-slate-700'} text-white font-bold text-xs flex items-center justify-center`}>
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                        <span>{p.name}</span>
                        {p.isMe && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            ตัวฉัน
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 space-x-2 mt-0.5">
                        {p.phone && <span>📞 {p.phone}</span>}
                        {p.lineId && <span>💬 {p.lineId}</span>}
                      </div>
                    </div>
                  </div>

                  {!p.isMe && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-xl hover:bg-slate-800 text-rose-400 hover:text-rose-300 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
