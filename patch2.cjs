const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// handleClearAllData
code = code.replace(/setBills\(\[\]\);\s*saveBills\(\[\]\);\s*setBearTransactions\(\[\]\);\s*setPeople\(INITIAL_PEOPLE\);\s*savePeople\(INITIAL_PEOPLE\);\s*setPromptPayConfig\(INITIAL_PROMPTPAY\);\s*savePromptPayConfig\(INITIAL_PROMPTPAY\);/g, `bills.forEach(b => fb.deleteBill(b.id));
      bearTransactions.forEach(t => fb.deleteBearTransaction(t.id));
      people.forEach(p => { if(!p.isMe) fb.deletePerson(p.id) });
      fb.savePromptPayConfig(INITIAL_PROMPTPAY);
      fb.saveLineConfig(INITIAL_LINE_CONFIG);`);

// handleRestoreDemoData
code = code.replace(/setBills\(DEMO_BILLS\);\s*saveBills\(DEMO_BILLS\);\s*setPeople\(DEMO_PEOPLE\);\s*savePeople\(DEMO_PEOPLE\);\s*setPromptPayConfig\(DEMO_PROMPTPAY\);\s*savePromptPayConfig\(DEMO_PROMPTPAY\);\s*setBearTransactions\(DEMO_BEAR_TRANSACTIONS\);/g, `DEMO_BILLS.forEach(b => fb.saveBill(b));
      DEMO_PEOPLE.forEach(p => fb.savePerson(p));
      DEMO_BEAR_TRANSACTIONS.forEach(t => fb.saveBearTransaction(t));
      fb.savePromptPayConfig(DEMO_PROMPTPAY);`);

// handleClearPersonDebt
code = code.replace(/setBills\(prevBills =>\s*prevBills\.map\(b => \{\s*if \(\!b\.participants\.some\(p => p\.personId === personId && p\.status === 'UNPAID'\)\) return b;\s*const updatedParts = b\.participants\.map\(p => \{\s*if \(p\.personId === personId && p\.status === 'UNPAID'\) \{\s*return \{ \.\.\.p, status: 'PAID', paidAt: new Date\(\)\.toISOString\(\) \};\s*\}\s*return p;\s*\}\);\s*const isCompleted = updatedParts\.every\(p => p\.status === 'PAID'\);\s*return \{ \.\.\.b, participants: updatedParts, isCompleted \};\s*\}\)\s*\);/g, `bills.forEach(b => {
      if (!b.participants.some(p => p.personId === personId && p.status === 'UNPAID')) return;
      const updatedParts = b.participants.map(p => {
        if (p.personId === personId && p.status === 'UNPAID') {
          return { ...p, status: 'PAID' as PaymentStatus, paidAt: new Date().toISOString() };
        }
        return p;
      });
      const isCompleted = updatedParts.every(p => p.status === 'PAID');
      fb.saveBill({ ...b, participants: updatedParts, isCompleted });
    });`);

// handleAddBearTransaction
code = code.replace(/setBearTransactions\(prev => \[newTx, \.\.\.prev\]\);/g, `fb.saveBearTransaction(newTx);`);

// handleDeleteBearTransaction
code = code.replace(/setBearTransactions\(prev => prev\.filter\(tx => tx\.id !== id\)\);/g, `fb.deleteBearTransaction(id);`);

// handleSettleFullPersonDebt
code = code.replace(/setBills\(prev =>\s*prev\.map\(bill => \{\s*const hasUnpaidPerson = bill\.participants\.some\(p => p\.personId === personId && p\.status !== 'PAID'\);\s*if \(\!hasUnpaidPerson\) return bill;\s*const updatedParticipants = bill\.participants\.map\(p => \{\s*if \(p\.personId === personId\) \{\s*return \{ \.\.\.p, status: 'PAID' as PaymentStatus, paidAt: new Date\(\)\.toISOString\(\) \};\s*\}\s*return p;\s*\}\);\s*const isCompleted = updatedParticipants\.every\(p => p\.status === 'PAID'\);\s*return \{ \.\.\.bill, participants: updatedParticipants, isCompleted \};\s*\}\)\s*\);/g, `bills.forEach(bill => {
      const hasUnpaidPerson = bill.participants.some(p => p.personId === personId && p.status !== 'PAID');
      if (!hasUnpaidPerson) return;
      const updatedParticipants = bill.participants.map(p => {
        if (p.personId === personId) {
          return { ...p, status: 'PAID' as PaymentStatus, paidAt: new Date().toISOString() };
        }
        return p;
      });
      const isCompleted = updatedParticipants.every(p => p.status === 'PAID');
      fb.saveBill({ ...bill, participants: updatedParticipants, isCompleted });
    });`);

// handleSettleBillDebt
code = code.replace(/setBills\(prev =>\s*prev\.map\(bill => \{\s*if \(bill\.id !== billId\) return bill;\s*const updatedParticipants = bill\.participants\.map\(p => \{\s*if \(personId && p\.personId !== personId\) return p;\s*return \{ \.\.\.p, status: 'PAID' as PaymentStatus, paidAt: new Date\(\)\.toISOString\(\) \};\s*\}\);\s*const isCompleted = updatedParticipants\.every\(p => p\.status === 'PAID'\);\s*return \{ \.\.\.bill, participants: updatedParticipants, isCompleted \};\s*\}\)\s*\);/g, `const bill = bills.find(b => b.id === billId);
    if (bill) {
      const updatedParticipants = bill.participants.map(p => {
        if (personId && p.personId !== personId) return p;
        return { ...p, status: 'PAID' as PaymentStatus, paidAt: new Date().toISOString() };
      });
      const isCompleted = updatedParticipants.every(p => p.status === 'PAID');
      fb.saveBill({ ...bill, participants: updatedParticipants, isCompleted });
    }`);

// handleSavePeople
code = code.replace(/const handleSavePeople = \(updatedPeople: Person\[\]\) => \{\s*setPeople\(updatedPeople\);\s*savePeople\(updatedPeople\);\s*showToast\('บันทึกข้อมูลสมาชิกเรียบร้อยแล้ว'\);\s*\}\;/g, `const handleSavePeople = (updatedPeople: Person[]) => {
    updatedPeople.forEach(p => fb.savePerson(p));
    // Check for deletions
    people.forEach(p => {
      if (!updatedPeople.find(up => up.id === p.id)) {
        fb.deletePerson(p.id);
      }
    });
    showToast('บันทึกข้อมูลสมาชิกเรียบร้อยแล้ว');
  };`);

// Line settings and PromptPay settings
code = code.replace(/const handleSaveLineSettings = \(config: LineConfig\) => \{\s*setLineConfig\(config\);\s*saveLineConfig\(config\);\s*showToast\('บันทึกตั้งค่า LINE สำเร็จ'\);\s*\}\;/g, `const handleSaveLineSettings = (config: LineConfig) => {
    fb.saveLineConfig(config);
    showToast('บันทึกตั้งค่า LINE สำเร็จ');
  };`);

code = code.replace(/const handleSavePromptPay = \(config: PromptPayConfig\) => \{\s*setPromptPayConfig\(config\);\s*savePromptPayConfig\(config\);\s*showToast\('บันทึกข้อมูลบัญชีรับเงินสำเร็จ'\);\s*\}\;/g, `const handleSavePromptPay = (config: PromptPayConfig) => {
    fb.savePromptPayConfig(config);
    showToast('บันทึกข้อมูลบัญชีรับเงินสำเร็จ');
  };`);


fs.writeFileSync('src/App.tsx', code);
