const TestRunner = require('../core/testRunner');
const NumberToWords = require('../core/NumberToWords');
const PdfEngine = require('../core/Pdf');
const DocNumber = require('../core/DocNumber');
const Audit = require('../core/Audit');
const Export = require('../core/Export');
const Backup = require('../core/Backup');
const fs = require('fs');
const path = require('path');

// Test 1: NumberToWords - English & South Asian Lakh/Crore
TestRunner.register('ERP Advanced - NumberToWords English System', async (assert) => {
  const words1 = NumberToWords.toEnglish(1500);
  assert.strictEqual(words1, 'One Thousand Five Hundred', 'Should convert 1500 to English words');

  // South Asian Lakh/Crore
  const wordsLakh = NumberToWords.toEnglish(1250000, { useLakhCrore: true });
  assert.strictEqual(wordsLakh, 'Twelve Lakh Fifty Thousand', 'Should convert 12,50,000 using Lakh system');

  // International Million/Billion
  const wordsMillion = NumberToWords.toEnglish(1250000, { useLakhCrore: false });
  assert.strictEqual(wordsMillion, 'One Million Two Hundred Fifty Thousand', 'Should convert 1,250,000 using Million system');
});

// Test 2: NumberToWords - Bengali (বাংলা কথায় রূপান্তর)
TestRunner.register('ERP Advanced - NumberToWords Bengali System', async (assert) => {
  assert.strictEqual(NumberToWords.toBangla(0), 'শূন্য', '0 should be শূন্য');
  assert.strictEqual(NumberToWords.toBangla(15), 'পনেরো', '15 should be পনেরো');
  assert.strictEqual(NumberToWords.toBangla(100), 'এক শত', '100 should be এক শত');
  assert.strictEqual(NumberToWords.toBangla(1500), 'এক হাজার পাঁচ শত', '1500 should be এক হাজার পাঁচ শত');
  
  const croreVal = NumberToWords.toBangla(10050000);
  assert.ok(croreVal.includes('কোটি'), 'Should format কোটি correctly');
  assert.ok(croreVal.includes('পঞ্চাশ হাজার'), 'Should format হাজার correctly');
});

// Test 3: NumberToWords - Currency In-Words (টাকা ও পয়সা মাত্র)
TestRunner.register('ERP Advanced - Currency In-Words for Cheques & Invoices', async (assert) => {
  const bnInvoiceWords = NumberToWords.toCurrencyWords(1500.50, { language: 'bn', currency: 'BDT' });
  assert.ok(bnInvoiceWords.includes('টাকা'), 'Bengali currency should include টাকা');
  assert.ok(bnInvoiceWords.includes('পয়সা'), 'Bengali currency should include পয়সা');
  assert.ok(bnInvoiceWords.endsWith('মাত্র'), 'Bengali currency should end with মাত্র');

  const enInvoiceWords = NumberToWords.toCurrencyWords(2500.75, { language: 'en', currency: 'BDT' });
  assert.ok(enInvoiceWords.includes('Two Thousand Five Hundred Taka'), 'English currency should include Taka');
  assert.ok(enInvoiceWords.includes('Seventy Five Paisa'), 'English currency should include Paisa');
  assert.ok(enInvoiceWords.endsWith('Only'), 'English currency should end with Only');
});

