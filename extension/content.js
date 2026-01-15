const findOfferLink = () => {
  const links = Array.from(document.querySelectorAll('a'))
    .filter((link) => link.href && link.href.includes('concours'));

  return links.length ? links[0] : null;
};

const extractOfferData = () => {
  const link = findOfferLink();
  const container = link ? link.closest('article, li, div') : null;
  const text = container ? container.textContent || '' : document.body.innerText || '';
  const titleCandidate = link?.textContent?.trim() || document.querySelector('h1, h2')?.textContent?.trim() || '';

  return {
    position: titleCandidate,
    company: 'Emploi Public',
    location: '',
    jobUrl: link?.href || window.location.href,
    notes: text.slice(0, 400).trim(),
  };
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'JOBFLOW_CAPTURE') {
    try {
      const data = extractOfferData();
      sendResponse({ data });
    } catch (error) {
      sendResponse({ data: null });
    }
  }
});
