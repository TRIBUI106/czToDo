import React from 'react';

type FilterStatus = 'active' | 'completed' | 'archived' | 'all';

interface FilterBarProps {
  currentFilter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
}

export default function FilterBar({
  currentFilter,
  onFilterChange,
}: FilterBarProps) {
  const filters: FilterStatus[] = ['all', 'active', 'completed'];

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '8px',
      }}
    >
      {filters.map(filter => (
        <button
          key={filter}
          onClick={() => onFilterChange(filter)}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            backgroundColor:
              currentFilter === filter
                ? 'var(--color-primary)'
                : 'transparent',
            color:
              currentFilter === filter
                ? 'white'
                : 'var(--color-text)',
            border:
              currentFilter === filter
                ? `1px solid var(--color-primary)`
                : `1px solid var(--color-border)`,
            borderRadius: '4px',
            cursor: 'pointer',
            textTransform: 'capitalize',
            fontWeight:
              currentFilter === filter ? 600 : 400,
          }}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
