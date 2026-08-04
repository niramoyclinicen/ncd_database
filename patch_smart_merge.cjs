const fs = require('fs');
let content = fs.readFileSync('dbService.ts', 'utf8');

const newMethod = `  smartMergeByDate: async (localData: any, targetDate: string, onProgress?: (p: number) => void) => {
    try {
      if (!supabase) return false;
      onProgress?.(5);

      // Fetch latest cloud state
      const { data: cloudRecord } = await supabase
        .from('ncd_state')
        .select('data')
        .eq('id', 1)
        .single();
        
      let mergedData = (cloudRecord?.data && typeof cloudRecord.data === 'object' && !Array.isArray(cloudRecord.data)) 
        ? { ...cloudRecord.data } 
        : {};

      let totalAdded = 0;

      // Iterate and merge
      Object.keys(localData).forEach(key => {
        const localArray = localData[key];
        if (!Array.isArray(localArray)) return;

        if (!mergedData[key]) mergedData[key] = [];
        const cloudArray = mergedData[key];
        
        // Build a Set of existing IDs in cloud
        const existingIds = new Set();
        cloudArray.forEach((item: any) => {
            const id = item.id || item.pt_id || item.invoice_id || item.test_id || item.emp_id || item.reagent_id;
            if (id) existingIds.add(String(id));
        });

        // Filter local data by date and add if missing
        localArray.forEach((item: any) => {
            // Determine item's date
            let itemDate = item.date || item.invoice_date || item.createdAt || item.payment_date || item.expense_date || item.usageStartDate;
            if (itemDate && typeof itemDate === 'string') {
                itemDate = itemDate.split('T')[0];
            }

            // If a targetDate is provided, skip items that don't match
            if (targetDate && itemDate !== targetDate) return;

            const id = item.id || item.pt_id || item.invoice_id || item.test_id || item.emp_id || item.reagent_id;
            if (id && !existingIds.has(String(id))) {
                cloudArray.push(item);
                existingIds.add(String(id));
                totalAdded++;
            }
        });
      });

      if (totalAdded === 0) {
          return { success: true, message: "নতুন কোনো ডাটা পাওয়া যায়নি যা অনলাইনে নেই!" };
      }

      onProgress?.(50);

      // Save back to cloud
      const { error } = await supabase
        .from('ncd_state')
        .upsert({ 
          id: 1, 
          data: mergedData, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (error) throw error;
      onProgress?.(100);
      return { success: true, message: \`সফলভাবে \${totalAdded} টি নতুন রেকর্ড অনলাইনে যুক্ত করা হয়েছে!\` };

    } catch (e: any) {
      console.error('Smart merge failed:', e);
      return { success: false, message: e.message };
    }
  },
`;

if (!content.includes('smartMergeByDate:')) {
    content = content.replace('saveInChunks: async (appState: any, onProgress?: (p: number) => void) => {', newMethod + '\n  saveInChunks: async (appState: any, onProgress?: (p: number) => void) => {');
    fs.writeFileSync('dbService.ts', content);
    console.log("Patched dbService.ts successfully");
} else {
    console.log("smartMergeByDate already exists");
}
