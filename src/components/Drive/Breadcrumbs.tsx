import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  breadcrumbs: Array<{ id: string; name: string }>;
  onNavigate: (id: string | null) => void;
  onHome: () => void;
}

export function Breadcrumbs({ breadcrumbs, onNavigate, onHome }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 mb-4 text-sm">
      <button
        onClick={onHome}
        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded transition"
      >
        <Home className="w-4 h-4" />
        <span>My Drive</span>
      </button>

      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => onNavigate(crumb.id)}
            className={`px-2 py-1 hover:bg-gray-100 rounded transition ${
              index === breadcrumbs.length - 1 ? 'font-medium text-gray-800' : 'text-gray-600'
            }`}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
