import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/providers/theme-provider';

const themeLabels = {
  light: '亮色主题',
  dark: '暗色主题',
  system: '跟随系统',
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const Icon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  }[theme];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={toggleTheme}
        >
          <Icon className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">切换主题 - 当前: {themeLabels[theme]}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>当前: {themeLabels[theme]} · 点击切换</p>
      </TooltipContent>
    </Tooltip>
  );
}