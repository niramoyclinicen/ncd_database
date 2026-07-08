const fs = require('fs');
let code = fs.readFileSync('components/ConsolidatedAccountsPage.tsx', 'utf8');

const boundaryCode = `
import React, { ErrorInfo } from 'react';
class AccountsErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any}> {
    constructor(props: any) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
    static getDerivedStateFromError(error: any) { return { hasError: true }; }
    componentDidCatch(error: any, errorInfo: any) { this.setState({ error, errorInfo }); console.error(error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return <div className="p-10 text-red-600 bg-red-50 w-full h-full overflow-auto font-mono"><h2>Error in Accounts Page! Please screenshot this:</h2><pre className="text-xs mt-4 whitespace-pre-wrap font-bold">{String(this.state.error)}</pre><pre className="text-xs mt-4 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre></div>;
        }
        return this.props.children;
    }
}

const WrappedConsolidatedAccountsPage = (props: any) => (
    <AccountsErrorBoundary>
        <ConsolidatedAccountsPage {...props} />
    </AccountsErrorBoundary>
);

export default WrappedConsolidatedAccountsPage;
`;

// Replace export default ConsolidatedAccountsPage; with boundaryCode
// But wait, React is already imported. We don't want duplicate `import React`. 
// So let's just use React.Component

code = code.replace(/export default ConsolidatedAccountsPage;/, `
class AccountsErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any}> {
    constructor(props: any) { super(props); this.state = { hasError: false, error: null, errorInfo: null }; }
    static getDerivedStateFromError(error: any) { return { hasError: true }; }
    componentDidCatch(error: any, errorInfo: any) { this.setState({ error, errorInfo }); console.error(error, errorInfo); }
    render() {
        if (this.state.hasError) {
            return <div className="p-10 text-red-600 bg-red-50 w-full h-full overflow-auto font-mono z-50 fixed inset-0"><h2>Error in Accounts Page! Please screenshot this:</h2><pre className="text-xs mt-4 whitespace-pre-wrap font-bold">{String(this.state.error)}</pre><pre className="text-xs mt-4 whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre><button onClick={()=>window.location.reload()} className="mt-4 p-2 bg-red-600 text-white rounded">Reload</button></div>;
        }
        return this.props.children;
    }
}

const WrappedConsolidatedAccountsPage = (props: any) => (
    <AccountsErrorBoundary>
        <ConsolidatedAccountsPage {...props} />
    </AccountsErrorBoundary>
);

export default WrappedConsolidatedAccountsPage;
`);

fs.writeFileSync('components/ConsolidatedAccountsPage.tsx', code);
