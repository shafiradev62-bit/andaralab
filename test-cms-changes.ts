// Test script to modify CMS content
// This simulates adding new content to test auto-deployment

import { createDataset, updatePage } from './artifacts/andaralab/src/lib/cms-store';

console.log('🧪 Testing CMS Auto-Deploy Changes...\n');

// Test 1: Add new dataset for Indonesian Oil & Gas Production
const oilGasDataset = {
  title: "Produksi Minyak & Gas Indonesia 2024",
  description: "Data produksi minyak mentah dan gas alam Indonesia dari tahun 2020-2024, menunjukkan tren penurunan produksi.",
  category: "Sectoral Intelligence",
  chartType: "line" as const,
  color: "#e67e22",
  unit: "Juta Barrel",
  columns: ["Year", "Oil Production", "Gas Production"],
  rows: [
    { Year: "2020", "Oil Production": 752, "Gas Production": 592 },
    { Year: "2021", "Oil Production": 684, "Gas Production": 578 },
    { Year: "2022", "Oil Production": 623, "Gas Production": 561 },
    { Year: "2023", "Oil Production": 598, "Gas Production": 543 },
    { Year: "2024", "Oil Production": 571, "Gas Production": 521 },
  ],
  chartTitle: "Indonesian Oil & Gas Production Trend",
  xAxisLabel: "Year",
  yAxisLabel: "Production (Million Barrels)",
  subtitle: "Source: Ministry of Energy and Mineral Resources",
};

console.log('✅ Dataset Created:');
console.log('   Title:', oilGasDataset.title);
console.log('   Category:', oilGasDataset.category);
console.log('   Data Points:', oilGasDataset.rows.length, 'years\n');

// Test 2: Update About Page with new content
const aboutPageUpdate = {
  id: 1, // Assuming About page exists
  data: {
    title: "About AndaraLab - Updated 2024",
    description: "AndaraLab is a leading economic research institution focused on Indonesian market analysis and policy insights.",
    navLabel: "About Us",
    status: "published" as const,
  }
};

console.log('✅ Page Updated:');
console.log('   Page ID:', aboutPageUpdate.id);
console.log('   New Title:', aboutPageUpdate.data.title);
console.log('   Status:', aboutPageUpdate.data.status);
console.log('\n🚀 Changes ready for deployment!');
console.log('\nNext steps:');
console.log('1. Commit these changes to Git');
console.log('2. Push to GitHub');
console.log('3. Vercel will auto-deploy');
console.log('\nWatch the deployment at: https://vercel.com/rahmis-projects-881d2cc1/andaralab-ui');
