/**
 * Utility to check connectivity to external service endpoints.
 * This helps identify if the user's network (VPN, Firewall, etc.) is blocking necessary services.
 */

export const ENDPOINTS = {
    ALGORAND_TESTNET: '/algonode-testnet/health',
    FIREBASE: 'https://www.gstatic.com/generate_204', // Google's connectivity check
    PERA_WALLET: 'https://perawallet.app', // Main site is more reliable for reachability
};

export async function checkEndpointReachability(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors', // We only care if we can reach it, not about the response content
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return true; // If we get here, the endpoint is reachable
    } catch (error) {
        console.warn(`Endpoint ${url} is unreachable:`, error);
        return false;
    }
}

export async function diagnoseNetworkIssues() {
    const results = await Promise.all(
        Object.entries(ENDPOINTS).map(async ([name, url]) => ({
            name,
            reachable: await checkEndpointReachability(url),
        }))
    );

    const unreachable = results.filter((r) => !r.reachable);

    if (unreachable.length > 0) {
        const serviceNames = unreachable.map((r) => r.name).join(', ');
        return {
            status: 'blocked',
            message: `Your network appears to be blocking the following services: ${serviceNames}. Please check your VPN, Firewall, or ISP restrictions.`,
            unreachable,
        };
    }

    return { status: 'ok', message: 'All services appear reachable.' };
}
