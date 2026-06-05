export interface QuizQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  category: 'world-cup' | 'cpfc';
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Which country has won the most FIFA World Cups?",
    options: ["Germany", "Brazil", "Italy", "Argentina"],
    correctIndex: 1,
    category: 'world-cup',
  },
  {
    id: 2,
    question: "Who scored the infamous 'Hand of God' goal at the 1986 World Cup?",
    options: ["Pelé", "Ronaldo", "Diego Maradona", "Zinedine Zidane"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 3,
    question: "What year was the first FIFA World Cup held?",
    options: ["1926", "1930", "1934", "1938"],
    correctIndex: 1,
    category: 'world-cup',
  },
  {
    id: 4,
    question: "Which country hosted the 2022 FIFA World Cup?",
    options: ["Saudi Arabia", "UAE", "Qatar", "Bahrain"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 5,
    question: "Who won the Golden Boot at the 2022 World Cup?",
    options: ["Lionel Messi", "Kylian Mbappé", "Karim Benzema", "Neymar"],
    correctIndex: 1,
    category: 'world-cup',
  },
  {
    id: 6,
    question: "Who holds the all-time record for most World Cup goals?",
    options: ["Cristiano Ronaldo", "Lionel Messi", "Miroslav Klose", "Pelé"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 7,
    question: "Which country won the 2018 FIFA World Cup?",
    options: ["Croatia", "Belgium", "France", "England"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 8,
    question: "How many teams will compete in the 2026 World Cup?",
    options: ["32", "40", "48", "36"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 9,
    question: "Which three nations will co-host the 2026 World Cup?",
    options: ["USA, Canada & Mexico", "USA, Brazil & Mexico", "UK, USA & Canada", "Germany, France & Spain"],
    correctIndex: 0,
    category: 'world-cup',
  },
  {
    id: 10,
    question: "Which African team made the semi-finals at the 2022 World Cup?",
    options: ["Nigeria", "Morocco", "Senegal", "Egypt"],
    correctIndex: 1,
    category: 'world-cup',
  },
  {
    id: 11,
    question: "Who did England beat in the 1966 World Cup Final?",
    options: ["France", "Brazil", "West Germany", "Argentina"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 12,
    question: "Which country did Messi win the 2022 World Cup with?",
    options: ["Brazil", "Argentina", "Spain", "France"],
    correctIndex: 1,
    category: 'world-cup',
  },
  {
    id: 13,
    question: "In which year did France first win the World Cup?",
    options: ["1986", "1994", "1998", "2002"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 14,
    question: "How many goals did England score in the 1966 World Cup Final?",
    options: ["2", "3", "4", "5"],
    correctIndex: 2,
    category: 'world-cup',
  },
  {
    id: 15,
    question: "Which stadium will host the 2026 World Cup Final?",
    options: ["Rose Bowl", "MetLife Stadium", "AT&T Stadium", "Levi's Stadium"],
    correctIndex: 1,
    category: 'world-cup',
  },
  {
    id: 16,
    question: "In what year was Crystal Palace FC founded?",
    options: ["1890", "1900", "1905", "1910"],
    correctIndex: 2,
    category: 'cpfc',
  },
  {
    id: 17,
    question: "What is Crystal Palace's home ground?",
    options: ["Craven Cottage", "Selhurst Park", "Stamford Bridge", "Loftus Road"],
    correctIndex: 1,
    category: 'cpfc',
  },
  {
    id: 18,
    question: "Which national team does former CPFC star Wilfried Zaha represent?",
    options: ["Ghana", "England", "Ivory Coast", "Senegal"],
    correctIndex: 2,
    category: 'cpfc',
  },
  {
    id: 19,
    question: "What are Crystal Palace's traditional team colours?",
    options: ["Red and White", "Blue and White", "Red and Blue", "Red and Gold"],
    correctIndex: 2,
    category: 'cpfc',
  },
  {
    id: 20,
    question: "What is Crystal Palace FC's famous nickname?",
    options: ["The Lions", "The Eagles", "The Hawks", "The Falcons"],
    correctIndex: 1,
    category: 'cpfc',
  },
];

export const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length; // 20
export const QUESTION_TIME_SECS = 30;
export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 50;

export function calcSpeedBonus(elapsedMs: number): number {
  const elapsed = elapsedMs / 1000;
  if (elapsed <= 10) return MAX_SPEED_BONUS;
  if (elapsed <= 20) return 25;
  if (elapsed <= 30) return 10;
  return 0;
}
