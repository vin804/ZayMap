const fs = require('fs');
const path = require('path');

const TARGET_DIRS = [
  path.join(process.cwd(), 'app', 'api'),
  path.join(process.cwd(), 'app', 'admin', 'seed')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Skip if already uses adminDb
  if (content.includes('adminDb')) {
    return false;
  }
  
  // Only process files that use firebase client SDK
  if (!content.includes('firebase/firestore') && !content.includes('firebase/app')) {
    return false;
  }
  
  const relPath = path.relative(process.cwd(), filePath);
  console.log(`\n📄 ${relPath}`);
  
  // Check for query chains - these need manual fixing
  if (content.includes('query(') && content.includes('where(')) {
    console.log(`   ⚠️  SKIPPED - Contains query() + where() chains. Needs manual fix.`);
    return false;
  }
  
  // Step 1: Remove firebase/app imports and initialization
  content = content.replace(/import\s*{\s*initializeApp\s*,?\s*getApps\s*}\s*from\s*["']firebase\/app["'];?\n?/g, '');
  content = content.replace(/import\s*{\s*getApps\s*,?\s*initializeApp\s*}\s*from\s*["']firebase\/app["'];?\n?/g, '');
  content = content.replace(/import\s*{\s*getApp\s*,?\s*initializeApp\s*}\s*from\s*["']firebase\/app["'];?\n?/g, '');
  content = content.replace(/import\s*{\s*initializeApp\s*}\s*from\s*["']firebase\/app["'];?\n?/g, '');
  content = content.replace(/import\s*{\s*getApps\s*}\s*from\s*["']firebase\/app["'];?\n?/g, '');
  
  // Remove firebase config object
  content = content.replace(/const firebaseConfig = \{[\s\S]*?\};?\n?/g, '');
  
  // Remove getDb/getFirestore helper functions
  content = content.replace(/function getDb\(\) \{[\s\S]*?return getFirestore\(\);\s*\}\n?/g, '');
  content = content.replace(/const db = getDb\(\);?\n?/g, '');
  content = content.replace(/const db = getFirestore\(\);?\n?/g, '');
  
  // Step 2: Determine what admin imports are needed
  const needsFieldValue = content.includes('serverTimestamp') || content.includes('increment(');
  const needsGeoPoint = content.includes('GeoPoint');
  const needsTimestamp = content.includes('Timestamp');
  
  // Step 3: Replace firebase/firestore import
  const importLines = content.match(/import\s*{\s*[^}]*\s*}\s*from\s*["']firebase\/firestore["'];?\n?/g) || [];
  
  let adminImports = [];
  if (needsFieldValue) adminImports.push('FieldValue');
  if (needsGeoPoint) adminImports.push('GeoPoint');
  if (needsTimestamp) adminImports.push('Timestamp');
  
  let newImport = `import { adminDb } from "@/lib/firebase-server";`;
  if (adminImports.length > 0) {
    newImport += `\nimport { ${adminImports.join(', ')} } from "firebase-admin/firestore";`;
  }
  
  for (const line of importLines) {
    content = content.replace(line, newImport + '\n');
  }
  
  // Step 4: Replace common patterns
  
  // getDoc(doc(db, "collection", id))
  content = content.replace(/await getDoc\(doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\)\)/g, 'await adminDb.collection("$1").doc($2).get()');
  
  // getDocs(collection(db, "collection"))
  content = content.replace(/await getDocs\(collection\(db,\s*["']([^"']+)["']\)\)/g, 'await adminDb.collection("$1").get()');
  
  // addDoc(collection(db, "collection"), data)
  content = content.replace(/await addDoc\(collection\(db,\s*["']([^"']+)["']\),\s*([^)]+)\)/g, 'await adminDb.collection("$1").add($2)');
  
  // updateDoc(doc(db, "collection", id), data)
  content = content.replace(/await updateDoc\(doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\),\s*([^)]+)\)/g, 'await adminDb.collection("$1").doc($2).update($3)');
  
  // setDoc(doc(db, "collection", id), data)
  content = content.replace(/await setDoc\(doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\),\s*([^)]+)\)/g, 'await adminDb.collection("$1").doc($2).set($3)');
  
  // deleteDoc(doc(db, "collection", id))
  content = content.replace(/await deleteDoc\(doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\)\)/g, 'await adminDb.collection("$1").doc($2).delete()');
  
  // serverTimestamp()
  content = content.replace(/serverTimestamp\(\)/g, 'FieldValue.serverTimestamp()');
  
  // increment(n)
  content = content.replace(/increment\(([^)]+)\)/g, 'FieldValue.increment($1)');
  
  // writeBatch(db)
  content = content.replace(/writeBatch\(db\)/g, 'adminDb.batch()');
  
  // batch operations
  content = content.replace(/batch\.set\(doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\),\s*([^)]+)\)/g, 'batch.set(adminDb.collection("$1").doc($2), $3)');
  content = content.replace(/batch\.update\(doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\),\s*([^)]+)\)/g, 'batch.update(adminDb.collection("$1").doc($2), $3)');
  content = content.replace(/batch\.delete\(doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\)\)/g, 'batch.delete(adminDb.collection("$1").doc($2))');
  
  // Generic replacements for remaining doc/collection calls
  content = content.replace(/doc\(db,\s*["']([^"']+)["'],\s*([^)]+)\)/g, 'adminDb.collection("$1").doc($2)');
  content = content.replace(/collection\(db,\s*["']([^"']+)["']\)/g, 'adminDb.collection("$1")');
  
  // Remove any leftover standalone db references
  content = content.replace(/const db = .*;\n?/g, '');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Fixed automatically`);
    return true;
  }
  
  console.log(`   ⚠️  No changes made`);
  return false;
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

console.log('🔧 Fixing API routes to use Firebase Admin SDK...\n');

for (const dir of TARGET_DIRS) {
  walkDir(dir);
}

console.log('\n✨ Done!');
console.log('   Files with query() + where() chains were skipped — fix those manually.');
console.log('   Run `git diff` to review all changes.');