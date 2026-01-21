export type CardColor = 'default' | 'yellow' | 'blue' | 'pink'; // Эстетика карточек

export interface Card {
  id: string;
  content: string;
  user_id?: string;       // Поле от Supabase
  created_at?: string;    // В базе это строка (ISO), а не число!
  color: CardColor;
  isFocus?: boolean;      // Опционально, если используете фокус
  order: number;
  is_archived: boolean;
}

export type SortMode = 'custom' | 'newest' | 'oldest';

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  type: 'info' | 'warning' | 'danger';
  onConfirm: () => void; // Колбэк, который сработает при "ОК"
}
