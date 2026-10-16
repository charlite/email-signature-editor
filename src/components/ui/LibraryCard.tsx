import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LibraryCardProps {
  /** The main content of the card (e.g., an iframe preview) */
  content: React.ReactNode;
  /** The primary title shown on the card */
  title: string;
  /** Optional subtitle for additional context (e.g., creation date or status) */
  subtitle?: string;
  /** Optional badge shown next to the title */
  badge?: React.ReactNode;
  /** Actions to be displayed in the footer of the card, such as buttons */
  footerActions?: React.ReactNode;
  /** Click handler for the entire card */
  onClick?: () => void;
  /** Keyboard event handler for accessibility (e.g., Enter/Space to trigger onClick) */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

export function LibraryCard({
  content,
  title,
  subtitle,
  badge,
  footerActions,
  onClick,
  onKeyDown,
  className,
}: LibraryCardProps) {
  return (
    <li className="min-w-0">
      <Card
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={cn(
          'group flex h-full cursor-pointer flex-col gap-0 overflow-hidden rounded-xl border-border/80 py-0 shadow-sm transition-all duration-200',
          'hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className
        )}
      >
        <div className="relative border-b border-border/60 bg-transparent">
          {content}
        </div>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="line-clamp-2 text-sm font-medium leading-snug">{title}</p>
                {badge}
              </div>
              {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">{footerActions}</div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}