// Test 4: PDF Reporting Engine - HTML & EJS View Rendering with Bengali Fonts
TestRunner.register('ERP Advanced - PDF Engine & Bengali Font Injection', async (assert) => {
  const sampleHtml = '<h1>চালানপত্র</h1><p class="bn-text">অর্ডার বিবরণী</p>';
  const pdfDoc = PdfEngine.loadHtml(sampleHtml, { format: 'A4' });
  
  const preparedHtml = pdfDoc.toHtml();
  assert.ok(preparedHtml.includes('Noto Sans Bengali'), 'PDF HTML should inject Noto Sans Bengali font');
  assert.ok(preparedHtml.includes('font-feature-settings: "kern" 1, "liga" 1'), 'PDF HTML should inject ligature shaping CSS');
  assert.ok(preparedHtml.includes('চালানপত্র'), 'PDF HTML should preserve Bengali characters');

  // Test buffer export
  const buffer = await pdfDoc.toBuffer();
  assert.ok(Buffer.isBuffer(buffer), 'PDF should generate a binary Buffer');
  assert.ok(buffer.length > 0, 'PDF buffer should not be empty');

  // Test EJS Invoice View Rendering
  const invoiceData = {
    company: {
      name: 'Aero E-Commerce Ltd.',
      address: 'Dhaka, Bangladesh',
      phone: '+880 1700-000000',
      email: 'billing@aero.test',
      bin: '001234567-0101'
    },
    customer: {
      name: 'আহমেদ হাসান (Ahmed Hasan)',
      company: 'Tech Solutions BD',
      address: 'মিরপুর, ঢাকা - ১২১৬',
      phone: '+880 1800-000000'
    },
    invoice: {
      number: 'INV-202609-0001',
      date: '2026-09-09',
      paymentMethod: 'বিকাশ / bKash Online',
      status: 'পরিশোধিত (PAID)'
    },
    items: [
      { name: 'Wireless Ergonomic Keyboard', sku: 'KB-001', quantity: 2, price: 2500 },
      { name: 'Gaming Optical Mouse', sku: 'MS-002', quantity: 1, price: 1200 }
    ],
    summary: {
      subtotal: 6200,
      discount: 200,
      tax: 300,
      total: 6300
    },
    wordsBn: NumberToWords.toCurrencyWords(6300, { language: 'bn', currency: 'BDT' }),
    wordsEn: NumberToWords.toCurrencyWords(6300, { language: 'en', currency: 'BDT' })
  };

  const invoicePdf = await PdfEngine.loadView('reports/invoice', invoiceData);
  const renderedInvoice = invoicePdf.toHtml();
  assert.ok(renderedInvoice.includes('INV-202609-0001'), 'Rendered invoice should contain invoice number');
  assert.ok(renderedInvoice.includes('আহমেদ হাসান'), 'Rendered invoice should contain customer Bengali name');
  assert.ok(renderedInvoice.includes('Wireless Ergonomic Keyboard'), 'Rendered invoice should contain item name');
  assert.ok(renderedInvoice.includes('কথায় (In Words):'), 'Rendered invoice should contain in-words section');
});

// Test 5: Sequential Document Numbering Engine (DocNumber)
TestRunner.register('ERP Advanced - Sequential Document Numbering', async (assert) => {
  DocNumber.resetMemory();

  // Test Pattern Formatting
  const fixedDate = new Date('2026-09-15');
  const formatted = DocNumber.formatPattern('{PREFIX}-{YYYY}{MM}-{00001}', 42, {
    PREFIX: 'INV',
    date: fixedDate
  });
  assert.strictEqual(formatted, 'INV-202609-00042', 'formatPattern should format sequential code with zero padding');

  // Reset sequence counter to 0 for isolated test
  await DocNumber.setSequence('test_invoice', 0, { date: fixedDate });

  // Test Sequential generation
  const num1 = await DocNumber.next('test_invoice', {
    prefix: 'INV',
    format: '{PREFIX}-{YYYY}{MM}-{00001}',
    date: fixedDate
  });
  const num2 = await DocNumber.next('test_invoice', {
    prefix: 'INV',
    format: '{PREFIX}-{YYYY}{MM}-{00001}',
    date: fixedDate
  });

  assert.strictEqual(num1, 'INV-202609-00001', 'First generated number should be sequence 1');
  assert.strictEqual(num2, 'INV-202609-00002', 'Second generated number should be sequence 2');

  // Test Branch Code replacement
  await DocNumber.setSequence('test_challan', 0, { branch: 'CTG', date: fixedDate });
  const branchDoc = await DocNumber.next('test_challan', {
    prefix: 'CH',
    branch: 'CTG',
    format: '{BRANCH}/{PREFIX}-{0001}',
    date: fixedDate
  });
  assert.strictEqual(branchDoc, 'CTG/CH-0001', 'Should incorporate branch code');
});

