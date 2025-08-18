// Content script for JobFlow Autofill extension
const JOBFLOW_HOSTS = ['anassabbou.github.io', 'localhost'];

function isJobFlowApp() {
  return JOBFLOW_HOSTS.some(host => location.host.includes(host));
}

function saveApplicationsFromJobFlow() {
  try {
    const data = localStorage.getItem('job_applications');
    if (data) {
      const applications = JSON.parse(data);
      chrome.storage.local.set({ jobApplications: applications });
    }
  } catch (err) {
    console.warn('JobFlow Autofill: unable to save applications', err);
  }
}

function fillForm(application) {
  if (!application) return;
  const mappings = {
    'input[name="position"], input[name="job_title"], input[name="title"]': application.position,
    'input[name="company"], input[name="employer"], input[name="organization"]': application.company,
    'input[name="location"], input[name="city"], input[name="address"]': application.location,
    'textarea[name="description"], textarea[name="job_description"]': application.description
  };

  Object.entries(mappings).forEach(([selector, value]) => {
    const field = document.querySelector(selector);
    if (field && typeof value === 'string') {
      field.value = value;
    }
  });
}

if (isJobFlowApp()) {
  // When on the JobFlow app, sync applications to extension storage
  saveApplicationsFromJobFlow();
} else {
  // On other pages, try to fill forms with stored data
  chrome.storage.local.get('jobApplications', result => {
    const apps = result.jobApplications || [];
    if (apps.length > 0) {
      fillForm(apps[0]);
    }
  });
}
