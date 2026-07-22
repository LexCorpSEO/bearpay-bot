const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/setBills\(prevBills =>\s*prevBills\.map\(bill => {[\s\S]*?return {\s*\.\.\.bill,\s*participants: updatedParticipants,\s*isCompleted,\s*};\s*}\)\s*\);/m, `const billToUpdate = bills.find(b => b.id === billId);
    if (billToUpdate) {
      const updatedParticipants = billToUpdate.participants.map(part => {
        if (part.personId !== personId) return part;
        return {
          ...part,
          status,
          paidAt: status === 'PAID' ? new Date().toISOString() : part.paidAt,
          slipUrl: slipUrl || part.slipUrl,
          slipNotes: notes || part.slipNotes,
        };
      });
      const isCompleted = updatedParticipants.every(p => p.status === 'PAID');
      const updatedBill = {
        ...billToUpdate,
        participants: updatedParticipants,
        isCompleted,
      };
      fb.saveBill(updatedBill);
    }`);

fs.writeFileSync('src/App.tsx', code);
