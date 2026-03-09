import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const navigate = useNavigate();
  const count = notifications.length;

  return (
    <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
      <Bell className="h-5 w-5 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground px-1">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Button>
  );
}
