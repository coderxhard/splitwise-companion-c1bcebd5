import React from 'react';
import { Link } from 'react-router-dom';
import { Group } from '@/hooks/useGroups';
import { Building2, Home, Users, Building, ChevronRight } from 'lucide-react';

interface GroupCardProps {
  group: Group;
  memberCount?: number;
  index?: number;
}

const typeIcons: Record<string, React.ElementType> = {
  hostel: Building2,
  pg: Home,
  flat: Building,
  room: Users,
};

const typeLabels: Record<string, string> = {
  hostel: 'Hostel',
  pg: 'PG',
  flat: 'Flat',
  room: 'Room',
};

export const GroupCard: React.FC<GroupCardProps> = ({ group, memberCount, index = 0 }) => {
  const Icon = typeIcons[group.type] || Users;

  return (
    <Link to={`/groups/${group.id}`}>
      <div 
        className="card-elevated p-5 group cursor-pointer opacity-0 animate-fade-in-up"
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {group.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {typeLabels[group.type] || group.type}
                {memberCount !== undefined && ` • ${memberCount} member${memberCount !== 1 ? 's' : ''}`}
              </p>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {group.description}
                </p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};
