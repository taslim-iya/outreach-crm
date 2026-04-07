import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger with Ctrl/Cmd + key combos
      if (!(e.ctrlKey || e.metaKey)) return;
      // Don't trigger in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.key) {
        case 'd':
          e.preventDefault();
          navigate('/');
          break;
        case 'i':
          e.preventDefault();
          navigate('/investors');
          break;
        case 'k':
          e.preventDefault();
          navigate('/contacts');
          break;
        case 'e':
          e.preventDefault();
          navigate('/inbox');
          break;
        case 't':
          e.preventDefault();
          navigate('/tasks');
          break;
        case 'o':
          e.preventDefault();
          navigate('/outreach');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
