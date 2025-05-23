/**
 * Sends a message to the content script from the popup, options, or background page
 */
export async function sendToContent (tabId: number, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            const err = chrome.runtime.lastError
            if (err) reject(err)
            else resolve(response)
        })
    })
}