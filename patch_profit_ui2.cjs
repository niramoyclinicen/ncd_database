const fs = require('fs');
let content = fs.readFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', 'utf8');

// Splitting content at "section-profit-share" to only replace inside the profit share tab
let parts = content.split('id="section-profit-share"');
if (parts.length > 1) {
    let profitShareSection = parts[1];
    profitShareSection = profitShareSection.replace(/safeNum\(adj\.profitDist\)/g, 'safeNum(profitShareAdj.profitDist)');
    profitShareSection = profitShareSection.replace(/adj\.profitDist/g, 'profitShareAdj.profitDist');
    profitShareSection = profitShareSection.replace(/updateAdjustment\('profitDist'/g, 'updateProfitShareAdjustment(\'profitDist\'');
    profitShareSection = profitShareSection.replace(/summary\.totalShares/g, 'profitShareTotalShares');
    profitShareSection = profitShareSection.replace(/summary\.profitPerShare/g, 'profitSharePerShare');

    content = parts[0] + 'id="section-profit-share"' + profitShareSection;
    fs.writeFileSync('/app/applet/components/ConsolidatedAccountsPage.tsx', content);
    console.log("Done phase 3");
} else {
    console.log("Could not find section-profit-share");
}
