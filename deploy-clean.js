const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up duplicate code...');

// List of files that need cleaning
const filesToClean = [
  'app/api/xendit/create-payment-link/route.ts',
  'app/api/xendit/webhook/route.ts',
  'lib/services/xenPlatformService.ts',
  'lib/services/xenditService.ts',
  'app/(dashboard)/dashboard/page.tsx',
  'app/(dashboard)/payments/page.tsx',
  'app/(dashboard)/payments/tenant-payment/page.tsx',
  'app/(dashboard)/settings/page.tsx'
];

// Function to clean duplicate content
function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove duplicate function definitions
    const lines = content.split('\n');
    const cleanedLines = [];
    const seenFunctions = new Set();
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for duplicate function definitions
      if (line.includes('export async function POST') || 
          line.includes('export class XenPlatformService') ||
          line.includes('async function handleInvoice') ||
          line.includes('function POST') ||
          line.includes('class XenPlatformService')) {
        
        const funcName = line.match(/(?:export\s+)?(?:async\s+)?(?:function|class)\s+(\w+)/)?.[1];
        if (funcName && seenFunctions.has(funcName)) {
          // Skip this duplicate
          continue;
        }
        if (funcName) {
          seenFunctions.add(funcName);
        }
      }
      
      cleanedLines.push(line);
    }
    
    // Write cleaned content
    fs.writeFileSync(filePath, cleanedLines.join('\n'));
    console.log(`✅ Cleaned ${filePath}`);
  } catch (error) {
    console.log(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

// Clean all files
filesToClean.forEach(cleanFile);

console.log('🚀 Building project...');

try {
  // Build the project
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
  
  console.log('🌐 Deploying to Firebase Hosting...');
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('🎉 Deployment complete!');
  
} catch (error) {
  console.log('❌ Build or deployment failed:', error.message);
  process.exit(1);
}












