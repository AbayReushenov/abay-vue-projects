export type CardColor = 'default' | 'yellow' | 'blue' | 'pink'; // Эстетика карточек

export interface Card {
  id: string;
  content: string;
  user_id?: string;       // Поле от Supabase
  created_at?: string;    // В базе это строка (ISO), а не число!
  color: CardColor;
  isFocus?: boolean;      // Опционально, если используете фокус
  order: number;          // <-- Новое поле
}
