# nabokov-shuffle

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
# Особенности проекта

## TransitionGroup

TransitionGroup — это специальный компонент, предназначенный для анимации списка элементов, которые отображаются через v-for. Его главная задача — отслеживать, когда элементы в списке добавляются, удаляются или меняют свой порядок.​

Как он работает?
Когда ты оборачиваешь v-for в <TransitionGroup>, Vue начинает следить за каждым элементом в этом списке (именно поэтому key для каждого элемента является обязательным).​

Когда список изменяется (например, ты нажимаешь "Shuffle" и массив cards перемешивается), Vue делает следующее:

Сравнивает: Он смотрит на DOM "до" и "после" изменения.

Обнаруживает изменения: Он видит, что элемент A теперь на месте элемента B, а элемент B — на месте элемента C, и так далее.

Применяет классы: На основе этих изменений он в определенные моменты времени автоматически добавляет и удаляет CSS-классы для соответствующих элементов.​

Как формируются имена классов?
Вот здесь и кроется ответ на твой вопрос. Имена классов формируются по шаблону: name + - + суффикс состояния.
В нашем случае name="cards-shuffle", поэтому классы будут:
```css
cards-shuffle-enter-from

cards-shuffle-enter-active

cards-shuffle-enter-to

cards-shuffle-leave-from

cards-shuffle-leave-active

cards-shuffle-leave-to

cards-shuffle-move // (самый важный для нас!)
```

Жизненный цикл анимации (суффиксы)
Представь, что мы добавляем новую карточку:
```text

...-enter-from: Класс, который применяется к элементу в самый первый кадр, когда он появляется. В нем мы задаем начальное состояние анимации (например, opacity: 0; transform: scale(0.8);).​

...-enter-active: Класс, который "висит" на элементе на протяжении всей анимации его появления. В нем мы задаем transition (например, transition: all 0.5s ease;). Vue ждет, пока эта анимация завершится.​

...-enter-to: Класс, который определяет конечное состояние элемента после завершения анимации (по умолчанию Vue просто убирает -from, но его можно задать явно).
```

С удалением (leave) все аналогично, но в обратном порядке.

Что такое класс .move?
Это особая "фишка" именно TransitionGroup.
```
.cards-shuffle-move: Этот класс применяется к элементам, которые не удаляются и не добавляются, а просто меняют свое положение на экране. В нашем случае, когда мы вызываем shuffleCards(), все карточки остаются на месте, но их порядок меняется. Vue вычисляет их старые и новые позиции и плавно перемещает их из точки А в точку Б, применяя к ним этот класс.​
```
Внутри этого класса мы просто пишем:
```css
.cards-shuffle-move {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
```
Это означает: "Если ты, Vue, решил передвинуть этот элемент, делай это плавно в течение 0.5 секунды".

Итог
TransitionGroup — это не просто CSS. Это полноценный механизм рендеринга, который автоматизирует добавление CSS-классов на основе жизненного цикла элементов в списке. Тебе нужно лишь описать стили для этих классов, а Vue сам позаботится о том, чтобы вовремя их применить. Это позволяет создавать сложные и плавные анимации списков декларативно, практически без JavaScript.
