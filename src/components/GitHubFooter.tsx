import { useState, useEffect } from 'react';
import { FaGithub } from 'react-icons/fa';
import { Star } from 'lucide-react';

const REPO_URL = 'https://github.com/charlite/email-signature-editor';
const GITHUB_API = 'https://api.github.com/repos/charlite/email-signature-editor';

export function GitHubFooter() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch(GITHUB_API)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  return (
    <footer className="flex shrink-0 items-center justify-center border-t border-border bg-background/80 py-3 backdrop-blur-sm">
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:text-foreground hover:shadow-md"
      >
        <FaGithub className="text-lg transition-transform group-hover:scale-110" />
        <span>@charlite</span>
        {stars !== null && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            <Star className="size-3 fill-current" />
            {stars}
          </span>
        )}
      </a>
    </footer>
  );
}
