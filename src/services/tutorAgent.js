const fallbackReplies = {
  default: "I am in offline mode, so I can answer the built-in study topics and simple calculations. Add a Gemini or OpenAI API key to answer any question accurately.",
  explain: "Tell me the exact concept or paste the question. I will break it into the known facts, reasoning, and final answer.",
  plan: "Here is a focused 25-minute sprint: 5 minutes to recall what you know, 12 minutes to study one concept, 5 minutes to practice, and 3 minutes to write one takeaway.",
  quiz: "Quick check: which part of this topic would you like to test first: definitions, application, or exam-style reasoning?"
};

const knowledgeBase = [
  {
    terms: ['maths', 'mathematics', 'what is math', 'what is maths'],
    answer: "Mathematics is the study of numbers, quantities, shapes, patterns, and logical relationships. It includes areas such as arithmetic, algebra, geometry, statistics, and calculus.\n\nExample: arithmetic works with calculations like 2 + 2, while algebra uses symbols to represent unknown values."
  },
  {
    terms: ['cellular respiration', 'respiration', 'electron transport chain', 'atp'],
    answer: "Cellular respiration is the process cells use to release usable energy from glucose. In aerobic respiration, glucose is broken down through glycolysis, the Krebs cycle, and the electron transport chain. Oxygen accepts the final electrons, allowing the chain to keep producing ATP.\n\nReasoning: without oxygen as the final acceptor, electron flow stops and the cell makes much less ATP.\n\nCheck yourself: why does intense exercise make muscle cells rely more on fermentation?"
  },
  {
    terms: ['quadratic equation', 'quadratic equations', 'parabola', 'factorise', 'factorize'],
    answer: "A quadratic equation has the form ax² + bx + c = 0, where a is not zero. You can solve it by factorising, completing the square, or using x = (-b ± √(b² - 4ac)) / 2a.\n\nReasoning: the discriminant b² - 4ac tells you the number of real solutions: positive means two, zero means one repeated solution, and negative means no real solutions.\n\nCheck yourself: what does the graph look like when the discriminant is zero?"
  },
  {
    terms: ['french revolution', 'french revolution', '1789', 'bastille'],
    answer: "The French Revolution began in 1789 because financial crisis, unequal taxation, social inequality, and Enlightenment ideas weakened the old monarchy. The storming of the Bastille became a powerful symbol of the uprising.\n\nReasoning: the revolution was not caused by one event; long-term structural inequality combined with an immediate financial crisis.\n\nCheck yourself: why did the Third Estate feel politically underrepresented?"
  },
  {
    terms: ['photosynthesis'],
    answer: "Photosynthesis converts light energy into chemical energy. Chlorophyll absorbs light, water is split to provide electrons and hydrogen ions, and carbon dioxide is fixed into glucose in the Calvin cycle. Oxygen is released from the splitting of water.\n\nReasoning: the plant does not turn carbon dioxide directly into energy; it uses light energy to build glucose, which can later be used in respiration.\n\nCheck yourself: why is chlorophyll important?"
  },
  {
    terms: ['father of our nation', 'father of the nation', 'mahatma gandhi', 'national father'],
    answer: "In India, Mahatma Gandhi is commonly called the Father of the Nation. His full name was Mohandas Karamchand Gandhi. He led the Indian independence movement through non-violent civil disobedience.\n\nNote: this is a popular honorific; it is not a formal constitutional title.\n\nCheck yourself: what does non-violent civil disobedience mean?"
  },
  {
    terms: ['national bird of india', 'bird of india', 'india national bird'],
    answer: "The Indian peafowl, commonly called the peacock, is the national bird of India. Its scientific name is Pavo cristatus.\n\nReasoning: it was chosen for its wide distribution, cultural significance, and distinctive appearance.\n\nCheck yourself: what is the female peafowl called?"
  },
  {
    terms: ['colour of milk', 'color of milk', 'milk colour', 'milk color'],
    answer: "Milk is usually white because tiny fat droplets and casein particles scatter light in many directions. The natural pigment riboflavin can give it a slight yellow tint, especially in some animal milk.\n\nCheck yourself: why can skimmed milk look slightly bluish?"
  },
  {
    terms: ['colour of an apple', 'color of an apple', 'apple colour', 'apple color'],
    answer: "An apple can be red, green, or yellow, depending on its variety and ripeness. Red apples contain more anthocyanin pigment in their skin, while green apples retain more chlorophyll.\n\nCheck yourself: which part of an apple usually contains the most visible colour?"
  }
];

