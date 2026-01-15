import React from 'react';
import { Building, MapPin, Calendar, Edit, Trash2, ExternalLink, User, Mail, DollarSign } from 'lucide-react';
import { JobApplication } from '../types/JobApplication';

interface JobApplicationCardProps {
  application: JobApplication;
  onEdit: (application: JobApplication) => void;
  onDelete: (id: string) => void;
}

const statusColors = {
  applied: 'bg-blue-100 text-blue-800 border-blue-200',
  interview: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  offer: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const CONCOURS_REMINDER_WINDOW_DAYS = 7;

const getDaysBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_IN_MS);
};

const JobApplicationCard: React.FC<JobApplicationCardProps> = ({ application, onEdit, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      onDelete(application.id);
    }
  };

  const concoursDaysLeft = application.offerDate && application.concoursDate
    ? getDaysBetween(application.offerDate, application.concoursDate)
    : null;

  const isConcoursReminderDue = typeof concoursDaysLeft === 'number'
    && concoursDaysLeft >= 0
    && concoursDaysLeft <= CONCOURS_REMINDER_WINDOW_DAYS;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{application.position}</h3>
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
            <Building className="w-4 h-4 mr-2" />
            <span className="font-medium">{application.company}</span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{application.location}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(application)}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Edit application"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete application"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[application.status]}`}>
          {statusLabels[application.status]}
        </span>
      </div>

      {/* Application Date */}
      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4">
        <Calendar className="w-4 h-4 mr-2" />
        <span>Applied on {new Date(application.applicationDate).toLocaleDateString()}</span>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 mb-4">
        {application.salary && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
            <DollarSign className="w-4 h-4 mr-2" />
            <span>{application.salary}</span>
          </div>
        )}
        
        {application.contactPerson && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
            <User className="w-4 h-4 mr-2" />
            <span>{application.contactPerson}</span>
          </div>
        )}
        
        {application.contactEmail && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
            <Mail className="w-4 h-4 mr-2" />
            <span>{application.contactEmail}</span>
          </div>
        )}

        {application.offerDate && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Offer date: {new Date(application.offerDate).toLocaleDateString()}</span>
          </div>
        )}

        {application.concoursDate && (
          <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Concours date: {new Date(application.concoursDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {isConcoursReminderDue && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <span>
            Concours is coming up {typeof concoursDaysLeft === 'number' ? `in ${concoursDaysLeft} day${concoursDaysLeft === 1 ? '' : 's'}` : ''}.
          </span>
        </div>
      )}

      {/* Notes */}
      {application.notes && (
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">{application.notes}</p>
        </div>
      )}

      {/* Job URL */}
      {application.jobUrl && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Job Posting
          </a>
        </div>
      )}
    </div>
  );
};

export default JobApplicationCard;