// Test 6: Audit Trail & Diff Engine (Audit)
TestRunner.register('ERP Advanced - Audit Trail & State Diff Engine', async (assert) => {
  Audit.resetMemory();

  // Test Diff calculation
  const oldState = { id: 10, name: 'Product A', price: 100, stock: 50, updated_at: '2026-01-01' };
  const newState = { id: 10, name: 'Product A', price: 120, stock: 45, updated_at: '2026-09-09' };

  const { oldValues, newValues } = Audit.diff(oldState, newState);
  assert.deepStrictEqual(oldValues, { price: 100, stock: 50 }, 'Diff should capture changed old fields only');
  assert.deepStrictEqual(newValues, { price: 120, stock: 45 }, 'Diff should capture changed new fields only');
  assert.strictEqual(oldValues.updated_at, undefined, 'Diff should ignore updated_at timestamps');

  // Test Audit Log creation
  const logEntry = await Audit.log({
    userId: 5,
    action: 'UPDATE',
    auditableType: 'Product',
    auditableId: 10,
    oldValues,
    newValues,
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0'
  });

  assert.strictEqual(logEntry.action, 'UPDATE', 'Audit log should record action');
  assert.strictEqual(logEntry.auditable_type, 'Product', 'Audit log should record entity type');

  // Test Audit Trail retrieval
  const trail = await Audit.getTrail('Product', 10);
  assert.ok(trail.length > 0, 'Audit trail should return logged entries');
  assert.strictEqual(String(trail[0].user_id), '5', 'Trail entry should record userId');
});

// Test 7: Memory-Safe Streaming Export Engine (Export)
TestRunner.register('ERP Advanced - Memory-Safe Streaming Export', async (assert) => {
  // Test CSV Formula Injection defense
  const dangerousCell = '=cmd|"/C calc"!A0';
  const sanitized = Export.sanitizeCell(dangerousCell);
  assert.ok(sanitized.startsWith('"\'='), 'Dangerous formula prefix = should be sanitized with leading quote');

  const normalCell = 'Aero "ERP" Soft';
  const sanitizedQuotes = Export.sanitizeCell(normalCell);
  assert.strictEqual(sanitizedQuotes, '"Aero ""ERP"" Soft"', 'Double quotes should be properly escaped');

  // Test HTTP Response Streaming simulation
  const chunks = [];
  const mockHeaders = {};
  const mockRes = {
    setHeader: (key, val) => { mockHeaders[key] = val; },
    write: (chunk) => { chunks.push(chunk); return true; },
    end: () => { chunks.push('__ENDED__'); }
  };

  const sampleRows = [
    { id: 1, name: 'সফটওয়্যার লাইসেন্স (Software License)', amount: 15000 },
    { id: 2, name: 'সার্ভার হোস্টিং (Server Hosting)', amount: 5000 }
  ];

  const columns = [
    { key: 'id', label: 'আইডি' },
    { key: 'name', label: 'বিবরণ' },
    { key: 'amount', label: 'পরিমাণ', formatter: (val) => `৳ ${val.toFixed(2)}` }
  ];

  await Export.toCsvStream(sampleRows, columns, mockRes, 'sales_report.csv');

  assert.ok(mockHeaders['Content-Type'].includes('text/csv'), 'Should set CSV Content-Type');
  assert.ok(mockHeaders['Content-Disposition'].includes('sales_report.csv'), 'Should set filename disposition');
  assert.strictEqual(chunks[0], '\uFEFF', 'First chunk must be UTF-8 BOM for Excel Bengali compatibility');
  
  const fullCsvOutput = chunks.join('');
  assert.ok(fullCsvOutput.includes('"আইডি","বিবরণ","পরিমাণ"'), 'Should output CSV header');
  assert.ok(fullCsvOutput.includes('সফটওয়্যার লাইসেন্স'), 'Should output Bengali UTF-8 text correctly');
  assert.ok(fullCsvOutput.includes('৳ 15000.00'), 'Should apply column formatter');
});

// Test 8: Database Backup Engine (Backup)
TestRunner.register('ERP Advanced - Database Backup Directory & List', async (assert) => {
  const dir = Backup.getBackupDir();
  assert.ok(fs.existsSync(dir), 'Backup directory should exist or be created');

  const list = Backup.list();
  assert.ok(Array.isArray(list), 'Backup list should return an array');
});