function classify(prompt) {
  const value = prompt.toLowerCase();
  if (value.includes('plan') || value.includes('schedule') || value.includes('study')) return 'plan';
  if (value.includes('quiz') || value.includes('test me')) return 'quiz';
  if (value.includes('explain') || value.includes('understand') || value.includes('what is')) return 'explain';
  return 'default';
}

function findKnowledgeAnswer(prompt) {
  const normalizedPrompt = prompt.toLowerCase();
  return knowledgeBase.find((entry) => entry.terms.some((term) => normalizedPrompt.includes(term)))?.answer;
}

function calculateSimpleExpression(prompt) {
  const expression = prompt.toLowerCase().replace(/what is|calculate|solve|equals|\?/g, '').trim();
  if (!/^[\d\s()+\-*/.]+$/.test(expression) || !/[+\-*/]/.test(expression)) return null;
  const numbers = expression.match(/\d+(?:\.\d+)?/g);
  const operators = expression.match(/[+\-*/]/g);
  if (!numbers || !operators || numbers.length !== operators.length + 1) return null;
  let result = Number(numbers[0]);
  for (let index = 0; index < operators.length; index += 1) {
    const value = Number(numbers[index + 1]);
    if (operators[index] === '+') result += value;
    if (operators[index] === '-') result -= value;
    if (operators[index] === '*') result *= value;
    if (operators[index] === '/') {
      if (value === 0) return 'Division by zero is undefined.';
      result /= value;
    }
  }
  return `Answer: ${result}`;
}

export async function askTutor(prompt, context = {}, signal) {
  try {
    const localResponse = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, context }),
      signal
    });
    if (localResponse.ok) {
      const data = await localResponse.json();
      if (data.reply) return data.reply;
    }
  } catch {
    if (signal?.aborted) throw new DOMException('Request stopped', 'AbortError');
    // The static demo can continue with the configured client endpoint or offline mode.
  }

  const endpoint = import.meta.env.VITE_AI_API_URL;
  const key = import.meta.env.VITE_AI_API_KEY;
  if (endpoint && key) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ message: prompt, context }),
        signal
      });
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      return data.reply || data.message || fallbackReplies.default;
    } catch {
      if (signal?.aborted) throw new DOMException('Request stopped', 'AbortError');
      return "I couldn't reach the AI service, so I switched to offline tutor mode. " + fallbackReplies[classify(prompt)];
    }
  }
  if (signal?.aborted) throw new DOMException('Request stopped', 'AbortError');
  await new Promise((resolve) => setTimeout(resolve, 650));
  if (signal?.aborted) throw new DOMException('Request stopped', 'AbortError');
  const calculation = calculateSimpleExpression(prompt);
  if (calculation) return calculation;
  const groundedAnswer = findKnowledgeAnswer(prompt);
  if (groundedAnswer) return groundedAnswer;
  return fallbackReplies[classify(prompt)];
}

export function buildQuiz(topic) {
  return [
    { question: `Which statement best captures the core idea of ${topic}?`, options: ['A useful rule applied to a real problem', 'A list to memorise without context', 'A random collection of facts', 'A topic that cannot be practised'], answer: 0 },
    { question: `What is the best first move when revising ${topic}?`, options: ['Skip straight to the hardest question', 'Recall what you already know', 'Read every page again', 'Wait until the night before'], answer: 1 },
    { question: `How can you check whether you understand ${topic}?`, options: ['Highlight more sentences', 'Explain it in your own words', 'Look at the title', 'Copy a definition'], answer: 1 }
  ];
}
