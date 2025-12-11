export type CardColor = 'default' | 'yellow' | 'blue' | 'pink'; // Эстетика карточек

export interface Card {
  id: string;
  content: string;      // Текст заметки
  createdAt: number;    // Timestamp
  color: CardColor;     // Цвет фона
  isFocus: boolean;     // Если мы хотим развернуть карточку на весь экран
}
