const fields = ['position', 'company', 'location', 'jobUrl', 'notes'];

const getAppUrlInput = () => document.getElementById('appUrl');
const getStatus = () => document.getElementById('status');

const loadStoredAppUrl = () => {
  const storedUrl = localStorage.getItem('jobflow_app_url');
  if (storedUrl) {
    getAppUrlInput().value = storedUrl;
  } else {
    getAppUrlInput().value = 'https://anassabbou.github.io/JobFlow/';
  }
};

const readForm = () => {
  const data = {};
  fields.forEach((field) => {
    data[field] = document.getElementById(field).value.trim();
  });
  return data;
};

const setForm = (data) => {
  fields.forEach((field) => {
    if (data[field] !== undefined) {
      document.getElementById(field).value = data[field] || '';
    }
  });
};

const setStatus = (message) => {
  getStatus().textContent = message;
};

document.getElementById('capture').addEventListener('click', async () => {
  setStatus('Capturing offer...');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('Unable to read the active tab.');
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'JOBFLOW_CAPTURE' });
    if (response?.data) {
      setForm(response.data);
      setStatus('Offer captured.');
    } else {
      setStatus('No offer data found on this page.');
    }
  } catch (error) {
    setStatus('Failed to capture. Make sure you are on emploi-public.ma.');
  }
});

document.getElementById('open').addEventListener('click', () => {
  const appUrl = getAppUrlInput().value.trim();
  if (!appUrl) {
    setStatus('Please enter your JobFlow URL.');
    return;
  }

  localStorage.setItem('jobflow_app_url', appUrl);
  const data = readForm();
  const params = new URLSearchParams({
    import: '1',
    company: data.company || '',
    position: data.position || '',
    location: data.location || '',
    jobUrl: data.jobUrl || '',
    notes: data.notes || '',
  });

  const url = `${appUrl}${appUrl.includes('?') ? '&' : '?'}${params.toString()}`;
  chrome.tabs.create({ url });
});

loadStoredAppUrl();
